import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gabaritou-secret-key-change-in-production';

/**
 * Armazena contadores de requisições por IP para rate limiting em memória.
 * Em produção, substituir por Redis ou similar.
 */
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
 * Usado para rotas administrativas que não usam JWT.
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

  const validSecret = process.env.ADMIN_SECRET || 'gabaritou-admin-2024';

  if (adminSecret !== validSecret) {
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
    // Em produção, verificar contra banco de dados
    // Aqui simulamos a verificação
    const validKeys = (process.env.B2B_API_KEYS || '').split(',').filter(Boolean);

    if (validKeys.length === 0 || !validKeys.includes(apiKey)) {
      // Se não há chaves configuradas, aceitar qualquer chave (modo dev)
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          sucesso: false,
          erro: 'Chave de API B2B inválida',
          codigo: 'API_KEY_INVALIDA',
        });
      }
    }

    req.b2bApiKey = apiKey;
    req.b2bPartner = { id: 'partner-default', nome: 'Parceiro Padrão', plano: 'enterprise' };
    next();
  } catch (err) {
    return res.status(500).json({
      sucesso: false,
      erro: 'Erro ao verificar credenciais B2B',
      codigo: 'ERRO_B2B_AUTH',
      detalhes: err.message,
    });
  }
}

/**
 * Middleware de autenticação opcional.
 * Se houver token válido, popula req.user; caso contrário, continua sem autenticação.
 * Útil para rotas que funcionam tanto para usuários livres quanto premium.
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
      // Resetar janela
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
 * Limpar contadores antigos periodicamente (chamar a cada 5 minutos).
 */
export function cleanRateLimitData() {
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
