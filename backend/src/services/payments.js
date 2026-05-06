/**
 * Serviço de Pagamentos — MercadoPago (Pix).
 * Gabaritou v3 — BeConfident Model
 *
 * Integração com MercadoPago para pagamentos via Pix.
 * Preços: R$19,90 (lançamento — 6 meses) e R$24,90 (regular).
 */

import mercadopago from 'mercadopago';
import crypto from 'crypto';
import { query, queryOne } from '../db/connection.js';
import { PRICING } from '../config/constants.js';
import { formatBRL, randomCode, isValidUUID, isValidEmail } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const log = logger.child('PaymentsService');

/** Status válidos do MercadoPago */
const MP_STATUSES = ['pending', 'approved', 'rejected', 'cancelled', 'refunded'];

/**
 * Inicializa o SDK do MercadoPago com o access token.
 */
function initMercadoPago() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    log.error('MP_ACCESS_TOKEN não configurado');
    throw new Error('Erro de configuração do serviço de pagamento');
  }

  mercadopago.configure({
    access_token: accessToken,
  });

  log.info('MercadoPago SDK inicializado');
}

/**
 * Verifica a assinatura do webhook do MercadoPago.
 * @param {string} xSignature - Header x-signature do MercadoPago
 * @param {string} xRequestId - Header x-request-id do MercadoPago
 * @param {string} body - Body bruto da requisição (string)
 * @returns {boolean} true se a assinatura for válida
 */
export function verifyWebhookSignature(xSignature, xRequestId, body) {
  if (!xSignature || !process.env.MP_WEBHOOK_SECRET) {
    // If no secret configured, skip verification but log warning
    if (!process.env.MP_WEBHOOK_SECRET) {
      log.warn('MP_WEBHOOK_SECRET not configured — skipping webhook signature verification');
      return true;
    }
    return false;
  }

  try {
    const parts = xSignature.split(',');
    let ts = null;
    let v1 = null;

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key.trim() === 'ts') ts = value.trim();
      if (key.trim() === 'v1') v1 = value.trim();
    }

    if (!ts || !v1) {
      log.warn('Webhook signature missing ts or v1');
      return false;
    }

    const manifest = `id:${xRequestId};request-ts:${ts};key:${process.env.MP_WEBHOOK_SECRET};`;
    const expectedSig = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
      .update(manifest)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expectedSig, 'hex'));
  } catch (err) {
    log.error('Error verifying webhook signature', { erro: err.message });
    return false;
  }
}

/**
 * Determina o preço vigente com base na data de lançamento.
 * Preço de lançamento (R$19,90) por 6 meses, depois R$24,90.
 * @returns {Object} { price, label, tier, description }
 */
function getCurrentPricing() {
  // Data de lançamento do v3
  const launchDate = new Date(process.env.LAUNCH_DATE || '2025-01-01');
  const now = new Date();
  const monthsSinceLaunch = (now.getFullYear() - launchDate.getFullYear()) * 12
    + (now.getMonth() - launchDate.getMonth());

  if (monthsSinceLaunch < PRICING.launch.periodMonths) {
    return {
      price: PRICING.launch.price,
      label: PRICING.launch.label,
      tier: 'launch',
      description: PRICING.launch.description,
    };
  }

  return {
    price: PRICING.regular.price,
    label: PRICING.regular.label,
    tier: 'regular',
    description: PRICING.regular.description,
  };
}

/**
 * Cria um pagamento Pix no MercadoPago.
 *
 * @param {Object} params
 * @param {string} params.userId - ID do usuário no banco local
 * @param {string} params.userEmail - E-mail do usuário (obrigatório para MP)
 * @param {string} [params.userName] - Nome do usuário
 * @param {string} [params.userCpf] - CPF do usuário (opcional)
 * @returns {Promise<Object>} Dados do pagamento criado (inclui pix_code e pix_qr_code)
 */
