/**
 * Serviço Viral - Motor de compartilhamento, referrals e leaderboard.
 *
 * O mecanismo viral funciona assim:
 * - Usuários compartilham seus "Gabaritou Scores" nas redes sociais
 * - Cada share traz novos usuários via referral link
 * - 3 referrals = 1 mês premium grátis
 * - Leaderboard gamifica e incentiva competição saudável
 *
 * Gabaritou v3.1 — BeConfident + Groq-Engine
 * Atualizado: 12/04/2026
 */

import { randomCode, generateReferralCode, formatBRL, calculateAccuracy } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const log = logger.child('ViralService');

/** Armazenamento em memória (em produção: Supabase) */
const usersStore = new Map();
const referralsStore = new Map();
const sharesStore = new Map();
const leaderboardCache = new Map();

// ============================================================
// Score Cards
// ============================================================

/**
 * Gera um Gabaritou Score - cartão compartilhável mostrando
 * a performance do usuário nas predições.
 *
 * @param {Object} user - Dados do usuário
 * @param {string} user.id
 * @param {string} user.name
 * @param {string} user.referral_code
 * @param {Object} concurso - Dados do concurso
 * @param {string} concurso.nome
 * @param {string} concurso.banca
 * @param {number} acertos - Questões acertadas
 * @param {number} total - Total de questões
 * @returns {Object} Cartão de score para compartilhamento
 */
export function generateGabaritouScore(user, concurso, acertos, total) {
  const porcentagem = calculateAccuracy(acertos, total);

  let titulo = '';
  let emoji = '';
  if (porcentagem >= 80) {
    titulo = 'Mestre das Predições';
    emoji = '🏆';
  } else if (porcentagem >= 60) {
    titulo = 'Ótimo Previsor';
    emoji = '🎯';
  } else if (porcentagem >= 40) {
    titulo = 'Bom Previsor';
    emoji = '👍';
  } else if (porcentagem >= 20) {
    titulo = 'Aprendiz';
    emoji = '📚';
  } else {
    titulo = 'Iniciante';
    emoji = '🌱';
  }

  const shareId = `score_${randomCode(10)}`;

  const scoreCard = {
    id: shareId,
    user_id: user.id,
    user_name: user.name,
    titulo,
    emoji,
    concurso: concurso.nome,
    banca: concurso.banca,
    acertos,
    total,
    porcentagem,
    referral_code: user.referral_code,
    referral_link: `https://t.me/gabaritou_bot?start=${user.referral_code}`,
    created_at: new Date().toISOString(),
    // Dados para gerar imagem
    image_data: {
      tipo: 'gabaritou_score',
      header: '🎯 GABARITOU SCORE',
      subheader: concurso.nome,
      usuario: user.name,
      estatisticas: [
        { label: 'Acertos', valor: acertos, cor: '#10B981' },
        { label: 'Total', valor: total, cor: '#6366F1' },
        { label: 'Acurácia', valor: `${porcentagem}%`, cor: porcentagem >= 60 ? '#10B981' : '#F59E0B' },
      ],
      titulo_classificacao: `${emoji} ${titulo}`,
      cta: '🔥 Veja minhas predições no Gabaritou!',
      rodape: 'gabaritou.com.br | Predições baseadas em dados',
    },
    texto_compartilhamento: [
      `${emoji} *Meu Gabaritou Score*`,
      ``,
      `📋 Concurso: ${concurso.nome}`,
      `📝 Banca: ${concurso.banca}`,
      `🎯 Acertos: ${acertos}/${total} (${porcentagem}%)`,
      `🏅 ${titulo}`,
      ``,
      `🔥 Teste também: https://t.me/gabaritou_bot?start=${user.referral_code}`,
    ].join('\n'),
  };

  // Registra o share
  sharesStore.set(shareId, {
    id: shareId,
    user_id: user.id,
    concurso: concurso.nome,
    porcentagem,
    created_at: new Date().toISOString(),
  });

  log.info('Gabaritou Score gerado', {
    userId: user.id,
    concurso: concurso.nome,
    acertos,
    total,
    porcentagem,
  });

  return scoreCard;
}

// ============================================================
// Referrals
// ============================================================

/**
 * Processa uma cadeia de referral quando um novo usuário entra via link.
 * @param {string} referrerId - ID do usuário que indicou
 * @param {Object} newUser - Dados do novo usuário
 * @param {string} newUser.id
 * @param {string} newUser.name
 * @returns {Object} Resultado do processamento
 */
