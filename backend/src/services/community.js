/**
 * Serviço de Comunidade + Gamificação.
 *
 * Sistema de pontos, rankings, desafios, streaks e badges.
 * Incentiva o engajamento e cria comunidade em torno das predições.
 *
 * Gabaritou v2 - Backend Services Layer
 */

import { randomCode } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const log = logger.child('CommunityService');

// ============================================================
// Pontuação e Eventos
// ============================================================

/** Pontuação por tipo de evento */
const PONTUACAO_POR_EVENTO = {
  prediction_hit: 100,      // Acertou predição
  study_streak_3: 50,       // 3 dias consecutivos
  study_streak_7: 150,      // 7 dias consecutivos
  study_streak_14: 300,     // 14 dias consecutivos
  study_streak_30: 500,     // 30 dias consecutivos
  referral: 75,             // Indicou amigo que se cadastrou
  challenge_win: 200,       // Venceu desafio
  challenge_participate: 25,// Participou de desafio
  login_daily: 10,          // Login diário
  premium_upgrade: 50,      // Fez upgrade premium
  trial_start: 20,          // Iniciou trial
  feedback_submitted: 15,   // Enviou feedback de predição
  study_plan_complete: 100, // Completou plano de estudos
  simulado_complete: 30,    // Completou simulado
  high_accuracy: 50,        // Acurácia acima de 80% no simulado
};

/** Nomes amigáveis dos tipos de evento */
const EVENTO_NOMES = {
  prediction_hit: '🎯 Acertou Predição',
  study_streak_3: '🔥 Sequência de 3 dias',
  study_streak_7: '🔥 Sequência de 7 dias',
  study_streak_14: '🔥 Sequência de 14 dias',
  study_streak_30: '🔥 Sequência de 30 dias',
  referral: '🤝 Indicação',
  challenge_win: '🏆 Vitória em Desafio',
  challenge_participate: '⚔️ Participou de Desafio',
  login_daily: '📅 Login Diário',
  premium_upgrade: '👑 Upgrade Premium',
  trial_start: '⭐ Início do Trial',
  feedback_submitted: '💬 Feedback Enviado',
  study_plan_complete: '📚 Plano Concluído',
  simulado_complete: '📝 Simulado Completo',
  high_accuracy: '🌟 Alta Acurácia',
};

/** Badges disponíveis */
const BADGES = {
  first_prediction: { nome: 'Primeira Predição', emoji: '🎯', descricao: 'Fez sua primeira consulta de predição' },
  first_hit: { nome: 'Acertador', emoji: '🎯', descricao: 'Acertou uma predição pela primeira vez' },
  streak_7: { nome: 'Dedicado', emoji: '🔥', descricao: '7 dias consecutivos de estudo' },
  streak_30: { nome: 'Inabalável', emoji: '🔥', descricao: '30 dias consecutivos de estudo' },
  top_10: { nome: 'Top 10', emoji: '🏆', descricao: 'Alcançou o Top 10 do ranking' },
  referral_3: { nome: 'Embaixador', emoji: '🤝', descricao: 'Indicou 3 amigos' },
  premium_user: { nome: 'Premium', emoji: '👑', descricao: 'Assinou o plano Premium' },
  challenger: { nome: 'Desafiante', emoji: '⚔️', descricao: 'Participou de 5 desafios' },
  accuracy_80: { nome: 'Preciso', emoji: '🌟', descricao: '80%+ de acurácia em simulado' },
  streak_100: { nome: 'Lendário', emoji: '💎', descricao: '100 dias consecutivos de estudo' },
};

/** Níveis por faixa de pontos */
const NIVEIS = [
  { nivel: 1, nome: 'Iniciante', emoji: '🌱', pontos_min: 0 },
  { nivel: 2, nome: 'Aprendiz', emoji: '📖', pontos_min: 100 },
  { nivel: 3, nome: 'Estudante', emoji: '📚', pontos_min: 500 },
  { nivel: 4, nome: 'Concurseiro', emoji: '⚡', pontos_min: 1000 },
  { nivel: 5, nome: 'Veterano', emoji: '🏆', pontos_min: 2500 },
  { nivel: 6, nome: 'Expert', emoji: '🌟', pontos_min: 5000 },
  { nivel: 7, nome: 'Mestre', emoji: '👑', pontos_min: 10000 },
  { nivel: 8, nome: 'Lendário', emoji: '💎', pontos_min: 25000 },
];

