/**
 * Conexão PostgreSQL — Gabaritou v3
 * Pool de conexões com pg.
 */
import pg from 'pg';
import logger from '../utils/logger.js';

const log = logger.child('Database');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  log.error('Erro inesperado no pool de conexões', { erro: err.message });
});

pool.on('connect', () => {
  log.debug('Nova conexão aberta no pool');
});

/**
 * Executa uma query SQL e retorna as linhas.
 * @param {string} text - Query SQL
 * @param {*} params - Parâmetros da query
 * @returns {Promise<any[]>}
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    log.debug('Query executada', { duration: `${duration}ms`, rows: result.rowCount });
    return result.rows;
  } catch (err) {
    log.error('Erro na query', { query: text.substring(0, 200), params: String(params), erro: err.message });
    throw err;
  }
}

/**
 * Executa uma query e retorna o primeiro resultado.
 * @param {string} text
 * @param {*} params
 * @returns {Promise<any|null>}
 */
export async function queryOne(text, params) {
  const rows = await query(text, params);
  return rows[0] || null;
}

/**
 * Fecha o pool de conexões (para shutdown).
 */
export async function closePool() {
  await pool.end();
  log.info('Pool de conexões fechado');
}

export default { query, queryOne, closePool, pool };
