/**
 * Serviço de Predições em Tempo Real (Prova Day).
 *
 * No dia da prova, usuários podem relatar quais questões estão vendo.
 * O sistema calcula em tempo real a acurácia das predições.
 *
 * Modelo de monetização:
 * - Single: R$ 9,90 (acompanhar 1 prova)
 * - Pack 5: R$ 39,90 (acompanhar 5 provas)
 *
 * Gabaritou v2 - Backend Services Layer
 */

import { randomCode, formatBRL, calculateAccuracy } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const log = logger.child('RealtimeService');

/** Preços do Prova Day */
export const PROVA_DAY_PRICE = {
  single: 9.90,
  pack5: 39.90,
};

/** Store de sessões de Prova Day */
const sessionsStore = new Map();

/** Store de relatórios de usuários durante a prova */
const reportsStore = new Map();

/** Store de credenciais (compras) */
const credentialsStore = new Map();

// ============================================================
// Sessão de Prova Day
// ============================================================

/**
 * Inicia uma sessão de acompanhamento em tempo real para o dia da prova.
 * Cria uma sessão que ficará aberta recebendo relatos dos usuários.
 *
 * @param {string} concursoId - Identificador único do concurso
 * @param {string} banca - Banca examinadora
 * @param {Object[]} [predicoes=[]] - Predições feitas pela Gabaritou
 * @param {string} [materia=null] - Matéria foco (opcional)
 * @returns {Object} Sessão de Prova Day criada
 */
export function iniciarProvaDay(concursoId, banca, predicoes = [], materia = null) {
  if (!concursoId || !banca) {
    throw new Error('concursoId e banca são obrigatórios');
  }

  // Verifica se já existe sessão ativa
  const existing = getSession(concursoId);
  if (existing && existing.status === 'em_andamento') {
    log.warn('Sessão de Prova Day já existe e está ativa', { concursoId });
    return existing;
  }

  const predicoesMap = {};
  for (const pred of predicoes) {
    predicoesMap[pred.id || pred.topico] = pred;
  }

  const session = {
    id: `prova_${randomCode(8)}`,
    concurso_id: concursoId,
    banca,
    materia,
    predicoes,
    predicoes_ids: predicoes.map((p) => p.id || p.topico),
    relatos: [],
    status: 'em_andamento',
    created_at: new Date().toISOString(),
    finalized_at: null,
    total_relatos: 0,
    usuarios_unicos: new Set(),
    relatorio_final: null,
    // Score em tempo real
    score_tempo_real: {
      predicoes_confirmadas: [],
      predicoes_negadas: [],
      topicos_nao_previstos: [],
      acertos: 0,
      erros: 0,
      porcentagem: 0,
      total_relatos: 0,
      confianca: 0,
    },
  };

  sessionsStore.set(concursoId, session);

  log.info('Sessão Prova Day iniciada', {
    concursoId,
    banca,
    predicoes: predicoes.length,
  });

  return {
    ...session,
    usuarios_unicos: [], // Converte Set para array na resposta
    mensagem: `📺 Prova Day ativo para ${concursoId}! Envie seus relatos de questões.`,
    instrucoes: [
      `🟢 *Prova Day Ativo*`,
      `📋 Concurso: ${concursoId}`,
      `📝 Banca: ${banca}`,
      `📊 ${predicoes.length} predições mapeadas`,
      ``,
      `🔍 Acompanhe em tempo real a acurácia das predições!`,
      `📲 Relate as questões que estão aparecendo na prova.`,
    ].join('\n'),
  };
}

/**
 * Registra um relato de questão recebida por um usuário durante a prova.
 * O usuário informa qual tópico viu em determinada questão.
 *
 * @param {string} concursoId - ID da sessão do concurso
 * @param {number} questaoIndex - Número da questão (1-indexed)
 * @param {string} topico - Tópico relatado pelo usuário
 * @param {string} userId - ID do usuário que relatou
 * @param {string} [userName=null] - Nome do usuário
 * @returns {Object} Relato registrado e score atualizado
 */
