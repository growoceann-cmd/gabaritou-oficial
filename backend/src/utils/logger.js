/**
 * Logger simples com timestamps e níveis de log.
 * Gabaritou v3 — BeConfident Model
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS = {
  debug: '\x1b[36m', // ciano
  info: '\x1b[32m',  // verde
  warn: '\x1b[33m',  // amarelo
  error: '\x1b[31m', // vermelho
  reset: '\x1b[0m',
};

/** @type {number} Nível mínimo de log configurado via NODE_ENV ou LOG_LEVEL */
let currentLevel = LOG_LEVELS.info;

/**
 * Configura o nível mínimo de log.
 * @param {'debug'|'info'|'warn'|'error'} level
 */
export function setLogLevel(level) {
  if (level in LOG_LEVELS) {
    currentLevel = LOG_LEVELS[level];
  }
}

// Configura automaticamente baseado no ambiente
if (typeof process !== 'undefined' && process.env) {
  const envLevel = process.env.LOG_LEVEL || process.env.NODE_ENV || 'info';
  if (envLevel === 'development' || envLevel === 'debug') {
    currentLevel = LOG_LEVELS.debug;
  } else if (envLevel === 'test') {
    currentLevel = LOG_LEVELS.warn;
  } else if (envLevel === 'production') {
    currentLevel = LOG_LEVELS.info;
  } else if (envLevel in LOG_LEVELS) {
    currentLevel = LOG_LEVELS[envLevel];
  }
}

/**
 * Retorna timestamp formatado: YYYY-MM-DD HH:mm:ss.SSS
 * @returns {string}
 */
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Formata a mensagem de log com cor e nível.
 * @param {'debug'|'info'|'warn'|'error'} level
 * @param {string} message
 * @param {*} [data] - Dados adicionais opcionais
 * @returns {string}
 */
function formatMessage(level, message, data) {
  const color = COLORS[level] || COLORS.reset;
  const reset = COLORS.reset;
  const levelUpper = level.toUpperCase().padStart(5, ' ');
  const timestamp = getTimestamp();
  const prefix = `${color}[${timestamp}] [${levelUpper}]${reset}`;

  if (data !== undefined) {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return `${prefix} ${message}\n${dataStr}`;
  }
  return `${prefix} ${message}`;
}

/**
 * Emite mensagem de log se o nível for adequado.
 * @param {'debug'|'info'|'warn'|'error'} level
 * @param {string} message
 * @param {*} [data]
 */
function log(level, message, data) {
  if (LOG_LEVELS[level] < currentLevel) return;

  const formatted = formatMessage(level, message, data);

  if (level === 'error') {
    console.error(formatted);
  } else if (level === 'warn') {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

/**
 * Logger principal do Gabaritou v3.
 *
 * @example
 * import logger from './logger.js';
 * logger.info('Servidor iniciado na porta', { port: 3000 });
 * logger.error('Falha na conexão', error);
 */
const logger = {
  /**
   * Log de depuração - detalhes técnicos para desenvolvimento.
   * @param {string} message
   * @param {*} [data]
   */
  debug(message, data) {
    log('debug', message, data);
  },

  /**
   * Log informativo - eventos normais do sistema.
   * @param {string} message
   * @param {*} [data]
   */
  info(message, data) {
    log('info', message, data);
  },

  /**
   * Log de aviso - situações anormais mas recuperáveis.
   * @param {string} message
   * @param {*} [data]
   */
  warn(message, data) {
    log('warn', message, data);
  },

  /**
   * Log de erro - falhas que precisam de atenção.
   * @param {string} message
   * @param {*} [data]
   */
  error(message, data) {
    log('error', message, data);
  },

  /**
   * Cria um logger filho com contexto prefixado.
   * @param {string} context - Nome do módulo/contexto
   * @returns {{ debug: Function, info: Function, warn: Function, error: Function }}
   *
   * @example
   * const log = logger.child('PredictionsService');
   * log.info('Buscando predições', { banca: 'CESPE' });
   */
  child(context) {
    const prefix = `[${context}]`;
    return {
      debug(message, data) {
        log('debug', `${prefix} ${message}`, data);
      },
      info(message, data) {
        log('info', `${prefix} ${message}`, data);
      },
      warn(message, data) {
        log('warn', `${prefix} ${message}`, data);
      },
      error(message, data) {
        log('error', `${prefix} ${message}`, data);
      },
    };
  },
};

export default logger;
