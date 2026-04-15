/**
 * Serviço Freemium - Gestão de planos, limites e conversão.
 *
 * Modelo de negócio v3.1 (12/04/2026):
 * - Free: 1 banca, 5 predições/semana, limitado
 * - Trial: 7 dias de premium grátis (uma vez por usuário, sem cartão)
 * - Premium Vitorioso: R$ 7,90/mês (anual R$94,80) — cartão recorrente
 * - Premium Combatente: R$ 11,90/mês (semestral R$71,40) — cartão recorrente
 * - Premium Sniper: R$ 19,90/mês (mensal, sem compromisso)
 * - Referral: 3 indicações = 1 mês grátis
 * - Pagamentos: PIX + Cartão de Crédito Recorrente (Mercado Pago Pre-approval)
 *
 * Gabaritou v3.1 — BeConfident + Groq-Engine
 */

import logger from '../utils/logger.js';
import { formatBRL } from '../utils/helpers.js';

const log = logger.child('FreemiumService');

/** Preços v3.1 — Modelo 3-tier com cartão recorrente */
export const PLANS = {
  vitorioso: {
    id: 'vitorioso',
    name: 'Vitorioso',
    priceMonthly: 7.90,
    total: 94.80,
    cycleMonths: 12,
    cycleLabel: 'Anual',
    label: 'R$ 7,90/mês',
    totalLabel: 'R$ 94,80/ano',
    discount: 60,
    description: 'Compromisso anual — menor custo mensal do mercado',
    method: 'cartao_recorrente',
    badge: '🏆',
  },
  combatente: {
    id: 'combatente',
    name: 'Combatente',
    priceMonthly: 11.90,
    total: 71.40,
    cycleMonths: 6,
    cycleLabel: 'Semestral',
    label: 'R$ 11,90/mês',
    totalLabel: 'R$ 71,40/semestre',
    discount: 40,
    description: 'Equilíbrio entre economia e flexibilidade',
    method: 'cartao_recorrente',
    badge: '⚔️',
  },
  sniper: {
    id: 'sniper',
    name: 'Sniper',
    priceMonthly: 19.90,
    total: 19.90,
    cycleMonths: 1,
    cycleLabel: 'Mensal',
    label: 'R$ 19,90/mês',
    totalLabel: 'R$ 19,90/mês',
    discount: 0,
    description: 'Sem compromisso — flexibilidade máxima',
    method: 'pix_cartao',
    badge: '🎯',
  },
};

/** Preço médio ponderado (AMP) estimado */
export const AMP_PRICE = 11.50;

/** Preço legado para compatibilidade */
export const PREMIUM_PRICE = 19.90;

/** Duração do período de trial em dias */
const TRIAL_DURATION_DAYS = 7;

/** Limite de predições semanais para plano free */
const FREE_WEEKLY_PREDICTIONS = 5;

/** Duração de 1 mês premium em milissegundos */
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/** Duração do trial em milissegundos */
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

// ============================================================
// Limites por plano
// ============================================================

/**
 * Retorna os limites de cada plano.
 * @param {'free'|'trial'|'premium'} plan
 * @returns {Object} Limites do plano
 */
export function getPlanLimits(plan) {
  const plans = {
    free: {
      bancas_permitidas: 1,
      predicoes_por_semana: FREE_WEEKLY_PREDICTIONS,
      predicoes_ilimitadas: false,
      acuracia_relatorios: false,
      plano_estudos: false,
      simulado_adaptativo: false,
      prova_day: false,
      desafios: false,
      ranking_completo: false,
      suporte_prioritario: false,
      api_acesso: false,
      badge: '🌱',
      nome: 'Gratuito',
      preco: 0,
    },
    trial: {
      bancas_permitidas: 99,
      predicoes_por_semana: 999,
      predicoes_ilimitadas: true,
      acuracia_relatorios: true,
      plano_estudos: true,
      simulado_adaptativo: false,
      prova_day: true,
      desafios: true,
      ranking_completo: true,
      suporte_prioritario: false,
      api_acesso: false,
      badge: '⭐',
      nome: 'Teste Premium',
      preco: 0,
    },
    premium: {
      bancas_permitidas: 99,
      predicoes_por_semana: 999,
      predicoes_ilimitadas: true,
      acuracia_relatorios: true,
      plano_estudos: true,
      simulado_adaptativo: true,
      prova_day: true,
      desafios: true,
      ranking_completo: true,
      suporte_prioritario: true,
      api_acesso: true,
      badge: '👑',
      nome: 'Premium',
      preco: PLANS.sniper.priceMonthly,
      planos_disponiveis: PLANS,
    },
  };

  return plans[plan] || plans.free;
}

/**
 * Lista todos os planos disponíveis para exibição.
 * @returns {Object[]}
 */
export function getAllPlans() {
  return [
    { ...getPlanLimits('free'), id: 'free' },
    { ...getPlanLimits('trial'), id: 'trial' },
    { ...getPlanLimits('premium'), id: 'premium' },
  ];
}

