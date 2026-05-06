/**
 * Micro-Session Manager — Gabaritou v3 (Modelo BeConfident)
 * 
 * Gerencia ciclos curtos de aprendizado: 1-3 questões por micro-sessão.
 * O usuário não "entra no modo estudo" — a sessão acontece dentro da conversa.
 * 
 * Ciclo:
 * 1. Intercepta conversa → gera questão
 * 2. Responde → avalia → decide próxima
 * 3. Após 1-3 questões → encerra com resumo de dados
 */

import { query } from '../db/connection.js';
import { generateScenarioQuestion, evaluateUserAnswer, generateNaturalTransition } from './coach.js';
import { getContextForAI } from '../bot/conversation.js';
import logger from '../utils/logger.js';

const log = logger.child('Session');

const MAX_QUESTIONS_PER_SESSION = 3;

/**
 * Inicia uma nova micro-sessão.
 * @param {Object} user - Dados do usuário
 * @param {Object} conversation - Conversa ativa
 * @param {Object} topic - Tópico sugerido pelo planner
 * @returns {Promise<Object|null>} Sessão com primeira questão
 */
export async function startMicroSession(user, conversation, topic) {
  try {
    // Determinar nível
    const level = (topic && topic.adaptive_level) || (user && user.adaptive_level) || 1;
    const banca = (topic && topic.banca) || (user && user.banca_principal) || 'CESPE';
    const materia = (topic && topic.materia) || 'Direito Administrativo';
    const topico = (topic && topic.topico) || (typeof topic === 'string' ? topic : 'Conceitos Fundamentais');

    // Obter contexto da conversa para transição natural
    const context = await getContextForAI(conversation.id);
    const contextText = context.slice(-3).map((m) => `${m.role}: ${m.content}`).join('\n');

    // Gerar transição natural
    const transition = await generateNaturalTransition(contextText, topico);

    // Gerar primeira questão
    const question = await generateScenarioQuestion({
      topico,
      level,
      banca,
      materia,
      prevContext: contextText,
    });

    // Criar registro no banco
    const result = await query(
      `INSERT INTO micro_sessions (user_id, banca, materia, topico, dificuldade)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, banca, materia, topico, level]
    );

    const session = result[0];

    // Associar à conversa
    const { setMicroSession } = await import('../bot/conversation.js');
    await setMicroSession(conversation.id, session.id);

    log.info('Micro-sessão iniciada', {
      sessionId: session.id,
      userId: user.id,
      topico,
      level,
      banca,
    });

    return {
      id: session.id,
      topic: topico,
      banca,
      materia,
      level,
      questionsAsked: 0,
      correctAnswers: 0,
      currentQuestion: question.question,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      armadilha: question.armadilha,
      difficulty: question.difficulty,
      status: 'active',
      first_question: `${transition}\n\n${question.question}`,
      startedAt: Date.now(),
    };
  } catch (err) {
    log.error('Erro ao iniciar micro-sessão', { userId: user.id, erro: err.message });
    return null;
  }
}

/**
 * Avalia a resposta do usuário na micro-sessão atual.
 * @param {Object} session - Sessão ativa
 * @param {string} userAnswer - Resposta do usuário
 * @param {Object} user - Dados do usuário
 * @returns {Promise<Object>} Resultado da avaliação
 */
export async function evaluateAnswer(session, userAnswer, user) {
  try {
    const isCorrect = userAnswer?.trim().toUpperCase().replace(/[^A-D]/g, '') === session.correctAnswer;

    // Gerar feedback emocionless
    const evaluation = evaluateUserAnswer({
      userAnswer,
      correctAnswer: session.correctAnswer,
      explanation: session.explanation,
      armadilha: session.armadilha,
      questionDifficulty: session.difficulty,
    });

    session.questionsAsked = (session.questionsAsked || 0) + 1;
    if (isCorrect) session.correctAnswers = (session.correctAnswers || 0) + 1;

    const feedback = evaluation.feedback;

    // Verificar se deve continuar ou encerrar
    if (session.questionsAsked >= MAX_QUESTIONS_PER_SESSION) {
      // Encerrar micro-sessão
      const summary = {
        topic: session.topic,
        total: session.questionsAsked,
        correct: session.correctAnswers,
        taxa: ((session.correctAnswers / session.questionsAsked) * 100).toFixed(1),
        level: session.level,
      };

      return {
        completed: true,
        feedback,
        correct: session.correctAnswers,
        total: session.questionsAsked,
        duration: Math.round((Date.now() - session.startedAt) / 1000),
        summary,
        topic: session.topic,
        banca: session.banca,
        materia: session.materia,
        nextQuestion: null,
      };
    }

    // Gerar próxima questão (mesmo tópico, mesma dificuldade)
    const nextQ = await generateScenarioQuestion({
      topico: session.topic,
      level: session.level,
      banca: session.banca,
      materia: session.materia,
      prevContext: '',
    });

    // Atualizar sessão com nova questão
    session.currentQuestion = nextQ.question;
    session.correctAnswer = nextQ.correctAnswer;
    session.explanation = nextQ.explanation;
    session.armadilha = nextQ.armadilha;

    return {
      completed: false,
      feedback,
      nextQuestion: nextQ.question,
      correct: session.correctAnswers,
      total: session.questionsAsked,
    };
  } catch (err) {
    log.error('Erro ao avaliar resposta', { sessionId: session.id, erro: err.message });

    return {
      completed: true,
      feedback: 'Erro ao processar resposta. Tente novamente.',
      correct: 0,
      total: 0,
      duration: 0,
      summary: { topic: session.topic, total: 0, correct: 0, taxa: '0' },
      topic: session.topic,
      nextQuestion: null,
    };
  }
}

/**
 * Obtém a próxima questão para uma sessão (usado pelo interceptor).
 * @param {Object} session
 * @returns {Promise<string|null>}
 */
export async function getNextQuestion(session) {
  const nextQ = await generateScenarioQuestion({
    topico: session.topic,
    level: session.level,
    banca: session.banca,
    materia: session.materia,
  });

  session.currentQuestion = nextQ.question;
  session.correctAnswer = nextQ.correctAnswer;
  session.explanation = nextQ.explanation;
  session.armadilha = nextQ.armadilha;

  return nextQ.question;
}

export default {
  startMicroSession,
  evaluateAnswer,
  getNextQuestion,
};
