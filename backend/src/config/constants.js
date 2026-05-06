/**
 * Constantes e configurações do Gabaritou v3.
 * Valores centrais: preços, limites, thresholds.
 */

// ─── Environment Variable Validation ─────────────────────────────
export const REQUIRED_ENV_VARS = [
  'BOT_TOKEN',
  'DATABASE_URL',
  'JWT_SECRET',
  'ADMIN_SECRET',
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'MP_ACCESS_TOKEN',
  'DASHSCOPE_API_KEY',
];

export const OPTIONAL_ENV_VARS = [
  'CORS_ORIGIN',
  'MP_WEBHOOK_URL',
  'TELEGRAM_WEBHOOK_URL',
];

/**
 * Validates that all required environment variables are set.
 * Throws descriptive errors if any are missing.
 * Logs warnings for optional vars that are unset.
 */
export function validateEnvVars() {
  const missing = [];

  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `FATAL: Missing required environment variables: ${missing.join(', ')}. ` +
      'Please set them in your .env file or environment before starting the server.'
    );
  }

  // Warnings for optional vars
  for (const varName of OPTIONAL_ENV_VARS) {
    if (!process.env[varName]) {
      console.warn(`  ⚠️  Optional env var "${varName}" is not set. Default behavior will be used.`);
    }
  }

  console.log('  ✓ All required environment variables validated.');
}

// ─── Preços 2026 ──────────────────────────────────────────────────
export const PRICING = {
  vitorioso: {
    price: 5.90,
    label: 'R$ 5,90/mês',
    description: 'Plano Vitorioso — O plano que os cursinhos odeiam',
  },
  launch: {
    price: 19.90,
    label: 'R$ 19,90/mês',
    description: 'Preço de lançamento — primeiros 6 meses',
    periodMonths: 6,
  },
  regular: {
    price: 24.90,
    label: 'R$ 24,90/mês',
    description: 'Preço regular após período de lançamento',
  },
  trialDays: 7,
  currency: 'BRL',
};

// ─── Limites Free vs Premium ─────────────────────────────────────
export const LIMITS = {
  free: {
    predicoesPorDia: 1,
    bancasAcessiveis: 1,
    topicosVisiveis: 5,
    simuladosPorSemana: 1,
    coachPorDia: 3,
    provaDay: false,
    rankingCompleto: false,
  },
  premium: {
    predicoesPorDia: Infinity,
    bancasAcessiveis: Infinity,
    topicosVisiveis: 20,
    simuladosPorSemana: Infinity,
    coachPorDia: Infinity,
    provaDay: true,
    rankingCompleto: true,
  },
};

// ─── BeConfident: Thresholds de interceptação ─────────────────────
export const INTERCEPTION = {
  /** Tempo mínimo entre mensagens para considerar contexto (ms) */
  minTimeBetweenMessages: 5000,
  /** Janela de contexto para "conversa natural" (ms) = 30 min */
  contextWindowMs: 30 * 60 * 1000,
  /** Número de mensagens no contexto para ativar interceptação */
  minMessagesForInterception: 3,
  /** Score máximo de fadiga (0-100). Acima disso, não intercepta */
  maxFatigueScore: 70,
  /** Nível mínimo do usuário para micro-sessões difíceis */
  minLevelForHardSessions: 5,
  /** Tempo de micro-sessão recomendado (segundos) */
  microSessionDuration: { min: 30, max: 180 },
  /** Coeficiente de inertia: fração de interações que viram micro-sessões */
  inertiaRate: 0.6,
};

// ─── Níveis Adaptativos ──────────────────────────────────────────
export const ADAPTIVE_LEVELS = [
  { level: 1, name: 'Iniciante', minAccuracy: 0, maxAccuracy: 30, description: 'Revisão de conceitos fundamentais' },
  { level: 2, name: 'Básico', minAccuracy: 30, maxAccuracy: 50, description: 'Questões conceituais diretas' },
  { level: 3, name: 'Intermediário', minAccuracy: 50, maxAccuracy: 65, description: 'Questões com pegadinhas leves' },
  { level: 4, name: 'Avançado', minAccuracy: 65, maxAccuracy: 80, description: 'Questões situacionais e jurisprudência' },
  { level: 5, name: 'Expert', minAccuracy: 80, maxAccuracy: 90, description: 'Questões complexas multi-tema' },
  { level: 6, name: 'Mestre', minAccuracy: 90, maxAccuracy: 100, description: 'Questões de alta dificuldade + simulação real' },
];

// ─── Feedback Emocionless ────────────────────────────────────────
export const FEEDBACK = {
  /** Threshold de acerto para feedback positivo */
  positiveThreshold: 0.7,
  /** Threshold de acerto para feedback de alerta */
  warningThreshold: 0.4,
  /** Threshold para indicar que o tópico precisa de revisão */
  reviewThreshold: 0.5,
  /** Templates de feedback (sem emoji excessivo, sem adjetivos de emoção) */
  templates: {
    correct: [
      'Alternativa correta. {explicacao}',
      'Resposta certa — {explicacao}',
    ],
    wrong: [
      'Alternativa incorreta. {explicacao}',
      'Resposta errada — a correta é {gabarito}. {explicacao}',
    ],
    partial: [
      'Parcialmente correto. {explicacao}',
    ],
  },
};

// ─── Bancas ──────────────────────────────────────────────────────
export const BANCAS = [
  { id: 'CESPE', nome: 'CESPE (CEBRASPE)', cor: '#1a73e8' },
  { id: 'FGV', nome: 'FGV', cor: '#e91e63' },
  { id: 'FCC', nome: 'FCC', cor: '#4caf50' },
  { id: 'VUNESP', nome: 'VUNESP', cor: '#ff9800' },
  { id: 'QUADRIX', nome: 'Quadrix', cor: '#9c27b0' },
];

// ─── Matérias ────────────────────────────────────────────────────
export const MATERIAS = [
  { id: 'dir_constitucional', nome: 'Direito Constitucional', emoji: '⚖️' },
  { id: 'dir_administrativo', nome: 'Direito Administrativo', emoji: '🏛️' },
  { id: 'dir_penal', nome: 'Direito Penal', emoji: '🔒' },
  { id: 'dir_civil', nome: 'Direito Civil', emoji: '📄' },
  { id: 'portugues', nome: 'Língua Portuguesa', emoji: '📝' },
  { id: 'raciocinio_logico', nome: 'Raciocínio Lógico', emoji: '🧠' },
  { id: 'informatica', nome: 'Informática', emoji: '💻' },
  { id: 'administracao_publica', nome: 'Administração Pública', emoji: '📊' },
];

export default {
  PRICING,
  LIMITS,
  INTERCEPTION,
  ADAPTIVE_LEVELS,
  FEEDBACK,
  BANCAS,
  MATERIAS,
};