/** Stores em memória (em produção: Supabase) */
const usersStore = new Map();
const eventsStore = new Map();
const challengesStore = new Map();
const studyGroupsStore = new Map();

// ============================================================
// Pontos
// ============================================================

/**
 * Adiciona pontos a um usuário por um tipo de evento.
 * @param {string} userId - ID do usuário
 * @param {string} tipo - Tipo do evento (ver PONTUACAO_POR_EVENTO)
 * @param {number} [quantidade=null] - Quantidade customizada (usa padrão se null)
 * @param {Object} [meta={}] - Metadados adicionais
 * @returns {Object} Resultado da adição de pontos
 */
export function adicionarPontos(userId, tipo, quantidade = null, meta = {}) {
  if (!userId || !tipo) {
    return { sucesso: false, motivo: 'userId e tipo são obrigatórios' };
  }

  const pontos = quantidade !== null ? quantidade : (PONTUACAO_POR_EVENTO[tipo] || 10);

  // Obtém ou cria usuário
  let user = usersStore.get(userId);
  if (!user) {
    user = {
      id: userId,
      pontos: 0,
      sequencia: 0,
      nivel: 1,
      badges: [],
      eventos: [],
      created_at: new Date().toISOString(),
    };
  }

  // Adiciona pontos
  user.pontos += pontos;

  // Atualiza nível
  let novoNivel = 1;
  for (const n of NIVEIS) {
    if (user.pontos >= n.pontos_min) novoNivel = n.nivel;
  }
  user.nivel = novoNivel;
  user.updated_at = new Date().toISOString();

  // Registra evento
  const evento = {
    id: `evt_${randomCode(10)}`,
    tipo,
    user_id: userId,
    concurso_id: meta.concurso_id || null,
    pontos,
    nome: EVENTO_NOMES[tipo] || tipo,
    created_at: new Date().toISOString(),
    meta,
  };

  // Adiciona aos eventos do usuário
  user.eventos.push(evento);

  // Registra no store global de eventos
  if (!eventsStore.has(userId)) eventsStore.set(userId, []);
  eventsStore.get(userId).push(evento);

  // Verifica badges
  const novasBadges = verificarBadges(user, tipo);
  if (novasBadges.length > 0) {
    user.badges = [...new Set([...user.badges, ...novasBadges])];
  }

  // Salva
  usersStore.set(userId, user);

  log.info('Pontos adicionados', {
    userId,
    tipo,
    pontos,
    total: user.pontos,
    nivel: user.nivel,
    novasBadges: novasBadges.length,
  });

  return {
    sucesso: true,
    pontos_adicionados: pontos,
    total_pontos: user.pontos,
    nivel: user.nivel,
    nivel_info: NIVEIS.find((n) => n.nivel === novoNivel),
    novas_badges: novasBadges,
  };
}

/**
 * Verifica se o usuário desbloqueou novas badges.
 * @param {Object} user
 * @param {string} tipoEvento
 * @returns {string[]} Lista de novas badges desbloqueadas
 */
