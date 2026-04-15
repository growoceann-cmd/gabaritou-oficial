/**
 * Conversation Interceptor — Gabaritou v3 (Modelo BeConfident)
 * 
 * PRINCÍPIO: O bot NÃO espera o usuário pedir para estudar.
 * Ele INTERCEPTA a conversa natural e propõe micro-sessões.
 * 
 * Fluxo:
 * 1. Usuário manda mensagem livre
 * 2. Interceptor analisa contexto + prediction + fatigue
 * 3. Decide: responder naturalmente OU iniciar micro-sessão
 * 4. Se micro-sessão: envia exercício, avalia, proximo passo
 * 
 * "Make the user study without noticing."
 */

import { query, queryOne } from '../db/connection.js';
import { getTopTopicos } from '../services/predictions.js';
import { INTERCEPTION, ADAPTIVE_LEVELS } from '../config/constants.js';
import { getOrCreateConversation, addMessageToContext } from './conversation.js';
import { startMicroSession, evaluateAnswer, getNextQuestion } from '../ai-tutor/session.js';
import logger from '../utils/logger.js';

const log = logger.child('Interceptor');

// ─── Store temporário de micro-sessões ativas (memória) ─────────
const activeSessions = new Map();

// ─── Intercept Point ──────────────────────────────────────────────

/**
 * Ponto central de interceptação.
 * Toda mensagem livre do usuário passa por aqui.
 * 
 * @param {Object} ctx - Contexto do Telegram
 * @returns {Promise<{action: 'natural'|'intercept', response: string|null, session: Object|null}>}
 */
export async function interceptMessage(ctx) {
  const telegramId = ctx.from.id;
  const text = ctx.message?.text || '';
  const name = ctx.from.first_name || 'Concurseiro';

  // 1. Buscar perfil do usuário
  const user = await getOrCreateUser(telegramId, name, ctx.from.username);
  if (!user) {
    return { action: 'natural', response: null, session: null };
  }

  // 2. Buscar ou criar conversa ativa
  const conversation = await getOrCreateConversation(user.id);

  // 3. Registrar mensagem no contexto
  await addMessageToContext(conversation.id, 'user', text);

  // 4. Verificar se já existe micro-sessão ativa para esse usuário
  const existingSession = activeSessions.get(telegramId);
  if (existingSession && existingSession.status === 'active') {
    log.info('Micro-sessão ativa encontrada — encaminhando para avaliação', {
      userId: user.id,
      sessionId: existingSession.id,
    });
    return await handleActiveSession(ctx, user, conversation, existingSession, text);
  }

  // 5. Verificar se deve interceptar
  const shouldIntercept = await evaluateInterception(user, conversation, text);

  if (!shouldIntercept.should) {
    log.debug('Sem interceptação — respondendo naturalmente', {
      reason: shouldIntercept.reason,
      userId: user.id,
    });
    return { action: 'natural', response: null, session: null };
  }

  // 6. INTERCEPTAR — Iniciar micro-sessão
  log.info('INTERCEPTANDO — iniciando micro-sessão', {
    userId: user.id,
    reason: shouldIntercept.reason,
    fatigue: shouldIntercept.fatigue,
    level: user.adaptive_level,
  });

  const session = await startMicroSession(user, conversation, shouldIntercept.topic);

  if (session) {
    activeSessions.set(telegramId, session);
    return {
      action: 'intercept',
      response: session.first_question,
      session,
    };
  }

  return { action: 'natural', response: null, session: null };
}

// ─── Avaliação da Interceptação ───────────────────────────────────

/**
 * Decide se deve interceptar a conversa para iniciar uma micro-sessão.
 * Baseado em: contexto da conversa, fadiga, predições, nível adaptativo.
 */
