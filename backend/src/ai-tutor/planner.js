/**
 * Adaptive Planner — Gabaritou v3 (Modelo BeConfident)
 * 
 * Planeja o que o usuário deve estudar PRÓXIMO baseado em:
 * - Nível adaptativo atual
 * - Tópicos com maior probabilidade de cair (prediction engine)
 * - Histórico de acertos/erros
 * - Fadiga do usuário
 * - Tempo desde a última interação
 * 
 * NÃO gera planos estáticos. Gera DECISÕES em tempo real.
 */

import { query, queryOne } from '../db/connection.js';
import { getTopTopicos } from '../services/predictions.js';
import { ADAPTIVE_LEVELS, INTERCEPTION, LIMITS } from '../config/constants.js';
import logger from '../utils/logger.js';

const log = logger.child('Planner');

/**
 * Decide o PRÓXIMO PASSO para o usuário.
 * Chamado pelo interceptor antes de iniciar uma micro-sessão.
 * 
 * @param {Object} user - Dados do usuário
 * @param {Object} [conversation] - Conversa ativa
 * @returns {Promise<{
 *   action: 'question'|'review'|'rest'|'skip',
 *   topico: string|null,
 *   materia: string|null,
 *   banca: string|null,
 *   level: number,
 *   reason: string,
 *   predictedProbability: number|null
 * }>}
 */
export async function planNextStep(user, conversation) {
  // 1. Verificar fadiga
  const fatigue = await getUserFatigue(user.id);
  if (fatigue >= INTERCEPTION.maxFatigueScore) {
    return {
      action: 'rest',
      topico: null,
      materia: null,
      banca: null,
      level: user.adaptive_level || 1,
      reason: 'fatigue_high',
      predictedProbability: null,
    };
  }

  // 2. Encontrar tópico mais fraco que precisa de reforço
  const weakTopic = await getWeakestTopic(user.id, user.banca_principal);

  // 3. Obter predições de alta probabilidade
  let predictionTopic = null;
  if (user.banca_principal) {
    const predictions = await getTopTopicos(user.banca_principal, 'Direito Administrativo', 3);
    // Tentar matérias com mais predições
    if (predictions.length > 0) {
      predictionTopic = {
        topico: predictions[0].topico,
        materia: 'Direito Administrativo',
        banca: user.banca_principal,
        probabilidade: predictions[0].probabilidade,
      };
    }
  }

  // 4. Decisão: reforçar ponto fraco OU tópico de alta probabilidade?
  let chosenTopic = null;
  let action = 'question';
  let reason = '';

  if (weakTopic && weakTopic.taxa_acerto < 50) {
    // Ponto fraco crítico — priorizar reforço
    chosenTopic = weakTopic;
    action = 'review';
    reason = 'weak_topic_critical';
  } else if (predictionTopic && predictionTopic.probabilidade >= 80) {
    // Alta probabilidade — priorizar predição
    chosenTopic = {
      topico: predictionTopic.topico,
      materia: predictionTopic.materia,
      banca: predictionTopic.banca,
      taxa_acerto: null,
    };
    action = 'question';
    reason = 'high_probability_prediction';
  } else if (weakTopic) {
    // Ponto fraco moderado
    chosenTopic = weakTopic;
    action = 'review';
    reason = 'weak_topic_moderate';
  } else if (predictionTopic) {
    // Tópico predito
    chosenTopic = {
      topico: predictionTopic.topico,
      materia: predictionTopic.materia,
      banca: predictionTopic.banca,
      taxa_acerto: null,
    };
    action = 'question';
    reason = 'prediction_available';
  } else {
    // Nada encontrado — pular
    return {
      action: 'skip',
      topico: null,
      materia: null,
      banca: null,
      level: user.adaptive_level || 1,
      reason: 'no_data',
      predictedProbability: null,
    };
  }

  // 5. Determinar nível da questão
  const level = chosenTopic.adaptive_level
    || calculateLevel(chosenTopic.taxa_acerto)
    || user.adaptive_level
    || 1;

  log.info('Next step planejado', {
    userId: user.id,
    action,
    topico: chosenTopic.topico,
    level,
    reason,
  });

  return {
    action,
    topico: chosenTopic.topico,
    materia: chosenTopic.materia,
    banca: chosenTopic.banca || user.banca_principal,
    level,
    reason,
    predictedProbability: predictionTopic?.probabilidade || null,
  };
}

/**
 * Recalcula o nível adaptativo do usuário globalmente.
 * Chamado periodicamente e após micro-sessões.
 * @param {string} userId
 * @returns {Promise<{level: number, name: string, taxaGeral: number}>}
 */