export function registrarQuestaoRecebida(concursoId, questaoIndex, topico, userId, userName = null) {
  const session = sessionsStore.get(concursoId);

  if (!session) {
    throw new Error(`Sessão Prova Day não encontrada para: ${concursoId}`);
  }

  if (session.status !== 'em_andamento') {
    throw new Error(`Sessão não está ativa. Status: ${session.status}`);
  }

  if (!userId || !topico) {
    throw new Error('userId e topico são obrigatórios');
  }

  // Cria o relato
  const relato = {
    id: `rel_${randomCode(8)}`,
    user_id: userId,
    user_name: userName || userId,
    questao_index: questaoIndex,
    topico: topico.trim(),
    topico_normalizado: topico.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(),
    created_at: new Date().toISOString(),
  };

  session.relatos.push(relato);
  session.total_relatos++;
  session.usuarios_unicos.add(userId);

  // Recalcula score em tempo real
  const score = calcularScoreTempoReal(concursoId);
  session.score_tempo_real = score;

  sessionsStore.set(concursoId, session);

  // Registra relato no store individual do usuário
  const userKey = `${concursoId}:${userId}`;
  if (!reportsStore.has(userKey)) {
    reportsStore.set(userKey, []);
  }
  reportsStore.get(userKey).push(relato);

  log.info('Questão relatada', {
    concursoId,
    userId,
    questao: questaoIndex,
    topico,
    totalRelatos: session.total_relatos,
    scoreAtual: score.porcentagem,
  });

  return {
    relato,
    score_atual: score,
    posicao_na_fila: session.total_relatos,
    total_usuarios: session.usuarios_unicos.size,
  };
}

/**
 * Calcula o score de acurácia em tempo real.
 * Compara os relatos dos usuários com as predições da Gabaritou.
 *
 * @param {string} concursoId
 * @returns {Object} Score calculado
 */
export function calcularScoreTempoReal(concursoId) {
  const session = sessionsStore.get(concursoId);

  if (!session || session.relatos.length === 0) {
    return {
      predicoes_confirmadas: [],
      predicoes_negadas: [],
      topicos_nao_previstos: [],
      acertos: 0,
      erros: 0,
      porcentagem: 0,
      total_relatos: 0,
      confianca: 0,
    };
  }

  const normalize = (text) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const confirmadas = [];
  const negadas = [];
  const naoPrevistos = [];

  // Coleta tópicos únicos relatados
  const topicosRelatados = [...new Set(session.relatos.map((r) => r.topico_normalizado))];

  for (const pred of session.predicoes) {
    const predNorm = normalize(pred.topico);

    const matched = topicosRelatados.some((real) =>
      real.includes(predNorm) || predNorm.includes(real)
    );

    if (matched) {
      confirmadas.push({
        topico: pred.topico,
        probabilidade: pred.probabilidade,
        relatos: session.relatos.filter((r) => r.topico_normalizado === predNorm || predNorm.includes(r.topico_normalizado)).length,
      });
    } else {
      negadas.push({
        topico: pred.topico,
        probabilidade: pred.probabilidade,
      });
    }
  }

  // Tópicos relatados que não foram previstos
  for (const relatado of topicosRelatados) {
    const foiPrevisto = session.predicoes.some((pred) => {
      const predNorm = normalize(pred.topico);
      return relatado.includes(predNorm) || predNorm.includes(relatado);
    });

    if (!foiPrevisto) {
      const relatoOriginal = session.relatos.find((r) => r.topico_normalizado === relatado);
      naoPrevistos.push({
        topico: relatoOriginal?.topico || relatado,
        relatos: session.relatos.filter((r) => r.topico_normalizado === relatado).length,
      });
    }
  }

  const totalPredicoes = session.predicoes.length;
  const acertos = confirmadas.length;
  const porcentagem = totalPredicoes > 0 ? Math.round((acertos / totalPredicoes) * 100) : 0;

  // Confiança baseada no número de relatos
  const usuariosUnicos = session.usuarios_unicos.size;
  let confianca = 0;
  if (usuariosUnicos >= 20) confianca = 95;
  else if (usuariosUnicos >= 10) confianca = 80;
  else if (usuariosUnicos >= 5) confianca = 60;
  else if (usuariosUnicos >= 3) confianca = 40;
  else if (usuariosUnicos >= 1) confianca = 20;

  return {
    predicoes_confirmadas: confirmadas,
    predicoes_negadas: negadas,
    topicos_nao_previstos: naoPrevistos,
    acertos,
    erros: negadas.length,
    porcentagem,
    total_relatos: session.relatos.length,
    usuarios_unicos: usuariosUnicos,
    confianca,
    resumo: `📊 ${acertos}/${totalPredicoes} predições confirmadas (${porcentagem}%) | ${usuariosUnicos} usuários | Confiança: ${confianca}%`,
  };
}

/**
 * Retorna o status atual do Prova Day.
 * @param {string} concursoId
 * @returns {Object} Status completo
 */
