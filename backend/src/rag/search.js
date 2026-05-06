/**
 * RAG Search — Gabaritou v3
 * Busca por embeddings em PostgreSQL + pgvector.
 */

import { query } from '../db/connection.js';
import logger from '../utils/logger.js';

const log = logger.child('RAGSearch');

/**
 * Busca documentos similares por embedding vector.
 * Requer pgvector instalado no PostgreSQL.
 * 
 * @param {number[]} embedding - Vector de embedding (1536 dimensões para OpenAI)
 * @param {Object} options
 * @param {number} options.topK - Número de resultados (default: 5)
 * @param {string} options.sourceType - Filtrar por tipo de fonte
 * @param {string} options.banca - Filtrar por banca
 * @returns {Promise<Array>} Documentos similares com score
 */
export async function searchByEmbedding(embedding, { topK = 5, sourceType = null, banca = null } = {}) {
  let whereClause = '';
  const params = [embedding, topK];
  let paramIndex = 2;

  if (sourceType) {
    whereClause += ` AND e.source_type = $${paramIndex++}`;
    params.push(sourceType);
  }

  if (banca) {
    whereClause += ` AND p.banca = $${paramIndex++}`;
    params.push(banca);
  }

  const sql = `
    SELECT 
      e.id, e.content, e.source_type, e.source_ref,
      p.topico, p.banca, p.materia, p.probabilidade,
      p.armadilhas, p.dicas, p.referencias_legais,
      1 - (e.embedding <=> $1::vector) as similarity
    FROM embeddings e
    LEFT JOIN predictions p ON e.prediction_id = p.id
    WHERE e.embedding IS NOT NULL ${whereClause}
    ORDER BY e.embedding <=> $1::vector
    LIMIT $2
  `;

  try {
    const results = await query(sql, params);
    log.debug('RAG search realizada', { topK, results: results.length });
    return results;
  } catch (err) {
    log.error('Erro na busca RAG', { erro: err.message });
    return [];
  }
}

/**
 * Busca tópicos por similaridade textual (fallback sem embeddings).
 * @param {string} topic - Texto do tópico
 * @param {string} banca - Banca filtrar
 * @param {number} limit - Limite de resultados
 * @returns {Promise<Array>}
 */
export async function searchByTopic(topic, banca = null, limit = 5) {
  let sql = `
    SELECT * FROM predictions
    WHERE active = true AND (
      topico ILIKE '%' || $1 || '%'
      OR 'Direito Administrativo' ILIKE '%' || $1 || '%'
    )
  `;
  const params = [topic];

  if (banca) {
    sql += ` AND banca = $2`;
    params.push(banca);
  }

  sql += ` ORDER BY probabilidade DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  try {
    const results = await query(sql, params);
    return results;
  } catch (err) {
    log.error('Erro na busca por tópico', { topic, erro: err.message });
    return [];
  }
}

export default { searchByEmbedding, searchByTopic };