async function evaluateInterception(user, conversation, currentText) {
  const result = { should: false, reason: '', fatigue: 0, topic: null };

  // Fator 1: Fadiga do usuário
  const fatigue = await getUserFatigue(user.id);
  result.fatigue = fatigue;

  if (fatigue >= INTERCEPTION.maxFatigueScore) {
    result.reason = 'fadiga_alta';
    return result;
  }

  // Fator 2: Contexto da conversa — precisa de pelo menos N mensagens
  if (conversation.message_count < INTERCEPTION.minMessagesForInterception) {
    result.reason = 'contexto_insuficiente';
    return result;
  }

  // Fator 3: Tempo entre mensagens (está ativo na conversa?)
  const lastMsg = conversation.last_message_at;
  if (lastMsg) {
    const timeSince = Date.now() - new Date(lastMsg).getTime();
    if (timeSince > INTERCEPTION.contextWindowMs) {
      result.reason = 'contexto_expirado';
      return result;
    }
    if (timeSince < INTERCEPTION.minTimeBetweenMessages) {
      result.reason = 'tempo_insuficiente';
      return result;
    }
  }

  // Fator 4: Checar se a conversa tem contexto de estudo
  const contextStudyRelevance = await analyzeStudyRelevance(conversation, user);
  if (contextStudyRelevance.score < 0.4) {
    result.reason = 'sem_relevancia_estudo';
    return result;
  }

  // Fator 5: Inertia rate (60% das vezes que atende os critérios, intercepta)
  const random = Math.random();
  if (random > INTERCEPTION.inertiaRate) {
    result.reason = 'inertia_rate';
    return result;
  }

  // Fator 6: Plano free — limitar micro-sessões por dia
  if (user.plan === 'free') {
    const todaySessions = await getTodaySessionCount(user.id);
    if (todaySessions >= 3) {
      result.reason = 'limite_free';
      return result;
    }
  }

  // ✅ Deve interceptar!
  result.should = true;
  result.reason = 'interceptado';
  result.topic = contextStudyRelevance.suggestedTopic;

  return result;
}

// ─── Sessão Ativa ────────────────────────────────────────────────