// ============================================================
// Controle de acesso
// ============================================================

/**
 * Verifica se o usuário pode acessar uma funcionalidade específica.
 * @param {Object} user - Dados do usuário
 * @param {string} feature - Nome da feature
 * @returns {Object} { allowed: boolean, reason: string }
 */
export function canAccessFeature(user, feature) {
  if (!user) {
    return { allowed: false, reason: 'Usuário não encontrado' };
  }

  const plan = resolveEffectivePlan(user);
  const limits = getPlanLimits(plan);

  if (limits[feature] === true) {
    return { allowed: true, reason: 'Acesso permitido' };
  }

  // Verificações específicas por feature
  if (feature === 'predicoes') {
    const weeklyCount = countWeeklyPredictions(user.id);
    if (weeklyCount >= limits.predicoes_por_semana) {
      return {
        allowed: false,
        reason: `Limite semanal atingido (${weeklyCount}/${limits.predicoes_por_semana}). Faça upgrade para Premium!`,
        upgrade: true,
      };
    }
    return { allowed: true, reason: 'Acesso permitido' };
  }

  return {
    allowed: false,
    reason: `Feature "${feature}" não disponível no plano ${limits.nome}. Faça upgrade!`,
    upgrade: true,
  };
}

/**
 * Resolve o plano efetivo do usuário considerando data de expiração.
 * @param {Object} user
 * @returns {'free'|'trial'|'premium'}
 */
function resolveEffectivePlan(user) {
  if (!user) return 'free';

  // Se o plano expirou, volta para free
  if (user.premium_until) {
    const premiumAte = new Date(user.premium_until);
    if (premiumAte > new Date()) {
      return user.plan === 'trial' ? 'trial' : 'premium';
    }
  }

  return 'free';
}

// ============================================================
// Contagem de uso
// ============================================================

/** Store para rastrear predições semanais */
const weeklyUsageStore = new Map();

/**
 * Conta quantas predições o usuário usou nesta semana.
 * @param {string} userId
 * @returns {number}
 */
export function countWeeklyPredictions(userId) {
  if (!userId) return 0;

  const usage = weeklyUsageStore.get(userId) || [];
  const now = new Date();
  const inicioSemana = getInicioSemana(now);

  // Filtra apenas predições desta semana
  const thisWeek = usage.filter((entry) => new Date(entry.timestamp) >= inicioSemana);

  return thisWeek.length;
}

/**
 * Registra o uso de uma predição.
 * @param {string} userId
 * @param {string} [banca]
 * @param {string} [materia]
 */
export function trackPrediction(userId, banca, materia) {
  if (!userId) return;

  const usage = weeklyUsageStore.get(userId) || [];
  usage.push({
    timestamp: new Date().toISOString(),
    banca: banca || null,
    materia: materia || null,
  });

  weeklyUsageStore.set(userId, usage);
}

/**
 * Retorna o início da semana (segunda-feira, 00:00).
 * @param {Date} date
 * @returns {Date}
 */