function verificarBadges(user, tipoEvento) {
  const novas = [];
  const badges = user.badges || [];

  if (tipoEvento === 'prediction_hit' && !badges.includes('first_hit')) {
    novas.push('first_hit');
  }
  if (tipoEvento === 'study_streak_7' && !badges.includes('streak_7')) {
    novas.push('streak_7');
  }
  if (tipoEvento === 'study_streak_30' && !badges.includes('streak_30')) {
    novas.push('streak_30');
  }
  if (tipoEvento === 'premium_upgrade' && !badges.includes('premium_user')) {
    novas.push('premium_user');
  }
  if (tipoEvento === 'high_accuracy' && !badges.includes('accuracy_80')) {
    novas.push('accuracy_80');
  }

  // Badge por pontos
  if (user.pontos >= 100 && !badges.includes('first_prediction')) {
    novas.push('first_prediction');
  }

  // Badge por referrals
  const referralEvents = (user.eventos || []).filter((e) => e.tipo === 'referral').length;
  if (referralEvents >= 3 && !badges.includes('referral_3')) {
    novas.push('referral_3');
  }

  // Badge por desafios
  const challengeEvents = (user.eventos || []).filter((e) => e.tipo === 'challenge_participate' || e.tipo === 'challenge_win').length;
  if (challengeEvents >= 5 && !badges.includes('challenger')) {
    novas.push('challenger');
  }

  // Top 10
  if (user.pontos >= 2500 && !badges.includes('top_10')) {
    novas.push('top_10');
  }

  // Streak 100
  if (tipoEvento === 'study_streak_30' && (user.eventos || []).filter((e) => e.tipo === 'study_streak_30').length >= 4 && !badges.includes('streak_100')) {
    novas.push('streak_100');
  }

  return novas;
}

// ============================================================
// Ranking
// ============================================================

/**
 * Retorna o ranking de usuários.
 * @param {'geral'|'streak'|'acertos'} tipo - Tipo de ranking
 * @param {number} [limite=20] - Limite de posições
 * @returns {Object[]}
 */