export function processarReferral(referrerId, newUser) {
  if (!referrerId || !newUser || !newUser.id) {
    return { sucesso: false, motivo: 'Dados inválidos' };
  }

  // Não permite auto-referral
  if (referrerId === newUser.id) {
    log.warn('Tentativa de auto-referral detectada', { userId: newUser.id });
    return { sucesso: false, motivo: 'Auto-referral não permitido' };
  }

  // Verifica se o referenciador existe
  const referrer = usersStore.get(referrerId);
  if (!referrer) {
    return { sucesso: false, motivo: 'Referenciador não encontrado' };
  }

  // Conta referrals existentes do referenciador
  const referrerReferrals = referralsStore.get(referrerId) || [];

  // Verifica se o novo usuário já foi referenciado antes
  const jaReferenciado = Array.from(referralsStore.values())
    .flat()
    .some((r) => r.referred_id === newUser.id);

  if (jaReferenciado) {
    return { sucesso: false, motivo: 'Usuário já foi referenciado anteriormente' };
  }

  // Cria o registro de referral
  const referral = {
    id: `ref_${randomCode(10)}`,
    referrer_id: referrerId,
    referred_id: newUser.id,
    referred_name: newUser.name,
    created_at: new Date().toISOString(),
  };

  referrerReferrals.push(referral);
  referralsStore.set(referrerId, referrerReferrals);

  // Atualiza contagem no perfil do referenciador
  referrer.total_referrals = (referrer.total_referrals || 0) + 1;

  const premio = verificarPremioReferral(referrerId);

  log.info('Referral processado', {
    referrerId,
    referredId: newUser.id,
    referredName: newUser.name,
    totalReferrals: referrer.total_referrals,
    premioGanho: premio.ganhou,
  });

  return {
    sucesso: true,
    referral,
    total_referrals: referrer.total_referrals,
    proximo_premio: premio.proximo,
    premio_ganho: premio.ganhou ? premio : null,
  };
}

/**
 * Verifica se o usuário ganhou um prêmio por referrals.
 * Regra: a cada 3 referrals = 1 mês premium grátis.
 *
 * @param {string} userId
 * @returns {Object} Resultado da verificação
 */
export function verificarPremioReferral(userId) {
  const referrals = referralsStore.get(userId) || [];
  const user = usersStore.get(userId);
  const totalReferrals = referrals.length;

  const MESES_POR_REFERRAL = 3;
  const mesesGanhos = Math.floor(totalReferrals / MESES_POR_REFERRAL);

  // Verifica se acabou de atingir um novo múltiplo
  const atingiuNovoPremio = totalReferrals > 0 && totalReferrals % MESES_POR_REFERRAL === 0;

  if (atingiuNovoPremio && user) {
    // Ativa o prêmio premium
    const mesesAdicionais = 1;
    const premiumAte = user.premium_until
      ? new Date(user.premium_until)
      : new Date();

    premiumAte.setMonth(premiumAte.getMonth() + mesesAdicionais);

    user.premium_until = premiumAte.toISOString();
    user.plan = 'premium';

    log.info('Prêmio de referral ativado!', {
      userId,
      totalReferrals,
      mesesPremium: mesesGanhos,
      premiumAte: user.premium_until,
    });
  }

  const proximoEm = MESES_POR_REFERRAL - (totalReferrals % MESES_POR_REFERRAL);

  return {
    ganhou: atingiuNovoPremio,
    total_referrals: totalReferrals,
    meses_ganhos: mesesGanhos,
    proximo_premio_em: proximoEm === MESES_POR_REFERRAL && !atingiuNovoPremio ? proximoEm : proximoEm,
    regra: `A cada ${MESES_POR_REFERRAL} indicações = 1 mês premium grátis`,
  };
}

// ============================================================
// Leaderboard
// ============================================================

/**
 * Retorna o ranking de usuários por score de predição.
 * @param {string} [concurso] - Filtrar por concurso específico
 * @param {number} [limite=10] - Número de posições no ranking
 * @returns {Object[]} Lista de posições no ranking
 */
export function getLeaderboard(concurso, limite = 10) {
  let entries = [];

  for (const [userId, user] of usersStore) {
    const score = user.prediction_score || 0;
    if (score > 0) {
      entries.push({
        user_id: userId,
        user_name: user.name || 'Anônimo',
        score,
        plan: user.plan || 'free',
        referrals: user.total_referrals || 0,
      });
    }
  }

  // Filtra por concurso se especificado
  if (concurso) {
    entries = entries.filter((e) =>
      e.concursos_inscritos && e.concursos_inscritos.includes(concurso)
    );
  }

  // Ordena por score decrescente
  entries.sort((a, b) => b.score - a.score);

  // Adiciona posição
  const ranked = entries.slice(0, limite).map((entry, index) => ({
    ...entry,
    posicao: index + 1,
    medalha: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `  ${index + 1}.`,
  }));

  return ranked;
}

