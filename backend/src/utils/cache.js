/**
 * Cache em memória com suporte a TTL (Time-To-Live).
 * Gabaritou v3 — BeConfident Model
 *
 * Armazena dados temporários para evitar chamadas repetidas a APIs externas
 * e acelerar respostas frequentes.
 */

import logger from './logger.js';

const log = logger.child('Cache');

/** Mapa interno de entradas do cache */
const store = new Map();

/** @typedef {{ value: any, expiresAt: number, createdAt: number }} CacheEntry */

/**
 * Retorna o número de itens atualmente no cache.
 * @returns {number}
 */
export function size() {
  return store.size;
}

/**
 * Verifica se uma chave existe e não está expirada.
 * @param {string} key
 * @returns {boolean}
 */
export function has(key) {
  const entry = store.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return false;
  }
  return true;
}

/**
 * Obtém um valor do cache. Retorna undefined se expirado ou inexistente.
 * @param {string} key
 * @returns {any|undefined}
 */
export function get(key) {
  const entry = store.get(key);
  if (!entry) return undefined;

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    log.debug('Entrada expirada removida', { key });
    return undefined;
  }

  return entry.value;
}

/**
 * Define um valor no cache com TTL opcional.
 * @param {string} key
 * @param {*} value
 * @param {number} [ttlSeconds=300] - Tempo de vida em segundos (padrão: 5 minutos)
 */
export function set(key, value, ttlSeconds = 300) {
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;

  store.set(key, { value, expiresAt, createdAt: now });
  log.debug('Valor armazenado no cache', { key, ttlSeconds });
}

/**
 * Remove uma entrada específica do cache.
 * @param {string} key
 * @returns {boolean} true se a entrada existia e foi removida
 */
export function del(key) {
  return store.delete(key);
}

/**
 * Remove todas as entradas do cache.
 */
export function clear() {
  const count = store.size;
  store.clear();
  log.info('Cache limpo', { entradasRemovidas: count });
}

/**
 * Remove todas as entradas expiradas do cache.
 * @returns {number} Quantidade de entradas removidas
 */
export function purge() {
  const now = Date.now();
  let removed = 0;

  for (const [key, entry] of store) {
    if (now > entry.expiresAt) {
      store.delete(key);
      removed++;
    }
  }

  if (removed > 0) {
    log.debug('Purge executado', { removidas: removed, restantes: store.size });
  }

  return removed;
}

/**
 * Remove entradas que comecem com um determinado prefixo.
 * Útil para invalidar grupos relacionados de cache.
 * @param {string} prefix
 * @returns {number} Quantidade de entradas removidas
 */
export function invalidateByPrefix(prefix) {
  let removed = 0;

  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
      removed++;
    }
  }

  if (removed > 0) {
    log.info('Cache invalidado por prefixo', { prefix, removidas: removed });
  }

  return removed;
}

/**
 * Executa uma função assíncrona e armazena o resultado em cache.
 * Se o valor já estiver em cache e não expirado, retorna diretamente.
 * Se não existir, executa a função, armazena e retorna.
 *
 * @template T
 * @param {string} key - Chave única do cache
 * @param {() => Promise<T>} fn - Função assíncrona para gerar o valor
 * @param {number} [ttlSeconds=300] - Tempo de vida em segundos
 * @returns {Promise<T>} Valor (do cache ou recém-calculado)
 *
 * @example
 * const concursos = await cached('concursos:SP', () => fetchConcursos('SP'), 3600);
 */
export async function cached(key, fn, ttlSeconds = 300) {
  const existing = get(key);
  if (existing !== undefined) {
    log.debug('Cache hit', { key });
    return existing;
  }

  log.debug('Cache miss - executando função', { key });

  try {
    const value = await fn();
    set(key, value, ttlSeconds);
    return value;
  } catch (error) {
    log.error('Erro ao executar função para cache', { key, erro: error.message });
    throw error;
  }
}

/**
 * Retorna estatísticas do cache.
 * @returns {{ total: number, valid: number, expired: number, sizeEstimate: string }}
 */
export function getStats() {
  const now = Date.now();
  let valid = 0;
  let expired = 0;
  let totalBytes = 0;

  for (const [, entry] of store) {
    if (now > entry.expiresAt) {
      expired++;
    } else {
      valid++;
    }
    try {
      totalBytes += JSON.stringify(entry.value).length * 2;
    } catch {
      totalBytes += 100;
    }
  }

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return {
    total: store.size,
    valid,
    expired,
    sizeEstimate: formatBytes(totalBytes),
  };
}

// Executa purge automático a cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    purge();
  }, 5 * 60 * 1000);
}

export default {
  get,
  set,
  has,
  del,
  clear,
  purge,
  cached,
  invalidateByPrefix,
  size,
  getStats,
};