export function getProvaDayStatus(concursoId) {
  const session = sessionsStore.get(concursoId);

  if (!session) {
    return {
      exists: false,
      status: 'nao_iniciado',
      mensagem: `Nenhuma sessão Prova Day ativa para "${concursoId}".`,
    };
  }

  const score = session.status === 'em_andamento'
    ? calcularScoreTempoReal(concursoId)
    : session.score_tempo_real;

  return {
    exists: true,
    id: session.id,
    concurso_id: session.concurso_id,
    banca: session.banca,
    materia: session.materia,
    status: session.status,
    created_at: session.created_at,
    total_relatos: session.total_relatos,
    usuarios_unicos: session.usuarios_unicos.size,
    score: score,
    tempo_ativo_minutos: session.status === 'em_andamento'
      ? Math.round((Date.now() - new Date(session.created_at).getTime()) / 60000)
      : null,
  };
}

/**
 * Finaliza a sessão de Prova Day e gera relatório final.
 * @param {string} concursoId
 * @returns {Object} Relatório final completo
 */
export function finalizarProvaDay(concursoId) {
  const session = sessionsStore.get(concursoId);

  if (!session) {
    throw new Error(`Sessão Prova Day não encontrada para: ${concursoId}`);
  }

  if (session.status !== 'em_andamento') {
    throw new Error(`Sessão já finalizada. Status: ${session.status}`);
  }

  // Calcula score final
  const scoreFinal = calcularScoreTempoReal(concursoId);

  // Gera relatório final
  const relatorioFinal = {
    predicoes_acertadas: scoreFinal.acertos,
    predicoes_total: session.predicoes.length,
    porcentagem_acerto: scoreFinal.porcentagem,
    topicos_confirmados: scoreFinal.predicoes_confirmadas,
    topicos_nao_confirmados: scoreFinal.predicoes_negadas,
    topicos_nao_previstos: scoreFinal.topicos_nao_previstos,
    total_relatos: session.total_relatos,
    usuarios_participantes: session.usuarios_unicos.size,
    confianca_final: scoreFinal.confianca,
    duracao_minutos: Math.round((Date.now() - new Date(session.created_at).getTime()) / 60000),
  };

  session.status = 'finalizada';
  session.finalized_at = new Date().toISOString();
  session.relatorio_final = relatorioFinal;
  session.score_tempo_real = scoreFinal;

  sessionsStore.set(concursoId, session);

  log.info('Prova Day finalizado', {
    concursoId,
    acertos: scoreFinal.acertos,
    total: session.predicoes.length,
    porcentagem: scoreFinal.porcentagem,
    usuarios: session.usuarios_unicos.size,
    duracao: relatorioFinal.duracao_minutos,
  });

  // Gera texto para compartilhamento
  const textoCompartilhamento = [
    `📊 *Relatório Prova Day - ${session.concurso_id}*`,
    `📝 Banca: ${session.banca}`,
    ``,
    `🎯 Predições: ${scoreFinal.acertos}/${session.predicoes.length} (${scoreFinal.porcentagem}%)`,
    `👥 Usuários participantes: ${session.usuarios_unicos.size}`,
    `📝 Total de relatos: ${session.total_relatos}`,
    `📊 Confiança: ${scoreFinal.confianca}%`,
    ``,
    scoreFinal.predicoes_confirmadas.length > 0
      ? `✅ *Acertos:* ${scoreFinal.predicoes_confirmadas.map((c) => c.topico).join(', ')}`
      : '❌ Nenhuma predição confirmada',
    ``,
    scoreFinal.topicos_nao_previstos.length > 0
      ? `🆕 *Novos temas:* ${scoreFinal.topicos_nao_previstos.map((t) => t.topico).join(', ')}`
      : '',
    ``,
    `⚡ _Gabaritou v2 - Predições em tempo real_`,
  ].filter(Boolean).join('\n');

  return {
    sessao: session,
    relatorio: relatorioFinal,
    texto_compartilhamento,
    imagem_dados: {
      tipo: 'prova_day_report',
      titulo: `Prova Day - ${session.concurso_id}`,
      banca: session.banca,
      acertos: scoreFinal.acertos,
      total: session.predicoes.length,
      porcentagem: scoreFinal.porcentagem,
      usuarios: session.usuarios_unicos.size,
      confianca: scoreFinal.confianca,
      confirmados: scoreFinal.predicoes_confirmadas.slice(0, 5),
    },
  };
}

// ============================================================
// Acesso e Pagamento
// ============================================================

/**
 * Verifica se um usuário tem acesso ao Prova Day.
 * @param {string} userId
 * @param {string} concursoId
 * @returns {Object} { tem_acesso: boolean, motivo: string }
 */
