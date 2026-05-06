/**
 * Rotas Admin — Gabaritou v3
 * Endpoints administrativos protegidos por admin_secret.
 */
import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth.js';
import { query, queryOne } from '../../db/connection.js';
import { sanitizeInput } from '../../utils/helpers.js';
import { cached, invalidateByPrefix } from '../../utils/cache.js';
import logger from '../../utils/logger.js';

const log = logger.child('AdminRoutes');

const router = Router();

// Whitelist of valid plan values for query param sanitization
const VALID_PLANS = ['free', 'trial', 'premium'];

// Todas as rotas admin requerem autenticação
router.use(authenticateAdmin);

/**
 * GET /api/admin/users
 * Lista todos os usuários com filtros opcionais.
 * Query params: plan, limite (default 50)
 */
router.get('/users', async (req, res) => {
  try {
    let { plan, limite = 50 } = req.query;

    // Sanitize plan param — whitelist valid values
    if (plan) {
      plan = String(plan).toLowerCase().trim();
      if (!VALID_PLANS.includes(plan)) {
        return res.status(400).json({
          sucesso: false,
          erro: `Plano inválido: "${plan}". Valores válidos: ${VALID_PLANS.join(', ')}`,
          codigo: 'PLANO_INVALIDO',
        });
      }
    }

    let sql = `SELECT id, telegram_id, name, plan, banca_principal, estado,
                      pontos, sequencia, nivel, adaptive_level,
                      total_predicoes, acertos_reportados,
                      total_micro_sessions, total_interceptions,
                      created_at, premium_until
               FROM users`;

    const params = [];
    if (plan) {
      sql += ` WHERE plan = $1`;
      params.push(plan);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limite, 10) || 50);

    const users = await query(sql, params);

    // Conta totals por plano
    const planCounts = await query(
      `SELECT plan, COUNT(*) as total FROM users GROUP BY plan`
    );

    res.json({
      sucesso: true,
      mensagem: 'Usuários cadastrados',
      dados: users,
      total: users.length,
      por_plano: planCounts,
    });
  } catch (err) {
    log.error('Erro ao listar usuários', { erro: err.message });
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao listar usuários',
      codigo: 'ERRO_ADMIN_USERS',
    });
  }
});

/**
 * GET /api/admin/stats
 * Estatísticas gerais da plataforma.
 */
router.get('/stats', async (req, res) => {
  try {
    // Stats de usuários
    const userStats = await queryOne(
      `SELECT
         COUNT(*) as total_usuarios,
         COUNT(*) FILTER (WHERE plan = 'premium') as premium,
         COUNT(*) FILTER (WHERE plan = 'trial') as trial,
         COUNT(*) FILTER (WHERE plan = 'free') as free,
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as novos_7d,
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as novos_30d
       FROM users`
    );

    // Stats de micro-sessões
    const sessionStats = await queryOne(
      `SELECT
         COUNT(*) as total_sessoes,
         COUNT(*) FILTER (WHERE status = 'respondida') as respondidas,
         COUNT(*) FILTER (WHERE acertou = true) as acertos,
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as ultimas_24h
       FROM micro_sessions`
    );

    // Stats de pagamentos
    const paymentStats = await queryOne(
      `SELECT
         COUNT(*) as total_pagamentos,
         COUNT(*) FILTER (WHERE status = 'approved') as aprovados,
         COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) as receita_total
       FROM payments`
    );

    // Stats de predições (flywheel)
    const flywheelStats = await queryOne(
      `SELECT
         COUNT(*) as total_feedbacks,
         COUNT(*) FILTER (WHERE acertou = true) as acertos
       FROM prediction_feedbacks`
    );

    const acuraciaFlywheel = parseInt(flywheelStats?.total_feedbacks || 0, 10) > 0
      ? Math.round((parseInt(flywheelStats?.acertos || 0, 10) / parseInt(flywheelStats?.total_feedbacks || 1, 10)) * 100)
      : 0;

    res.json({
      sucesso: true,
      mensagem: 'Estatísticas da plataforma',
      dados: {
        usuarios: {
          total: parseInt(userStats?.total_usuarios || 0, 10),
          premium: parseInt(userStats?.premium || 0, 10),
          trial: parseInt(userStats?.trial || 0, 10),
          free: parseInt(userStats?.free || 0, 10),
          novos_7d: parseInt(userStats?.novos_7d || 0, 10),
          novos_30d: parseInt(userStats?.novos_30d || 0, 10),
        },
        micro_sessions: {
          total: parseInt(sessionStats?.total_sessoes || 0, 10),
          respondidas: parseInt(sessionStats?.respondidas || 0, 10),
          acertos: parseInt(sessionStats?.acertos || 0, 10),
          ultimas_24h: parseInt(sessionStats?.ultimas_24h || 0, 10),
        },
        pagamentos: {
          total: parseInt(paymentStats?.total_pagamentos || 0, 10),
          aprovados: parseInt(paymentStats?.aprovados || 0, 10),
          receita_total: parseFloat(paymentStats?.receita_total || 0).toFixed(2),
        },
        flywheel: {
          total_feedbacks: parseInt(flywheelStats?.total_feedbacks || 0, 10),
          acuracia: acuraciaFlywheel,
        },
      },
    });
  } catch (err) {
    log.error('Erro ao buscar estatísticas', { erro: err.message });
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar estatísticas',
      codigo: 'ERRO_ADMIN_STATS',
    });
  }
});

/**
 * GET /api/admin/payments
 * Lista todos os pagamentos com filtros opcionais.
 * Query params: status, limite (default 50)
 */
router.get('/payments', async (req, res) => {
  try {
    const { status, limite = 50 } = req.query;

    let sql = `SELECT p.id, p.user_id, u.name as user_name,
                      p.mercadopago_payment_id, p.method, p.amount, p.status,
                      p.pricing_tier, p.created_at, p.approved_at
               FROM payments p
               LEFT JOIN users u ON p.user_id = u.id`;

    const params = [];
    if (status) {
      const validStatuses = ['pending', 'approved', 'rejected', 'cancelled', 'refunded'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          sucesso: false,
          erro: `Status inválido: "${status}". Status válidos: ${validStatuses.join(', ')}`,
          codigo: 'STATUS_INVALIDO',
        });
      }
      sql += ` WHERE p.status = $1`;
      params.push(status);
    }

    sql += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limite, 10));

    const payments = await query(sql, params);

    // Resumo financeiro
    const financialSummary = await queryOne(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'approved') as aprovados,
         COUNT(*) FILTER (WHERE status = 'pending') as pendentes,
         COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) as receita_aprovada
       FROM payments`
    );

    res.json({
      sucesso: true,
      mensagem: 'Pagamentos',
      dados: payments,
      total: payments.length,
      resumo_financeiro: {
        total: parseInt(financialSummary?.total || 0, 10),
        aprovados: parseInt(financialSummary?.aprovados || 0, 10),
        pendentes: parseInt(financialSummary?.pendentes || 0, 10),
        receita_aprovada: parseFloat(financialSummary?.receita_aprovada || 0).toFixed(2),
      },
    });
  } catch (err) {
    log.error('Erro ao listar pagamentos', { erro: err.message });
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao listar pagamentos',
      codigo: 'ERRO_ADMIN_PAYMENTS',
    });
  }
});

export default router;
