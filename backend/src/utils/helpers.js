/**
 * Funções utilitárias (helpers) do Gabaritou v3.1.
 * Atualizado: 12/04/2026
 * Funções genéricas usadas em toda a aplicação.
 */

/**
 * Formata uma data para o padrão brasileiro (dd/mm/aaaa).
 * @param {string|Date} date - Data em formato ISO string ou objeto Date
 * @returns {string} Data formatada como dd/mm/aaaa
 */
export function formatDateBR(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Data inválida';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formata uma data com hora no padrão brasileiro (dd/mm/aaaa às HH:mm).
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTimeBR(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Data inválida';

  const datePart = formatDateBR(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${datePart} às ${hours}:${minutes}`;
}

/**
 * Converte um texto em slug URL-friendly.
 * Remove acentos, caracteres especiais e converte para minúsculas.
 * @param {string} text
 * @returns {string}
 *
 * @example
 * slugify('Direito Administrativo') // 'direito-administrativo'
 * slugify('Licitações e Contratos!') // 'licitacoes-e-contratos'
 */
export function slugify(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')       // remove caracteres especiais
    .replace(/[\s_]+/g, '-')        // espaços e underscores viram hífen
    .replace(/--+/g, '-')           // remove hífens duplicados
    .replace(/^-+|-+$/g, '');       // remove hífens no início/fim
}

/**
 * Gera um código aleatório alfanumérico.
 * @param {number} [length=8] - Tamanho do código
 * @returns {string}
 *
 * @example
 * randomCode()     // 'A3K9M2X7'
 * randomCode(12)   // 'B7N2P5Q8R1T4'
 */
export function randomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  // Gera bytes criptograficamente aleatórios quando disponível
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return result;
}

/**
 * Gera um código de referral único prefixado.
 * @param {string} [prefix='GAB'] - Prefixo do código
 * @param {number} [length=6] - Tamanho da parte aleatória
 * @returns {string}
 *
 * @example
 * generateReferralCode()    // 'GAB-A3K9M2'
 * generateReferralCode('REF', 8) // 'REF-B7N2P5Q8'
 */
export function generateReferralCode(prefix = 'GAB', length = 6) {
  return `${prefix}-${randomCode(length)}`;
}

/**
 * Calcula a porcentagem de acerto.
 * @param {number} acertos - Quantidade de acertos
 * @param {number} total - Quantidade total de questões
 * @returns {number} Porcentagem de acerto (0 a 100, com 1 casa decimal)
 */
export function calculateAccuracy(acertos, total) {
  if (!total || total <= 0) return 0;
  if (acertos < 0) return 0;
  if (acertos > total) return 100;

  return Math.round((acertos / total) * 1000) / 10;
}

/**
 * Converte strings comuns para booleano de forma segura.
 * @param {string|boolean|number|null|undefined} value
 * @param {boolean} [defaultValue=false]
 * @returns {boolean}
 *
 * @example
 * parseBoolean('true')    // true
 * parseBoolean('1')       // true
 * parseBoolean('sim')     // true
 * parseBoolean('false')   // false
 * parseBoolean('0')       // false
 * parseBoolean(null)      // false
 */
export function parseBoolean(value, defaultValue = false) {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'number') return value !== 0;

  if (value === null || value === undefined) return defaultValue;

  const normalized = String(value).toLowerCase().trim();

  const truthy = ['true', '1', 'sim', 'yes', 'verdadeiro', 'v', 's', 'on'];
  const falsy = ['false', '0', 'nao', 'não', 'no', 'falso', 'f', 'off'];

  if (truthy.includes(normalized)) return true;
  if (falsy.includes(normalized)) return false;

  return defaultValue;
}

/**
 * Sanitiza entrada de texto contra XSS e injection básica.
 * Remove tags HTML, scripts e caracteres perigosos.
 * @param {string} input - Texto a ser sanitizado
 * @returns {string} Texto sanitizado
 *
 * @example
 * sanitizeInput('<script>alert("xss")</script>') // '&lt;script&gt;alert("xss")&lt;/script&gt;'
 * sanitizeInput('Texto normal') // 'Texto normal'
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Trunca um texto mantendo o comprimento máximo.
 * @param {string} text
 * @param {number} [maxLength=100]
 * @param {string} [suffix='...']
 * @returns {string}
 */
export function truncate(text, maxLength = 100, suffix = '...') {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Calcula a diferença em dias entre duas datas.
 * @param {Date|string} date1
 * @param {Date|string} date2
 * @returns {number} Diferença em dias (positiva se date1 > date2)
 */
export function daysBetween(date1, date2) {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((d1.getTime() - d2.getTime()) / msPerDay);
}

/**
 * Verifica se uma data está no passado.
 * @param {Date|string} date
 * @returns {boolean}
 */
export function isPast(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.getTime() < Date.now();
}

/**
 * Formata um número em moeda brasileira (R$).
 * @param {number} value
 * @returns {string}
 *
 * @example
 * formatBRL(19.90) // 'R$ 19,90'
 * formatBRL(1500)  // 'R$ 1.500,00'
 */
export function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata um número com separadores brasileiros.
 * @param {number} value
 * @returns {string}
 *
 * @example
 * formatNumber(1500) // '1.500'
 * formatNumber(3.14) // '3,14'
 */
export function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Retorna os dias da semana em português.
 * @returns {string[]}
 */
export function getDiasSemana() {
  return ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
}

/**
 * Retorna os meses do ano em português.
 * @returns {string[]}
 */
export function getMeses() {
  return [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
}

/**
 * Deep clone simples via JSON (sem funções/símbolos).
 * @param {*} obj
 * @returns {*}
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Agrupa um array de objetos por uma propriedade.
 * @template T
 * @param {T[]} array
 * @param {string} key - Propriedade para agrupar
 * @returns {Object<string, T[]>}
 */
export function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key] ?? 'outros');
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
    return groups;
  }, {});
}

/**
 * Atraso (sleep) assíncrono.
 * @param {number} ms - Milissegundos
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extrai o domínio de uma URL.
 * @param {string} url
 * @returns {string}
 */
export function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
