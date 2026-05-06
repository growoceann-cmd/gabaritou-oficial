/**
 * Rotas de Pagamentos — Gabaritou v3
 * Endpoints para criação de pagamento Pix, webhook do MercadoPago e verificação de status.
 */
import { Router } from 'express';
import {
  createPixPayment,
  handleWebhook,
  verifyPayment,
  getPaymentStatus,
  verifyWebhookSignature,
} from '../../services/payments.js';
import { isValidUUID, isValidEmail, sanitizeInput } from '../../utils/helpers.js';
import logger from '../../utils/logger.js';

const log = logger.child('PaymentsRoutes');

const router = Router();

/**
 * POST /api/payments/create
 * Cria um novo pagamento Pix.
 * Body: { userId, userEmail, userName?, userCpf? }
 */
router.post('/create', async (req, res) => {
  try {
    const { userId, userEmail, userName, userCpf } = req.body;

    if (!userId || !userEmail) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campos obrigatórios: userId, userEmail',
        codigo: 'CAMPOS_OBRIGATORIOS',
      });
    }

    // Input validation
    if (!isValidUUID(userId)) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Formato de userId inválido (deve ser UUID)',
        codigo: 'USER_ID_INVALIDO',
      });
    }

    if (!isValidEmail(userEmail)) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Formato de email inválido',
        codigo: 'EMAIL_INVALIDO',
      });
    }

    const payment = await createPixPayment({
      userId,
      userEmail,
      userName: userName ? sanitizeInput(userName) : null,
      userCpf: userCpf || null,
    });

    res.status(201).json({
      sucesso: true,
      mensagem: `Pagamento Pix criado — ${payment.valor_formatado}`,
      dados: payment,
    });
  } catch (err) {
    log.error('Erro ao criar pagamento', { erro: err.message });
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao criar pagamento',
      codigo: 'ERRO_CRIAR_PAGAMENTO',
    });
  }
});

/**
 * POST /api/payments/webhook
 * Webhook do MercadoPago para notificações de pagamento.
 * Body: { type, data: { id } }
 */
router.post('/webhook', async (req, res) => {
  try {
    // Log request source IP
    const clientIp = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
    log.info('Webhook request received', {
      ip: clientIp,
      'x-signature': req.headers['x-signature'] ? 'present' : 'absent',
      'x-request-id': req.headers['x-request-id'] || 'absent',
    });

    // Verify webhook signature
    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'];
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    if (!verifyWebhookSignature(xSignature, xRequestId, rawBody)) {
      log.warn('Webhook signature verification failed', { ip: clientIp });
      return res.status(401).json({
        sucesso: false,
        erro: 'Assinatura do webhook inválida',
        codigo: 'ASSINATURA_INVALIDA',
      });
    }

    // MercadoPago envia notificações no body
    const body = req.body;

    if (!body || !body.type || !body.data) {
      log.warn('Webhook recebido sem dados válidos');
      return res.status(400).json({
        sucesso: false,
        erro: 'Formato de webhook inválido',
        codigo: 'WEBHOOK_INVALIDO',
      });
    }

    log.info('Webhook recebido', {
      type: body.type,
      paymentId: body.data?.id,
    });

    const result = await handleWebhook(body);

    res.json({
      sucesso: true,
      mensagem: 'Webhook processado',
      dados: result,
    });
  } catch (err) {
    log.error('Erro ao processar webhook', { erro: err.message });
    // Retorna 200 mesmo com erro para evitar retrys infinitos do MercadoPago
    res.status(200).json({
      sucesso: false,
      erro: 'Erro ao processar webhook (será retried)',
      codigo: 'ERRO_WEBHOOK',
    });
  }
});

/**
 * GET /api/payments/status/:paymentId
 * Consulta o status de um pagamento.
 */
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        sucesso: false,
        erro: 'paymentId é obrigatório',
        codigo: 'PAYMENT_ID_AUSENTE',
      });
    }

    // Tenta buscar no banco local primeiro
    const localPayment = await getPaymentStatus(paymentId);

    if (localPayment) {
      res.json({
        sucesso: true,
        mensagem: 'Status do pagamento',
        dados: {
          id: localPayment.id,
          status: localPayment.status,
          method: localPayment.method,
          amount: localPayment.amount,
          valor_formatado: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(localPayment.amount),
          created_at: localPayment.created_at,
          approved_at: localPayment.approved_at,
        },
      });
      return;
    }

    // Se não encontrou localmente, verifica no MercadoPago
    try {
      const mpPayment = await verifyPayment(paymentId);
      res.json({
        sucesso: true,
        mensagem: 'Status do pagamento (MercadoPago)',
        dados: mpPayment,
      });
    } catch {
      return res.status(404).json({
        sucesso: false,
        erro: 'Pagamento não encontrado',
        codigo: 'PAGAMENTO_NAO_ENCONTRADO',
      });
    }
  } catch (err) {
    log.error('Erro ao consultar status do pagamento', { erro: err.message });
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao consultar pagamento',
      codigo: 'ERRO_STATUS_PAGAMENTO',
    });
  }
});

export default router;
