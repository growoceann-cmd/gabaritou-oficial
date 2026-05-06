/**
 * Middleware de autenticação e autorização — Gabaritou v3.
 * JWT authentication, admin auth, B2B auth, rate limiting.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ─── Security: no hardcoded fallbacks ────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}

const ADMIN_SECRET = process.env.ADMIN_SECRET;
if (!ADMIN_SECRET) {
  throw new Error('FATAL: ADMIN_SECRET environment variable is not set. Refusing to start.');
}

/**
 * Validates UUID v4 format.
 * @param {string} str
 * @returns {boolean}
 */
export function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Validates email format.
 * @param {string} str
 * @returns {boolean}
 */
export function isValidEmail(str) {
  if (!str || typeof str !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(str);
}

/**
 * Recursively sanitizes all string values in an object.
 * Strips HTML tags, control characters, and null bytes.
 * @param {*} obj
 * @returns {*} Sanitized copy
 */
export function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return obj
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars except \t\n\r
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

/** Contadores de requisições por IP para rate limiting em memória */
const requestCounts = new Map();

/**
 * Middleware de autenticação JWT para rotas de usuário.
 * Verifica o header Authorization: Bearer <token>
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      sucesso: false,
      erro: 'Token de autenticação não fornecido',
      codigo: 'TOKEN_AUSENTE',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        sucesso: false,
        erro: 'Token expirado',
        codigo: 'TOKEN_EXPIRADO',
      });
    }
    return res.status(403).json({
      sucesso: false,
      erro: 'Token inválido',
      codigo: 'TOKEN_INVALIDO',
    });
  }
}

/**
 * Middleware de autenticação admin via header ADMIN_SECRET.
 * Usado para rotas administrativas protegidas.
 * Uses timingSafeEqual to prevent timing attacks.
 */
export function authenticateAdmin(req, res, next) {
  const adminSecret = req.headers['admin_secret'] || req.headers['x-admin-secret'];

  if (!adminSecret) {
    return res.status(401).json({
      sucesso: false,
      erro: 'Credencial de administrador não fornecida',
      codigo: 'ADMIN_SECRET_AUSENTE',
    });
  }

  // Timing-safe comparison to prevent timing attacks
  let isValid = false;
  try {
    const adminSecretBuf = Buffer.from(adminSecret, 'utf-8');
    const validSecretBuf = Buffer.from(ADMIN_SECRET, 'utf-8');
    if (adminSecretBuf.length === validSecretBuf.length) {
      isValid = crypto.timingSafeEqual(adminSecretBuf, validSecretBuf);
    }
  } catch {
    isValid = false;
  }

  if (!isValid) {
    return res.status(403).json({
      sucesso: false,
      erro: 'Credencial de administrador inválida',
      codigo: 'ADMIN_SECRET_INVALIDO',
    });
  }

  req.isAdmin = true;
  next();
}

/**
 * Middleware de autenticação B2B via header api_key.
 * Verifica se a chave de API pertence a um parceiro ativo.
 * Always validates — no environment bypass.
 */
export async function authenticateB2B(req, res, next) {
  const apiKey = req.headers['api_key'] || req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      sucesso: false,
      erro: 'Chave de API B2B não fornecida',
      codigo: 'API_KEY_AUSENTE',
    });
  }

  try {
    const validKeys = (process.env.B2B_API_KEYS || '').split(',').filter(Boolean);

    if (validKeys.length === 0 || !validKeys.includes(apiKey)) {
      return res.status(403).json({
        sucesso: false,
        erro: 'Chave de API B2B inválida',
        codigo: 'API_KEY_INVALIDA',
      });
    }

    req.b2bApiKey = apiKey;
    req.b2bPartner = { id: 'partner-default', nome: 'Parceiro Padrão', plano: 'enterprise' };
    next();
  } catch (err) {
    return res.status(500).json({
      sucesso: false,
      erro: 'Erro ao verificar credenciais B2B',
      codigo: 'ERRO_B2B_AUTH',
    });
  }
}

/**
 * Middleware de autenticação opcional.
 * Se houver token válido, popula req.user; caso contrário, continua sem autenticação.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch {
    req.user = null;
  }

  next();
}

/**
 * Factory para middleware de rate limiting.
 * Limita requisições por IP com base no limite por minuto.
 *
 * @param {number} limitPerMinute - Número máximo de requisições por minuto por IP
 * @returns {Function} Middleware Express
 */
export function rateLimit(limitPerMinute = 60) {
  const windowMs = 60 * 1000; // 1 minuto

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, { count: 1, startTime: now });
      return next();
    }

    const record = requestCounts.get(ip);
    const elapsed = now - record.startTime;

    if (elapsed > windowMs) {
      record.count = 1;
      record.startTime = now;
      return next();
    }

    record.count += 1;

    if (record.count > limitPerMinute) {
      return res.status(429).json({
        sucesso: false,
        erro: 'Limite de requisições excedido',
        codigo: 'RATE_LIMIT_EXCEDIDO',
        detalhes: {
          limite: limitPerMinute,
          reinicioEm: Math.ceil((windowMs - elapsed) / 1000),
        },
      });
    }

    next();
  };
}

/**
 * Limpa contadores antigos de rate limiting periodicamente.
 */
function cleanRateLimitData() {
  const windowMs = 60 * 1000;
  const now = Date.now();

  for (const [ip, record] of requestCounts.entries()) {
    if (now - record.startTime > windowMs * 2) {
      requestCounts.delete(ip);
    }
  }
}

// Limpar dados de rate limit a cada 5 minutos
setInterval(cleanRateLimitData, 5 * 60 * 1000);
