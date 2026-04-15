/**
 * Constantes e configurações do Gabaritou v3.
 * Valores centrais: preços, limites, thresholds.
 */

// ─── Preços 2026 (Shark Strategy / Estratégia Tubarão) ───────────
export const PRICING = {
  vitorioso: {
    id: 'vitorioso',
    name: 'Vitorioso',
    price: 7.90,
    total: 94.80,
    periodMonths: 12,
    label: 'R$ 7,90/mês (Anual)',
    description: 'Compromisso anual — R$ 94,80/ano',
  },
  combatente: {
    id: 'combatente',
    name: 'Combatente',
    price: 11.90,
    total: 71.40,
    periodMonths: 6,
    label: 'R$ 11,90/mês (Semestral)',
    description: 'Compromisso semestral — R$ 71,40/semestre',
  },
  sniper: {
    id: 'sniper',
    name: 'Sniper',
    price: 19.90,
    total: 19.90,
    periodMonths: 1,
    label: 'R$ 19,90/mês (Mensal)',
    description: 'Sem compromisso — R$ 19,90/mês',
  },
  radar: {
    id: 'radar',
    name: 'Radar Elite',
    price: 3.00,
    total: 3.00,
    periodMonths: 1,
    label: 'R$ 3,00/mês (Radar Elite)',
    description: 'Alertas de Editais, Atualidades Real-Time e Dicas Estratégicas',
  },
  trialDays: 3,
  MAX_BETA_USERS: 50,
  BETA_ACCESS_CODE: 'GABARITOU2026',
  REFERRAL_DISCOUNT_PER_USER: 1.00, // R$ 1,00 de desconto por indicação ativa
  MIN_REVENUE_PER_USER: 2.00,       // Lucro mínimo garantido por usuário
  currency: 'BRL',
};

export const BETA_ACCESS_CODE = 'GABARITOU2026';
export const MAX_BETA_USERS = 50;
export const REFERRAL_DISCOUNT_PER_USER = 1.00;
export const MIN_REVENUE_PER_USER = 2.00;

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

export const SOCIAL = {
  channel: process.env.TELEGRAM_CHANNEL_URL || 'https://t.me/gabaritou_oficial_canal',
  group: process.env.TELEGRAM_GROUP_URL || 'https://t.me/gabaritou_oficial_grupo',
};

export default {
  PRICING,
  LIMITS,
  INTERCEPTION,
  ADAPTIVE_LEVELS,
  FEEDBACK,
  BANCAS,
  MATERIAS,
  SOCIAL: {
    channel: process.env.TELEGRAM_CHANNEL_URL || 'https://t.me/gabaritou_oficial_canal',
    group: process.env.TELEGRAM_GROUP_URL || 'https://t.me/gabaritou_oficial_grupo',
  }
};