// ============================================================
// Predições Publicáveis
// ============================================================

/**
 * Retorna predições prontas para publicação (48h antes da prova).
 * A lógica é: quanto mais perto da prova, mais confiantes devemos estar.
 * @param {string} banca
 * @param {string} materia
 * @param {string} dataProva - Data da prova (ISO 8601)
 * @param {Object[]} predicoes - Lista de predições
 * @returns {Object[]} Predições aprovadas para publicação
 */
export function getPredicoesPublicaveis(banca, materia, dataProva, predicoes = []) {
  const agora = new Date();
  const prova = new Date(dataProva);
  const horasAteProva = (prova - agora) / (1000 * 60 * 60);

  // Só publicar se faltar menos de 48h
  if (horasAteProva > 48 || horasAteProva < 0) {
    return [];
  }

  // Filtra apenas predições com alta probabilidade
  const publicaveis = predicoes.filter((p) => {
    // Probabilidade mínima depende de quando é a publicação
    const probMinima = horasAteProva < 24 ? 60 : 70;
    return p.probabilidade >= probMinima;
  });

  // Ordena por probabilidade
  publicaveis.sort((a, b) => b.probabilidade - a.probabilidade);

  log.info('Predições publicáveis calculadas', {
    banca,
    materia,
    horasAteProva: Math.round(horasAteProva),
    publicaveis: publicaveis.length,
  });

  return publicaveis;
}

// ============================================================
// Métricas Virais
// ============================================================

/**
 * Retorna métricas completas do motor viral.
 * Inclui shares, referrals, coeficiente viral.
 * @returns {Object}
 */
export function getViralMetrics() {
  let totalShares = sharesStore.size;
  let totalReferrals = 0;
  let usuariosComReferral = 0;

  for (const [, referrals] of referralsStore) {
    totalReferrals += referrals.length;
    if (referrals.length > 0) usuariosComReferral++;
  }

  const totalUsuarios = usersStore.size;

  // Coeficiente viral: quantos novos usuários cada usuário traz
  const coeficienteViral = totalUsuarios > 0
    ? Math.round((totalReferrals / totalUsuarios) * 100) / 100
    : 0;

  // Taxa de conversão de share para inscrição
  const taxaConversao = totalShares > 0
    ? Math.round((totalReferrals / totalShares) * 100)
    : 0;

  // Referral para prêmio
  const totalPremios = Math.floor(totalReferrals / 3);
  const mesesPremiumDistribuidos = totalPremios;

  return {
    total_shares: totalShares,
    total_referrals: totalReferrals,
    usuarios_com_referral,
    total_usuarios: totalUsuarios,
    coeficiente_viral: coeficienteViral,
    taxa_conversao_share: `${taxaConversao}%`,
    meses_premium_distribuidos: mesesPremiumDistribuidos,
    custo_por_aquisicao: totalReferrals > 0
      ? `R$ ${(mesesPremiumDistribuidos * 11.50 / totalReferrals).toFixed(2)}`
      : 'N/A',
    resumo: totalUsuarios > 0
      ? `🚀 Viral: ${totalShares} shares | ${totalReferrals} referrals | K=${coeficienteViral} | Conv: ${taxaConversao}%`
      : '🚀 Viral: aguardando primeiros usuários',
    data_consulta: new Date().toISOString(),
  };
}

// ============================================================
// Funções auxiliares
// ============================================================

/**
 * Registra ou atualiza um usuário no store.
 * @param {Object} user
 */
export function upsertUser(user) {
  usersStore.set(user.id, {
    ...usersStore.get(user.id),
    ...user,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Obtém dados de um usuário.
 * @param {string} userId
 * @returns {Object|null}
 */
export function getUser(userId) {
  return usersStore.get(userId) || null;
}

/**
 * Atualiza o score de predição de um usuário.
 * @param {string} userId
 * @param {number} pontos - Pontos a adicionar
 */
export function updatePredictionScore(userId, pontos) {
  const user = usersStore.get(userId);
  if (!user) return;

  user.prediction_score = (user.prediction_score || 0) + pontos;
  usersStore.set(userId, user);
}

/**
 * Retorna referências de um usuário.
 * @param {string} userId
 * @returns {Object[]}
 */
export function getUserReferrals(userId) {
  return referralsStore.get(userId) || [];
}

export default {
  generateGabaritouScore,
  processarReferral,
  getLeaderboard,
  verificarPremioReferral,
  getPredicoesPublicaveis,
  getViralMetrics,
  upsertUser,
  getUser,
  updatePredictionScore,
  getUserReferrals,
};