export async function recalculateAdaptiveLevel(userId) {
  const result = await query(
    `SELECT 
      SUM(acertos)::float / NULLIF(SUM(questoes), 0) * 100 as taxa_geral,
      AVG(adaptive_level)::float as avg_level
     FROM study_progress WHERE user_id = $1 AND questoes > 0`,
    [userId]
  );

  const taxaGeral = parseFloat(result[0]?.taxa_geral || '0');
  const newLevel = calculateLevel(taxaGeral);
  const levelInfo = ADAPTIVE_LEVELS.find((l) => l.level === newLevel) || ADAPTIVE_LEVELS[0];

  // Atualizar nível do usuário
  await query(
    `UPDATE users SET adaptive_level = $1, updated_at = NOW() WHERE id = $2`,
    [newLevel, userId]
  );

  log.info('Nível adaptativo recalculado', {
    userId,
    oldLevel: result[0]?.avg_level,
    newLevel,
    taxaGeral: taxaGeral.toFixed(1),
  });

  return {
    level: newLevel,
    name: levelInfo.name,
    taxaGeral,
  };
}

/**
 * Gera análise de progresso semanal para o relatório do usuário.
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function generateWeeklyAnalysis(userId) {
  const result = await query(
    `SELECT 
      materia,
      SUM(questoes)::int as total_questoes,
      SUM(acertos)::int as total_acertos,
      SUM(acertos)::float / NULLIF(SUM(questoes), 0) * 100 as taxa_acerto,
      adaptive_level,
      tendencia,
      streak_topico
     FROM study_progress
     WHERE user_id = $1 AND questoes > 0
     GROUP BY materia, adaptive_level, tendencia, streak_topico
     ORDER BY taxa_acerto ASC`,
    [userId]
  );

  // Stats globais
  const globalResult = await query(
    `SELECT 
      COUNT(*)::int as materias_estudadas,
      SUM(questoes)::int as total_geral,
      SUM(acertos)::int as acertos_gerais
     FROM study_progress WHERE user_id = $1 AND questoes > 0`,
    [userId]
  );

  const global = globalResult[0] || {};
  const taxaGeral = global.total_geral > 0
    ? ((global.acertos_gerais / global.total_geral) * 100).toFixed(1)
    : '0';

  return {
    materias: result,
    global: {
      materias_estudadas: global.materias_estudadas || 0,
      total_questoes: global.total_geral || 0,
      total_acertos: global.acertos_gerais || 0,
      taxa_geral: parseFloat(taxaGeral),
    },
    recomendacoes: generateRecommendations(result, parseFloat(taxaGeral)),
    data_geracao: new Date().toISOString(),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────

async function getUserFatigue(userId) {
  const result = await query(
    `SELECT AVG(fatigue_score)::float as avg_fatigue
     FROM study_progress WHERE user_id = $1`,
    [userId]
  );
  return parseFloat(result[0]?.avg_fatigue || '0');
}

/**
 * FIX: SQL injection — uses parameterized query with $2 for banca.
 */
async function getWeakestTopic(userId, banca) {
  if (banca) {
    const result = await query(
      `SELECT * FROM study_progress
       WHERE user_id = $1 AND questoes > 0 AND banca = $2
       ORDER BY taxa_acerto ASC
       LIMIT 1`,
      [userId, banca]
    );
    return result[0] || null;
  }

  const result = await query(
    `SELECT * FROM study_progress
     WHERE user_id = $1 AND questoes > 0
     ORDER BY taxa_acerto ASC
     LIMIT 1`,
    [userId]
  );
  return result[0] || null;
}

function calculateLevel(taxaAcerto) {
  if (taxaAcerto === null || taxaAcerto === undefined) return 1;
  for (let i = ADAPTIVE_LEVELS.length - 1; i >= 0; i--) {
    if (taxaAcerto >= ADAPTIVE_LEVELS[i].minAccuracy) return ADAPTIVE_LEVELS[i].level;
  }
  return 1;
}

function generateRecommendations(materias, taxaGeral) {
  const recs = [];

  // Ponto mais fraco
  if (materias.length > 0 && materias[0].taxa_acerto < 50) {
    recs.push({
      tipo: 'reforcar',
      materia: materias[0].materia,
      taxa: materias[0].taxa_acerto,
      mensagem: `Revisar ${materias[0].materia} — taxa de acerto: ${materias[0].taxa_acerto.toFixed(1)}%`,
    });
  }

  // Geral
  if (taxaGeral >= 70) {
    recs.push({
      tipo: 'avançar',
      mensagem: 'Desempenho acima da média. Considere aumentar a dificuldade.',
    });
  } else if (taxaGeral < 50) {
    recs.push({
      tipo: 'base',
      mensagem: 'Foco nos conceitos fundamentais antes de avançar.',
    });
  }

  return recs;
}

export default {
  planNextStep,
  recalculateAdaptiveLevel,
  generateWeeklyAnalysis,
};