export function getRanking(tipo = 'geral', limite = 20) {
  const entries = [];

  for (const [, user] of usersStore) {
    if (!user.name && !user.id) continue;

    let score = 0;
    if (tipo === 'geral') score = user.pontos || 0;
    else if (tipo === 'streak') score = user.sequencia || 0;
    else if (tipo === 'acertos') {
      const acertos = (user.eventos || []).filter((e) => e.tipo === 'prediction_hit').length;
      score = acertos;
    }

    if (score > 0) {
      entries.push({
        user_id: user.id,
        user_name: user.name || user.id,
        score,
        nivel: user.nivel || 1,
        sequencia: user.sequencia || 0,
        badges: user.badges || [],
      });
    }
  }

  entries.sort((a, b) => b.score - a.score);

  return entries.slice(0, limite).map((entry, index) => ({
    ...entry,
    posicao: index + 1,
    medalha: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`,
    nivel_info: NIVEIS.find((n) => n.nivel === entry.nivel) || NIVEIS[0],
  }));
}

// ============================================================
// Desafios
// ============================================================

/**
 * Cria um novo desafio/batalha de predições.
 * @param {string} concurso - Nome do concurso
 * @param {string} banca - Banca examinadora
 * @param {string} materia - Matéria foco
 * @param {string} criadorId - ID do criador do desafio
 * @param {string[]} topicosEscolhidos - Tópicos para palpitar
 * @returns {Object} Desafio criado
 */
export function criarDesafio(concurso, banca, materia, criadorId, topicosEscolhidos) {
  if (!concurso || !banca || !materia || !criadorId) {
    throw new Error('concurso, banca, materia e criadorId são obrigatórios');
  }

  const id = `chal_${randomCode(8)}`;

  const criador = usersStore.get(criadorId);
  const desafio = {
    id,
    concurso,
    banca,
    materia,
    criador_id: criadorId,
    participantes: [],
    topicos_escolhidos: topicosEscolhidos || [],
    pontos_acerto: 100,
    status: 'aberto',
    created_at: new Date().toISOString(),
    finalized_at: null,
    resultado: null,
  };

  challengesStore.set(id, desafio);

  log.info('Desafio criado', { id, concurso, banca, criadorId });

  return desafio;
}

/**
 * Participa de um desafio com palpites.
 * @param {string} userId - ID do participante
 * @param {string} desafioId - ID do desafio
 * @param {string[]} palpites - Tópicos que o participante aposta que vão cair
 * @returns {Object} Resultado da participação
 */
export function participarDesafio(userId, desafioId, palpites) {
  const desafio = challengesStore.get(desafioId);
  if (!desafio) {
    throw new Error(`Desafio não encontrado: ${desafioId}`);
  }

  if (desafio.status !== 'aberto') {
    throw new Error(`Desafio "${desafioId}" não está aberto para participação`);
  }

  const user = usersStore.get(userId);
  if (!user) {
    throw new Error(`Usuário não encontrado: ${userId}`);
  }

  // Verifica se já está participando
  const jaParticipa = desafio.participantes.some((p) => p.user_id === userId);
  if (jaParticipa) {
    throw new Error('Usuário já está participando deste desafio');
  }

  // Adiciona participante
  desafio.participantes.push({
    user_id: userId,
    user_name: user.name || userId,
    palpites: palpites || [],
    acertos: 0,
    pontuacao: 0,
  });

  challengesStore.set(desafioId, desafio);

  // Pontos por participação
  adicionarPontos(userId, 'challenge_participate', null, { desafio_id: desafioId });

  log.info('Usuário entrou no desafio', { userId, desafioId });

  return {
    sucesso: true,
    desafio_id: desafioId,
    mensagem: `⚔️ Você entrou no desafio ${desafio.concurso}! Boa sorte!`,
  };
}

/**
 * Finaliza um desafio e calcula resultados.
 * @param {string} desafioId - ID do desafio
 * @param {string[]} resultadoProva - Tópicos que realmente caíram na prova
 * @returns {Object} Resultados do desafio
 */
export function calcularResultadoDesafio(desafioId, resultadoProva) {
  const desafio = challengesStore.get(desafioId);
  if (!desafio) {
    throw new Error(`Desafio não encontrado: ${desafioId}`);
  }

  if (desafio.status === 'finalizado') {
    throw new Error('Desafio já foi finalizado');
  }

  const normalize = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const reaisNorm = (resultadoProva || []).map(normalize);

  // Calcula acertos de cada participante
  for (const participante of desafio.participantes) {
    let acertos = 0;

    for (const palpite of participante.palpites) {
      const palpiteNorm = normalize(palpite);
      const matched = reaisNorm.some((real) =>
        real.includes(palpiteNorm) || palpiteNorm.includes(real)
      );
      if (matched) acertos++;
    }

    participante.acertos = acertos;
    participante.pontuacao = acertos * desafio.pontos_acerto;

    // Adiciona pontos para o vencedor
    if (acertos > 0) {
      adicionarPontos(participante.user_id, 'prediction_hit', acertos * 50, {
        desafio_id: desafioId,
        concurso: desafio.concurso,
      });
    }
  }

  // Ordena participantes por pontuação
  desafio.participantes.sort((a, b) => b.pontuacao - a.pontuacao);

  // Identifica vencedor
  const vencedor = desafio.participantes[0];

  // Bonus para o vencedor
  if (vencedor && vencedor.pontuacao > 0) {
    adicionarPontos(vencedor.user_id, 'challenge_win', null, { desafio_id: desafioId });
  }

  desafio.status = 'finalizado';
  desafio.finalized_at = new Date().toISOString();
  desafio.resultado = {
    vencedor: vencedor ? { user_id: vencedor.user_id, user_name: vencedor.user_name, pontuacao: vencedor.pontuacao } : null,
    total_participantes: desafio.participantes.length,
    topicos_reais: resultadoProva,
    classificacao: desafio.participantes.map((p, i) => ({
      posicao: i + 1,
      user_name: p.user_name,
      acertos: p.acertos,
      pontuacao: p.pontuacao,
    })),
  };

  challengesStore.set(desafioId, desafio);

  log.info('Desafio finalizado', {
    desafioId,
    vencedor: vencedor?.user_id,
    participantes: desafio.participantes.length,
  });

  return desafio.resultado;
}

// ============================================================
// Grupos de Estudo
// ============================================================

/**
 * Retorna grupos de estudo por banca.
 * @param {string} banca
 * @returns {Object[]}
 */
export function getGruposEstudo(banca) {
  // Grupos pré-definidos por banca
  const gruposPorBanca = {
    CESPE: [
      { id: 'grp_cespe_diradmin', banca: 'CESPE', nome: 'Direito Administrativo', membros: 234, ativo: true },
      { id: 'grp_cespe_dircivil', banca: 'CESPE', nome: 'Direito Civil', membros: 189, ativo: true },
      { id: 'grp_cespe_dirconst', banca: 'CESPE', nome: 'Direito Constitucional', membros: 312, ativo: true },
      { id: 'grp_cespe_rl', banca: 'CESPE', nome: 'Raciocínio Lógico', membros: 156, ativo: true },
      { id: 'grp_cespe_portugues', banca: 'CESPE', nome: 'Língua Portuguesa', membros: 201, ativo: true },
    ],
    FGV: [
      { id: 'grp_fgv_dirtrib', banca: 'FGV', nome: 'Direito Tributário', membros: 145, ativo: true },
      { id: 'grp_fgv_dircivil', banca: 'FGV', nome: 'Direito Civil', membros: 178, ativo: true },
      { id: 'grp_fgv_diremp', banca: 'FGV', nome: 'Direito Empresarial', membros: 98, ativo: true },
    ],
    FCC: [
      { id: 'grp_fcc_diradmin', banca: 'FCC', nome: 'Direito Administrativo', membros: 167, ativo: true },
      { id: 'grp_fcc_portugues', banca: 'FCC', nome: 'Língua Portuguesa', membros: 134, ativo: true },
      { id: 'grp_fcc_informatica', banca: 'FCC', nome: 'Informática', membros: 89, ativo: true },
    ],
    VUNESP: [
      { id: 'grp_vunesp_dirconst', banca: 'VUNESP', nome: 'Direito Constitucional', membros: 112, ativo: true },
      { id: 'grp_vunesp_diradmin', banca: 'VUNESP', nome: 'Direito Administrativo', membros: 98, ativo: true },
    ],
  };

  if (banca) {
    return gruposPorBanca[banca.toUpperCase()] || [];
  }

  // Retorna todos os grupos
  return Object.values(gruposPorBanca).flat();
}

// ============================================================
// Streak (Sequência de estudo)
// ============================================================

/**
 * Retorna e atualiza a sequência de dias de estudo do usuário.
 * @param {string} userId
 * @returns {Object} Dados da streak
 */
export function getStreak(userId) {
  let user = usersStore.get(userId);
  if (!user) {
    user = { id: userId, pontos: 0, sequencia: 0, badges: [], eventos: [], created_at: new Date().toISOString() };
    usersStore.set(userId, user);
  }

  const hoje = new Date().toISOString().substring(0, 10);
  const ultimoEstudo = user.ultimo_estudo_dia || null;

  // Calcula streak
  if (ultimoEstudo) {
    const diasDiff = Math.floor((new Date(hoje) - new Date(ultimoEstudo)) / (1000 * 60 * 60 * 24));

    if (diasDiff > 1) {
      // Streak quebrou
      user.sequencia = 0;
    }
  }

  // Registra estudo de hoje
  if (ultimoEstudo !== hoje) {
    user.sequencia = (user.sequencia || 0) + 1;
    user.ultimo_estudo_dia = hoje;

    // Verifica marcos de streak
    if (user.sequencia === 3) {
      adicionarPontos(userId, 'study_streak_3', null, { dias: 3 });
    } else if (user.sequencia === 7) {
      adicionarPontos(userId, 'study_streak_7', null, { dias: 7 });
    } else if (user.sequencia === 14) {
      adicionarPontos(userId, 'study_streak_14', null, { dias: 14 });
    } else if (user.sequencia === 30) {
      adicionarPontos(userId, 'study_streak_30', null, { dias: 30 });
    }

    // Login diário
    adicionarPontos(userId, 'login_daily', null, { dia: hoje });
  }

  usersStore.set(userId, user);

  return {
    user_id: userId,
    sequencia: user.sequencia,
    ultimo_estudo: user.ultimo_estudo_dia,
    recorde: user.recorde_streak || user.sequencia,
    nivel_info: NIVEIS.find((n) => n.nivel === (user.nivel || 1)) || NIVEIS[0],
  };
}

// ============================================================
// Perfil da Comunidade
// ============================================================

/**
 * Retorna o perfil completo do usuário na comunidade.
 * @param {string} userId
 * @returns {Object} Perfil com estatísticas, badges, rank
 */
export function getPerfilComunidade(userId) {
  let user = usersStore.get(userId);

  if (!user) {
    user = {
      id: userId,
      pontos: 0,
      sequencia: 0,
      nivel: 1,
      badges: [],
      eventos: [],
      created_at: new Date().toISOString(),
    };
    usersStore.set(userId, user);
  }

  // Calcula estatísticas
  const eventos = user.eventos || [];
  const predicoesAcertadas = eventos.filter((e) => e.tipo === 'prediction_hit').length;
  const desafiosVencidos = eventos.filter((e) => e.tipo === 'challenge_win').length;
  const desafiosParticipados = eventos.filter((e) => e.tipo === 'challenge_participate').length;
  const referrals = eventos.filter((e) => e.tipo === 'referral').length;
  const feedbacks = eventos.filter((e) => e.tipo === 'feedback_submitted').length;

  // Posição no ranking geral
  const ranking = getRanking('geral', 9999);
  const posicao = ranking.findIndex((r) => r.user_id === userId) + 1;

  // Detalhes das badges
  const badgesDetalhes = (user.badges || []).map((b) => BADGES[b] || { nome: b, emoji: '🏅', descricao: b });

  // Nível atual e próximo
  const nivelAtual = NIVEIS.find((n) => n.nivel === (user.nivel || 1)) || NIVEIS[0];
  const proximoNivel = NIVEIS.find((n) => n.nivel === nivelAtual.nivel + 1);
  const pontosProximoNivel = proximoNivel ? proximoNivel.pontos_min - user.pontos : 0;

  return {
    user_id: userId,
    user_name: user.name || null,
    pontos: user.pontos,
    nivel: nivelAtual,
    proximo_nivel: proximoNivel ? {
      nivel: proximoNivel.nivel,
      nome: proximoNivel.nome,
      emoji: proximoNivel.emoji,
      pontos_faltam: pontosProximoNivel,
    } : null,
    posicao_ranking: posicao || ranking.length + 1,
    sequencia: user.sequencia || 0,
    recorde_streak: user.recorde_streak || user.sequencia || 0,
    badges: badgesDetalhes,
    estatisticas: {
      predicoes_acertadas: predicoesAcertadas,
      desafios_vencidos: desafiosVencidos,
      desafios_participados: desafiosParticipados,
      referrals: referrals,
      feedbacks: feedbacks,
      total_eventos: eventos.length,
    },
    created_at: user.created_at,
    resumo: `${nivelAtual.emoji} Nível ${nivelAtual.nivel} | ${user.pontos} pts | Posição: #${posicao || 'N/A'} | Streak: ${user.sequencia || 0} dias`,
  };
}

/**
 * Atualiza ou cria dados do usuário no store.
 * @param {Object} userData
 */
export function upsertUser(userData) {
  const existing = usersStore.get(userData.id) || {};
  usersStore.set(userData.id, { ...existing, ...userData });
}

/**
 * Retorna todos os desafios.
 * @param {string} [status] - Filtrar por status
 * @returns {Object[]}
 */
export function getDesafios(status) {
  const all = Array.from(challengesStore.values());

  if (status) {
    return all.filter((d) => d.status === status);
  }
  return all;
}

export default {
  adicionarPontos,
  getRanking,
  criarDesafio,
  participarDesafio,
  calcularResultadoDesafio,
  getGruposEstudo,
  getStreak,
  getPerfilComunidade,
  upsertUser,
  getDesafios,
  NIVEIS,
  BADGES,
  PONTUACAO_POR_EVENTO,
};