export function checkProvaDayAccess(userId, concursoId) {
  const creds = credentialsStore.get(userId);

  if (!creds || !creds.active) {
    return {
      tem_acesso: false,
      motivo: 'Você não possui acesso ao Prova Day. Adquira agora!',
      preco_single: formatBRL(PROVA_DAY_PRICE.single),
      preco_pack5: formatBRL(PROVA_DAY_PRICE.pack5),
    };
  }

  // Verifica se tem sessões restantes
  if (creds.sessoes_restantes <= 0) {
    return {
      tem_acesso: false,
      motivo: 'Suas sessões de Prova Day acabaram. Compre mais!',
      preco_single: formatBRL(PROVA_DAY_PRICE.single),
      preco_pack5: formatBRL(PROVA_DAY_PRICE.pack5),
    };
  }

  return {
    tem_acesso: true,
    sessoes_restantes: creds.sessoes_restantes,
  };
}

/**
 * Ativa acesso ao Prova Day para um usuário.
 * @param {string} userId
 * @param {'single'|'pack5'} tipo
 * @returns {Object}
 */
export function ativarProvaDay(userId, tipo) {
  if (!userId || !tipo) {
    throw new Error('userId e tipo são obrigatórios');
  }

  const quantidade = tipo === 'pack5' ? 5 : 1;
  const preco = tipo === 'pack5' ? PROVA_DAY_PRICE.pack5 : PROVA_DAY_PRICE.single;

  const creds = credentialsStore.get(userId) || {
    user_id: userId,
    sessoes_restantes: 0,
    active: false,
    created_at: null,
  };

  creds.sessoes_restantes += quantidade;
  creds.active = true;
  creds.ultima_compra = {
    tipo,
    preco,
    quantidade,
    data: new Date().toISOString(),
  };

  credentialsStore.set(userId, creds);

  log.info('Prova Day ativado', { userId, tipo, quantidade, preco: formatBRL(preco) });

  return {
    sucesso: true,
    sessoes_restantes: creds.sessoes_restantes,
    tipo,
    valor_pago: formatBRL(preco),
    mensagem: `✅ ${tipo === 'pack5' ? '5 sessões' : '1 sessão'} de Prova Day ativada(s)!`,
  };
}

/**
 * Consome uma sessão do Prova Day do usuário.
 * @param {string} userId
 * @returns {Object}
 */
export function consumeProvaDaySession(userId) {
  const creds = credentialsStore.get(userId);

  if (!creds || !creds.active || creds.sessoes_restantes <= 0) {
    return { sucesso: false, motivo: 'Sem sessões disponíveis' };
  }

  creds.sessoes_restantes--;
  if (creds.sessoes_restantes <= 0) {
    creds.active = false;
  }

  credentialsStore.set(userId, creds);

  return {
    sucesso: true,
    sessoes_restantes: creds.sessoes_restantes,
  };
}

// ============================================================
// Helpers
// ============================================================

/**
 * Busca sessão por concursoId.
 * @param {string} concursoId
 * @returns {Object|null}
 */
function getSession(concursoId) {
  return sessionsStore.get(concursoId) || null;
}

/**
 * Lista todas as sessões de Prova Day.
 * @param {string} [status] - Filtrar por status
 * @returns {Object[]}
 */
export function getAllSessions(status) {
  const all = Array.from(sessionsStore.values()).map((s) => ({
    ...s,
    usuarios_unicos: s.usuarios_unicos instanceof Set ? s.usuarios_unicos.size : s.usuarios_unicos,
  }));

  if (status) {
    return all.filter((s) => s.status === status);
  }

  return all;
}

/**
 * Retorna informações de preço do Prova Day.
 * @returns {Object}
 */
export function getPricingInfo() {
  return {
    single: {
      tipo: 'single',
      sessoes: 1,
      preco: PROVA_DAY_PRICE.single,
      preco_formatado: formatBRL(PROVA_DAY_PRICE.single),
      economia: null,
    },
    pack5: {
      tipo: 'pack5',
      sessoes: 5,
      preco: PROVA_DAY_PRICE.pack5,
      preco_formatado: formatBRL(PROVA_DAY_PRICE.pack5),
      economia: formatBRL((PROVA_DAY_PRICE.single * 5) - PROVA_DAY_PRICE.pack5),
    },
    descricao: 'Acompanhe em tempo real a acurácia das predições no dia da prova!',
  };
}

export default {
  PROVA_DAY_PRICE,
  iniciarProvaDay,
  registrarQuestaoRecebida,
  calcularScoreTempoReal,
  getProvaDayStatus,
  finalizarProvaDay,
  checkProvaDayAccess,
  ativarProvaDay,
  consumeProvaDaySession,
  getAllSessions,
  getPricingInfo,
};
