/**
 * Micro-Session Manager — Gabaritou v3 (Modelo BeConfident)
 */

import { query } from '../db/connection.js';
import { generateScenarioQuestion, evaluateUserAnswer, generateNaturalTransition } from './coach.js';
import { getContextForAI } from '../bot/conversation.js';
import logger from '../utils/logger.js';

const log = logger.child('Session');

const MAX_QUESTIONS_PER_SESSION = 3;

/**
 * Inicia uma nova micro-sessão.
 */
export async function startMicroSession(user, conversation, topic) {
  try {
    const level = topic?.adaptive_level || user.adaptive_level || 1;
    const banca = topic?.banca || user.banca_principal || 'CESPE';
    const materia = topic?.materia || 'Direito Administrativo';
    const topico = topic?.topico || 'Conceitos Fundamentais';

    const context = await getContextForAI(conversation.id);
    const contextText = context.slice(-3).map((m) => `${m.role}: ${m.content}`).join('\n');

    const transition = await generateNaturalTransition(contextText, topico);

    const question = await generateScenarioQuestion({
      topico,
      level,
      banca,
      materia,
      prevContext: contextText,
    });

    const result = await query(
      `INSERT INTO micro_sessions (user_id, banca, materia, topico, dificuldade)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, banca, materia, topico, level]
    );

    const session = result[0];

    const { setMicroSession } = await import('../bot/conversation.js');
    await setMicroSession(conversation.id, session.id);

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
 */
export async function evaluateAnswer(session, userAnswer, user) {
  try {
    const isCorrect = userAnswer?.trim().toUpperCase().replace(/[^A-D]/g, '') === session.correctAnswer;

    const evaluation = await evaluateUserAnswer({
      userAnswer,
      correctAnswer: session.correctAnswer,
      explanation: session.explanation,
      armadilha: session.armadilha,
      questionDifficulty: session.difficulty,
    });

    session.questionsAsked = (session.questionsAsked || 0) + 1;
    if (isCorrect) session.correctAnswers = (session.correctAnswers || 0) + 1;

    const feedback = evaluation.feedback;

    if (session.questionsAsked >= MAX_QUESTIONS_PER_SESSION) {
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

    const nextQ = await generateScenarioQuestion({
      topico: session.topic,
      level: session.level,
      banca: session.banca,
      materia: session.materia,
      prevContext: '',
    });

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
    return {
      completed: true,
      feedback: 'Erro ao processar resposta.',
      correct: 0,
      total: 0,
      duration: 0,
      summary: { topic: session.topic, total: 0, correct: 0, taxa: '0' },
      topic: session.topic,
      nextQuestion: null,
    };
  }
}

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