async function handleActiveSession(ctx, user, conversation, session, text) {
  const evaluation = await evaluateAnswer(session, text, user);

  if (evaluation.completed) {
    // Micro-sessão encerrada — registrar resultado
    await finishMicroSession(session, user, evaluation);

    const nextAction = await decideNextAction(user, evaluation);

    activeSessions.delete(ctx.from.id);

    return {
      action: 'intercept',
      response: evaluation.feedback + '\n\n' + nextAction.message,
      session: null,
    };
  }

  // Ainda há questões na micro-sessão
  if (evaluation.nextQuestion) {
    return {
      action: 'intercept',
      response: evaluation.feedback + '\n\n' + evaluation.nextQuestion,
      session: { ...session, currentQuestion: evaluation.nextQuestion },
    };
  }

  return {
    action: 'intercept',
    response: evaluation.feedback,
    session,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────

export async function getOrCreateUser(telegramId, name, username) {
  let user = await queryOne('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);

  if (!user) {
    const result = await query(
      `INSERT INTO users (telegram_id, name, username, referral_code)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [telegramId, name, username || null, `GAB-${Date.now().toString(36).toUpperCase()}`]
    );
    user = result[0];
    log.info('Novo usuário criado', { telegramId, name });
  }

  return user;
}

async function getUserFatigue(userId) {
  const progress = await query(
    `SELECT AVG(fatigue_score)::numeric as avg_fatigue
     FROM study_progress WHERE user_id = $1`,
    [userId]
  );

  const avgFatigue = parseFloat(progress[0]?.avg_fatigue || '0');
  return avgFatigue;
}

async function analyzeStudyRelevance(conversation, user) {
  const context = conversation.context || [];
  const recentMessages = context.slice(-5).map((m) => m.text).join(' ');

  // Analisar relevância baseado em palavras-chave do contexto do usuário
  const studyKeywords = [
    'concurso', 'prova', 'edital', 'estudar', 'estudo', 'questão', 'questões',
    'banca', 'materia', 'direito', 'português', 'lógico', 'constitucional',
    'administrativo', 'penal', 'civil', 'cespe', 'fgv', 'fcc', 'vunesp',
    'aprovado', 'aprovação', 'simulado', 'revisão', 'revisar',
  ];

  const lower = recentMessages.toLowerCase();
  const matchCount = studyKeywords.filter((kw) => lower.includes(kw)).length;

  let score = matchCount > 0 ? Math.min(matchCount / 3, 1) : 0;

  // Boost se o usuário tem banca configurada
  if (user.banca_principal) score += 0.2;
  if (user.cargo_alvo) score += 0.1;

  // Sugerir tópico baseado em predições
  let suggestedTopic = null;
  if (user.banca_principal && score > 0.3) {
    const predicoes = await getTopTopicos(user.banca_principal, 'Direito Administrativo', 1);
    if (predicoes.length > 0) {
      suggestedTopic = predicoes[0];
    }
  }

  return { score: Math.min(score, 1), suggestedTopic };
}

async function getTodaySessionCount(userId) {
  const result = await query(
    `SELECT COUNT(*)::int as count FROM micro_sessions
     WHERE user_id = $1 AND started_at::date = NOW()::date`,
    [userId]
  );
  return result[0]?.count || 0;
}

async function finishMicroSession(session, user, evaluation) {
  await query(
    `UPDATE micro_sessions SET
      status = 'completed',
      correct_answers = $1,
      total_questions = $2,
      duration_seconds = $3,
      result = $4,
      ended_at = NOW()
    WHERE id = $5`,
    [evaluation.correct, evaluation.total, evaluation.duration, JSON.stringify(evaluation.summary), session.id]
  );

  // Atualizar progresso do usuário
  await updateUserProgress(user, evaluation);

  log.info('Micro-sessão finalizada', {
    sessionId: session.id,
    userId: user.id,
    correct: evaluation.correct,
    total: evaluation.total,
  });
}

async function updateUserProgress(user, evaluation) {
  if (!evaluation.topic) return;

  const existing = await queryOne(
    `SELECT * FROM study_progress WHERE user_id = $1 AND topico = $2`,
    [user.id, evaluation.topic]
  );

  if (existing) {
    const newQuestoes = existing.questoes + evaluation.total;
    const newAcertos = existing.acertos + evaluation.correct;
    const newTaxa = (newAcertos / newQuestoes) * 100;

    // Recalcular adaptive level
    const newLevel = calculateAdaptiveLevel(newTaxa);

    await query(
      `UPDATE study_progress SET
        questoes = $1, acertos = $2, taxa_acerto = $3,
        adaptive_level = $4, fatigue_score = $5,
        last_question_time = NOW(), streak_topico = streak_topico + 1,
        tendencia = $6, historico = historico || $7::jsonb
      WHERE id = $8`,
      [newQuestoes, newAcertos, newTaxa, newLevel, 0,
       newTaxa > existing.taxa_acerto ? 'melhorando' : 'precisa_atencao',
       JSON.stringify({ correct: evaluation.correct, total: evaluation.total, data: new Date().toISOString() }),
       existing.id]
    );
  } else {
    const taxa = evaluation.total > 0 ? (evaluation.correct / evaluation.total) * 100 : 0;
    const level = calculateAdaptiveLevel(taxa);

    await query(
      `INSERT INTO study_progress (user_id, banca, materia, topico, questoes, acertos, taxa_acerto, adaptive_level, last_question_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [user.id, evaluation.banca || user.banca_principal, evaluation.materia || 'Geral',
       evaluation.topic, evaluation.total, evaluation.correct, taxa, level]
    );
  }
}

function calculateAdaptiveLevel(taxaAcerto) {
  for (let i = ADAPTIVE_LEVELS.length - 1; i >= 0; i--) {
    if (taxaAcerto >= ADAPTIVE_LEVELS[i].minAccuracy) return ADAPTIVE_LEVELS[i].level;
  }
  return 1;
}

async function decideNextAction(user, evaluation) {
  const taxaGeral = evaluation.total > 0
    ? (evaluation.correct / evaluation.total) * 100
    : 0;

  if (taxaGeral >= 70) {
    return {
      message: 'Seu desempenho está acima da média neste tópico. Continue evoluindo.',
    };
  }

  if (taxaGeral >= 50) {
    return {
      message: 'Desempenho dentro da média. Uma revisão reforçaria os pontos-chave.',
    };
  }

  return {
    message: 'Recomendo revisar os conceitos fundamentais deste tópico.',
  };
}

export default {
  interceptMessage,
  getOrCreateUser,
  getUserFatigue,
  activeSessions,
};