export async function createPixPayment({ userId, userEmail, userName, userCpf }) {
  if (!userId || !userEmail) {
    throw new Error('Campos obrigatórios não fornecidos');
  }

  // Input validation
  if (!isValidUUID(userId)) {
    throw new Error('Formato de userId inválido');
  }
  if (!isValidEmail(userEmail)) {
    throw new Error('Formato de email inválido');
  }

  // Duplicate payment check: prevent creating multiple pending payments for same user
  const existingPayment = await queryOne(
    `SELECT id, status FROM payments WHERE user_id = $1 AND status = 'pending' AND created_at > NOW() - INTERVAL '1 hour'`,
    [userId]
  );
  if (existingPayment) {
    log.warn('Duplicate pending payment prevented', { userId, existingId: existingPayment.id });
    throw new Error('Já existe um pagamento pendente para este usuário. Aguarde ou verifique o status.');
  }

  initMercadoPago();

  const pricing = getCurrentPricing();
  const externalReference = `gab_${randomCode(16)}`;

  const paymentData = {
    transaction_amount: pricing.price,
    description: `Gabaritou Premium — ${pricing.label}`,
    payment_method_id: 'pix',
    payer: {
      email: userEmail,
      first_name: userName || 'Concurseiro',
      identification: userCpf ? { type: 'CPF', number: userCpf.replace(/\D/g, '') } : undefined,
    },
    external_reference: externalReference,
    notification_url: process.env.MP_WEBHOOK_URL || null,
  };

  log.info('Criando pagamento Pix', {
    userId,
    email: userEmail,
    valor: pricing.price,
    tier: pricing.tier,
  });

  try {
    const response = await mercadopago.payment.create(paymentData);
    const payment = response.body;

    // Salva o pagamento no banco local
    await query(
      `INSERT INTO payments
        (id, user_id, mercadopago_payment_id, mercadopago_external_reference,
         method, amount, status, pricing_tier, pix_code, pix_qr_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        randomCode(12),
        userId,
        String(payment.id),
        externalReference,
        'pix',
        pricing.price,
        payment.status || 'pending',
        pricing.tier,
        payment.point_of_interaction?.transaction_data?.qr_code || null,
        payment.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      ]
    );

    log.info('Pagamento Pix criado com sucesso', {
      userId,
      paymentId: payment.id,
      status: payment.status,
    });

    return {
      id: payment.id,
      status: payment.status,
      valor: pricing.price,
      valor_formatado: formatBRL(pricing.price),
      tier: pricing.tier,
      pix_code: payment.point_of_interaction?.transaction_data?.qr_code || null,
      pix_qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      external_reference: externalReference,
    };
  } catch (error) {
    log.error('Erro ao criar pagamento Pix', {
      userId,
      erro: error.message,
    });
    throw new Error('Erro ao criar pagamento');
  }
}

/**
 * Trata webhook do MercadoPago (notificação de pagamento).
 * Chamado automaticamente pelo MercadoPago quando o status muda.
 *
 * @param {Object} body - Body da notificação do MercadoPago
 * @returns {Promise<Object>} Resultado do processamento
 */
export async function handleWebhook(body) {
  const { type, data } = body || {};

  if (type !== 'payment') {
    log.debug('Webhook ignorado — tipo não é payment', { type });
    return { processado: false, motivo: 'tipo_nao_suportado' };
  }

  const paymentId = data?.id;
  if (!paymentId) {
    log.warn('Webhook sem payment ID');
    return { processado: false, motivo: 'payment_id_ausente' };
  }

  log.info('Webhook recebido — verificando pagamento', { paymentId });

  try {
    const paymentInfo = await verifyPayment(paymentId);

    if (paymentInfo.status === 'approved') {
      // Idempotency check: verify payment was not already approved
      const existingPayment = await queryOne(
        `SELECT id, status, user_id, pricing_tier FROM payments WHERE mercadopago_payment_id = $1`,
        [paymentId]
      );

      if (!existingPayment) {
        log.warn('Webhook para pagamento não encontrado localmente', { paymentId });
        return { processado: false, motivo: 'pagamento_nao_encontrado' };
      }

      if (existingPayment.status === 'approved') {
        log.info('Pagamento já foi processado anteriormente (idempotência)', { paymentId });
        return { processado: true, status: 'already_approved', userId: existingPayment.user_id };
      }

      // Use transaction: update payment + activate premium atomically
      await query('BEGIN');
      try {
        // Atualiza o pagamento local
        await query(
          `UPDATE payments
           SET status = 'approved', approved_at = NOW(), updated_at = NOW()
           WHERE mercadopago_payment_id = $1`,
          [paymentId]
        );

        // Ativa o premium do usuário
        await activatePremium(existingPayment.user_id, existingPayment.pricing_tier);

        await query('COMMIT');

        log.info('Pagamento aprovado — premium ativado', {
          paymentId,
          userId: existingPayment.user_id,
        });

        return {
          processado: true,
          status: 'approved',
          userId: existingPayment.user_id,
        };
      } catch (txError) {
        await query('ROLLBACK');
        throw txError;
      }
    }

    // Atualiza status para outros estados
    if (MP_STATUSES.includes(paymentInfo.status)) {
      await query(
        `UPDATE payments SET status = $1, updated_at = NOW() WHERE mercadopago_payment_id = $2`,
        [paymentInfo.status, paymentId]
      );
    }

    return {
      processado: true,
      status: paymentInfo.status,
    };
  } catch (error) {
    log.error('Erro ao processar webhook', { paymentId, erro: error.message });
    throw error;
  }
}

/**
 * Verifica o status de um pagamento no MercadoPago.
 * @param {string|number} paymentId - ID do pagamento no MercadoPago
 * @returns {Promise<Object>} Dados do pagamento
 */
export async function verifyPayment(paymentId) {
  initMercadoPago();

  try {
    const response = await mercadopago.payment.get(paymentId);
    const payment = response.body;

    return {
      id: payment.id,
      status: payment.status,
      amount: payment.transaction_amount,
      date_approved: payment.date_approved,
      date_created: payment.date_created,
      external_reference: payment.external_reference,
    };
  } catch (error) {
    log.error('Erro ao verificar pagamento', { paymentId, erro: error.message });
    throw new Error('Erro ao verificar pagamento');
  }
}

/**
 * Ativa o plano premium do usuário por 30 dias.
 * @param {string} userId - ID do usuário
 * @param {string} [pricingTier='launch'] - Tipo de preço aplicado
 * @returns {Promise<Object>} Resultado da ativação
 */
export async function activatePremium(userId, pricingTier = 'launch') {
  const diasPremium = 30;

  await query(
    `UPDATE users
     SET plan = 'premium',
         premium_until = NOW() + INTERVAL '1 month',
         updated_at = NOW()
     WHERE id = $1`,
    [userId]
  );

  log.info('Premium ativado para o usuário', {
    userId,
    diasPremium,
    pricingTier,
    premiumUntil: new Date(Date.now() + diasPremium * 24 * 60 * 60 * 1000).toISOString(),
  });

  return {
    userId,
    plan: 'premium',
    diasPremium,
    premium_until: new Date(Date.now() + diasPremium * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Cria um período de teste gratuito (7 dias).
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Resultado da criação do trial
 */
export async function createTrial(userId) {
  if (!userId) {
    throw new Error('userId é obrigatório para criar trial');
  }

  // Verifica se o usuário já tem um trial ativo
  const existing = await queryOne(
    `SELECT id, plan, premium_until FROM users WHERE id = $1 AND plan = 'trial' AND premium_until > NOW()`,
    [userId]
  );

  if (existing) {
    log.warn('Usuário já possui trial ativo', { userId });
    return {
      userId,
      plan: 'trial',
      premium_until: existing.premium_until,
      mensagem: 'Você já possui um período de teste ativo.',
    };
  }

  const diasTrial = PRICING.trialDays;

  await query(
    `UPDATE users
     SET plan = 'trial',
         premium_until = NOW() + INTERVAL '${diasTrial} days',
         updated_at = NOW()
     WHERE id = $1`,
    [userId]
  );

  log.info('Trial criado para o usuário', { userId, diasTrial });

  return {
    userId,
    plan: 'trial',
    diasTrial,
    premium_until: new Date(Date.now() + diasTrial * 24 * 60 * 60 * 1000).toISOString(),
    mensagem: `Período de teste de ${diasTrial} dias ativado!`,
  };
}

/**
 * Consulta o status de um pagamento no banco local.
 * @param {string} paymentId - ID do pagamento local (não o MP ID)
 * @returns {Promise<Object|null>}
 */
export async function getPaymentStatus(paymentId) {
  return queryOne(
    `SELECT * FROM payments WHERE id = $1`,
    [paymentId]
  );
}

/**
 * Consulta pagamentos de um usuário.
 * @param {string} userId
 * @returns {Promise<Object[]>}
 */
export async function getUserPayments(userId) {
  return query(
    `SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
}

export default {
  createPixPayment,
  handleWebhook,
  verifyPayment,
  activatePremium,
  createTrial,
  getPaymentStatus,
  getUserPayments,
  verifyWebhookSignature,
};
