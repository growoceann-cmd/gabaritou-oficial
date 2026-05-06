/**
 * Conversation Manager — Gabaritou v3
 * 
 * Gerencia o estado da conversa de cada usuário.
 * Armazena as últimas N mensagens como contexto para a IA.
 */

import { query, queryOne } from '../db/connection.js';
import logger from '../utils/logger.js';

const log = logger.child('Conversation');

const MAX_CONTEXT_MESSAGES = 10;

/**
 * Obtém ou cria uma conversa ativa para o usuário.
 * @param {string} userId - UUID do usuário
 * @returns {Promise<Object>} Conversa ativa
 */
export async function getOrCreateConversation(userId) {
  // Buscar conversa ativa
  let conversation = await queryOne(
    `SELECT * FROM conversations WHERE user_id = $1 AND is_active = true ORDER BY started_at DESC LIMIT 1`,
    [userId]
  );

  if (conversation) {
    return conversation;
  }

  // Criar nova conversa
  const result = await query(
    `INSERT INTO conversations (user_id) VALUES ($1) RETURNING *`,
    [userId]
  );
  conversation = result[0];
  log.debug('Nova conversa criada', { userId, conversationId: conversation.id });
  return conversation;
}

/**
 * Adiciona uma mensagem ao contexto da conversa.
 * @param {string} conversationId
 * @param {'user'|'bot'|'system'} role
 * @param {string} text
 */
export async function addMessageToContext(conversationId, role, text) {
  const timestamp = new Date().toISOString();
  const msgEntry = { role, text, timestamp };

  const result = await query(
    `UPDATE conversations SET
      context = (
        CASE 
          WHEN jsonb_array_length(COALESCE(context, '[]'::jsonb)) >= $1 
          THEN (context - 0) || jsonb_build_array($3::jsonb)
          ELSE COALESCE(context, '[]'::jsonb) || jsonb_build_array($3::jsonb)
        END
      ),
      message_count = message_count + 1,
      last_message_at = NOW(),
      updated_at = NOW()
    WHERE id = $2
    RETURNING *`,
    [MAX_CONTEXT_MESSAGES, conversationId, JSON.stringify(msgEntry)]
  );

  return result[0];
}

/**
 * Obtém o contexto formatado para enviar à IA.
 * @param {string} conversationId
 * @returns {Promise<Array<{role: string, content: string}>>}
 */
export async function getContextForAI(conversationId) {
  const conversation = await queryOne(
    `SELECT context FROM conversations WHERE id = $1`,
    [conversationId]
  );

  if (!conversation || !conversation.context) return [];

  const context = typeof conversation.context === 'string'
    ? JSON.parse(conversation.context)
    : conversation.context;

  return (context || []).map((msg) => ({
    role: msg.role === 'bot' ? 'assistant' : msg.role,
    content: msg.text,
  }));
}

/**
 * Fecha uma conversa (marca como inativa).
 * @param {string} conversationId
 */
export async function closeConversation(conversationId) {
  await query(
    `UPDATE conversations SET is_active = false, updated_at = NOW() WHERE id = $1`,
    [conversationId]
  );
  log.debug('Conversa fechada', { conversationId });
}

/**
 * Incrementa contador de perguntas feitas na conversa.
 * @param {string} conversationId
 */
export async function incrementQuestions(conversationId) {
  await query(
    `UPDATE conversations SET questions_asked = questions_asked + 1, updated_at = NOW() WHERE id = $1`,
    [conversationId]
  );
}

/**
 * Associa uma micro-sessão à conversa.
 * @param {string} conversationId
 * @param {string} sessionId
 */
export async function setMicroSession(conversationId, sessionId) {
  await query(
    `UPDATE conversations SET micro_session_id = $1, updated_at = NOW() WHERE id = $2`,
    [sessionId, conversationId]
  );
}

export default {
  getOrCreateConversation,
  addMessageToContext,
  getContextForAI,
  closeConversation,
  incrementQuestions,
  setMicroSession,
};