function getInicioSemana(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// ============================================================
// Upgrade e Trial
// ============================================================

/**
 * Ativa o plano premium para um usuário.
 * @param {string} userId
 * @param {number} [meses=1] - Quantidade de meses
 * @returns {Object} Resultado da ativação
 */
export function upgradeToPremium(userId, meses = 1) {
  if (!userId) {
    return { sucesso: false, motivo: 'userId é obrigatório' };
  }

  const premiumAte = new Date();
  premiumAte.setMonth(premiumAte.getMonth() + meses);

  const result = {
    sucesso: true,
    userId,
    plan: 'premium',
    premium_until: premiumAte.toISOString(),
    meses,
    valor_total: Number((meses * AMP_PRICE).toFixed(2)),
    valor_formatado: formatBRL(meses * AMP_PRICE),
    data_ativacao: new Date().toISOString(),
  };

  log.info('Upgrade para Premium', result);

  return result;
}

/**
 * Verifica se o usuário pode iniciar um período de trial.
 * Regras: apenas uma vez por conta, não pode ser premium atual.
 * @param {Object} user
 * @returns {Object} { eligible: boolean, reason: string }
 */
export function checkTrialEligibility(user) {
  if (!user) {
    return { eligible: false, reason: 'Usuário não encontrado' };
  }

  // Já é premium ativo
  const effectivePlan = resolveEffectivePlan(user);
  if (effectivePlan === 'premium') {
    return {
      eligible: false,
      reason: 'Você já é um usuário Premium! 😎',
    };
  }

  // Já usou trial antes
  if (user.trial_used) {
    return {
      eligible: false,
      reason: 'Você já utilizou seu período de teste anteriormente. Mas pode assinar Premium agora!',
      canUpgrade: true,
    };
  }

  return {
    eligible: true,
    reason: `Você pode iniciar ${TRIAL_DURATION_DAYS} dias grátis de Premium!`,
    trial_days: TRIAL_DURATION_DAYS,
  };
}

/**
 * Inicia o período de trial de 7 dias premium grátis.
 * @param {string} userId
 * @returns {Object} Resultado da ativação do trial
 */
export function activateTrial(userId) {
  if (!userId) {
    return { sucesso: false, motivo: 'userId é obrigatório' };
  }

  const trialAte = new Date();
  trialAte.setDate(trialAte.getDate() + TRIAL_DURATION_DAYS);

  const result = {
    sucesso: true,
    userId,
    plan: 'trial',
    premium_until: trialAte.toISOString(),
    trial_days: TRIAL_DURATION_DAYS,
    trial_expires_at: trialAte.toISOString(),
    data_ativacao: new Date().toISOString(),
    mensagem: `⭐ Seu trial de ${TRIAL_DURATION_DAYS} dias foi ativado! Aproveite todas as funcionalidades Premium.`,
  };

  log.info('Trial ativado', { userId, trialAte: trialAte.toISOString() });

  return result;
}

// ============================================================
// Funil de Conversão
// ============================================================

/** Store simplificado para métricas do funil */
const funnelStore = {
  visitors: 0,
  signups: 0,
  trials: 0,
  conversions: 0,
  referral_signups: 0,
};

/**
 * Registra um evento no funil de conversão.
 * @param {'visitor'|'signup'|'trial'|'conversion'|'referral_signup'} evento
 */
export function trackFunnelEvent(evento) {
  if (evento in funnelStore) {
    funnelStore[evento]++;
  }
}

/**
 * Retorna métricas completas do funil de conversão.
 * @returns {Object}
 */
export function getConversionFunnel() {
  const { visitors, signups, trials, conversions, referral_signups } = funnelStore;

  const signupRate = visitors > 0 ? Math.round((signups / visitors) * 100) : 0;
  const trialRate = signups > 0 ? Math.round((trials / signups) * 100) : 0;
  const conversionRate = trials > 0 ? Math.round((conversions / trials) * 100) : 0;
  const overallRate = visitors > 0 ? Math.round((conversions / visitors) * 100) : 0;

  return {
    visitantes: visitors,
    cadastros: signups,
    trials,
    conversoes: conversions,
    cadastros_por_referral: referral_signups,
    taxas: {
      cadastro: `${signupRate}%`,
      trial: `${trialRate}%`,
      conversao: `${conversionRate}%`,
      conversao_geral: `${overallRate}%`,
    },
    receita_mensal_estimada: conversions * AMP_PRICE,
    receita_formatada: formatBRL(conversions * AMP_PRICE),
    ltv_estimado: conversions > 0 ? formatBRL(AMP_PRICE * 6) : 'R$ 0,00',
    resumo: `📊 Funil: ${visitors} visitantes → ${signups} cadastros (${signupRate}%) → ${trials} trials (${trialRate}%) → ${conversions} premium (${conversionRate}%)`,
  };
}

/**
 * Retorna informações de preço para exibição.
 * @returns {Object}
 */
export function getPricingInfo() {
  return {
    modelo: '3-tier com cartão recorrente',
    planos: PLANS,
    preco_minimo: PLANS.vitorioso.priceMonthly,
    preco_minimo_formatado: formatBRL(PLANS.vitorioso.priceMonthly),
    preco_medio_pond: AMP_PRICE,
    preco_medio_pond_formatado: formatBRL(AMP_PRICE),
    preco_sniper: PLANS.sniper.priceMonthly,
    preco_sniper_formatado: formatBRL(PLANS.sniper.priceMonthly),
    vitorioso: {
      label: PLANS.vitorioso.label,
      total: PLANS.vitorioso.totalLabel,
      desconto: `${PLANS.vitorioso.discount}% OFF vs Sniper`,
      liquido_mensal: 7.11, // pós taxas MP (3.99% + R$0.99)
    },
    combatente: {
      label: PLANS.combatente.label,
      total: PLANS.combatente.totalLabel,
      desconto: `${PLANS.combatente.discount}% OFF vs Sniper`,
      liquido_mensal: 10.91,
    },
    sniper: {
      label: PLANS.sniper.label,
      total: PLANS.sniper.totalLabel,
      desconto: 'Sem desconto',
      liquido_mensal: 18.51,
    },
    trial_dias: TRIAL_DURATION_DAYS,
    trial_sem_cartao: true,
    pagamento: 'PIX + Cartão de Crédito Recorrente (Mercado Pago Pre-approval)',
    taxa_mp: '3,99% + R$0,99 por transação',
    referral_premium: 'A cada 3 indicações = 1 mês grátis',
    data_versao: '12/04/2026',
    versao: 'v3.1',
  };
}

export default {
  PREMIUM_PRICE,
  PLANS,
  AMP_PRICE,
  getPlanLimits,
  getAllPlans,
  canAccessFeature,
  countWeeklyPredictions,
  trackPrediction,
  upgradeToPremium,
  checkTrialEligibility,
  activateTrial,
  getConversionFunnel,
  trackFunnelEvent,
  getPricingInfo,
};
