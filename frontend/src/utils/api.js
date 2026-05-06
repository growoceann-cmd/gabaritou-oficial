import DOMPurify from 'dompurify';

const BASE_URL = '/api';
const TIMEOUT_MS = 10000;

/**
 * Strips any HTML tags from a string to prevent XSS in user-visible data.
 * @param {string} str
 * @returns {string}
 */
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [] });
}

/**
 * Sanitizes an entire object recursively (string values only).
 * @param {*} obj
 * @returns {*}
 */
function sanitizeDeep(obj) {
  if (typeof obj === 'string') return sanitize(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeDeep);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(obj)) {
      out[key] = sanitizeDeep(val);
    }
    return out;
  }
  return obj;
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const adminSecret = localStorage.getItem('admin_secret') || '';

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(adminSecret ? { 'x-admin-secret': adminSecret } : {}),
      ...options.headers,
    },
    ...options,
  };

  // AbortController for timeout
  const controller = new AbortController();
  config.signal = controller.signal;
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const error = new Error('A requisição excedeu o tempo limite. Tente novamente.');
      error.status = 408;
      throw error;
    }
    const error = new Error('Erro de conexão. Verifique sua rede e tente novamente.');
    error.status = 0;
    throw error;
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Clear invalid secret and redirect
      localStorage.removeItem('admin_secret');
      const error = new Error('Sessão expirada ou não autorizada. Faça login novamente.');
      error.status = response.status;
      error.needsAuth = true;
      throw error;
    }
    const error = new Error(`Erro do servidor (${response.status}). Tente novamente mais tarde.`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return sanitizeDeep(data);
}

// ---- Stats ----
export const getStats = () => request('/stats');

// ---- Users ----
export const getUsers = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/users${query ? `?${query}` : ''}`);
};

export const getUser = (id) => request(`/users/${id}`);

// ---- Predictions ----
export const getPredictions = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/predictions${query ? `?${query}` : ''}`);
};

// ---- Payments ----
export const getPayments = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/payments${query ? `?${query}` : ''}`);
};

// ---- Config ----
export const getConfig = () => request('/config');

export const updateConfig = (data) =>
  request('/config', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// ---- Sessions ----
export const getSessions = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/sessions${query ? `?${query}` : ''}`);
};
