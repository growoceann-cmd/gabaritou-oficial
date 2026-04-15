/**
 * Serviço de Data Licensing - Monetização de dados.
 *
 * Vende acesso a dados agregados de predições, tendências e
 * insights para instituições, editoras e plataformas educacionais.
 *
 * Gabaritou v2 - Backend Services Layer
 */

import { randomCode, formatBRL, formatDateBR } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const log = logger.child('DataLicensingService');

// ============================================================
// Tipos de dados disponíveis
// ============================================================

/** Tipos de dados disponíveis para licenciamento */
const DATA_TYPES = {
  predictions: {
    id: 'predictions',
    nome: 'Dados de Predições',
    descricao: 'Dataset completo de predições por banca, matéria e tópico com probabilidades',
    preco_base: 490.00,
    atualizacao: 'Semanal',
    formatos: ['JSON', 'CSV', 'API'],
  },
  accuracy_reports: {
    id: 'accuracy_reports',
    nome: 'Relatórios de Acurácia',
    descricao: 'Histórico de acurácia das predições por banca e concurso',
    preco_base: 290.00,
    atualizacao: 'Após cada prova',
    formatos: ['JSON', 'CSV', 'PDF'],
  },
  topic_trends: {
    id: 'topic_trends',
    descricao: 'Tendências de temas: quais tópicos estão sendo mais cobrados',
    nome: 'Tendências de Temas',
    preco_base: 390.00,
    atualizacao: 'Mensal',
    formatos: ['JSON', 'CSV', 'API'],
  },
  board_patterns: {
    id: 'board_patterns',
    nome: 'Padrões por Banca',
    descricao: 'Análise de padrões de cobrança de cada banca examinadora',
    preco_base: 590.00,
    atualizacao: 'Trimestral',
    formatos: ['JSON', 'CSV', 'Relatório'],
  },
  difficulty_analysis: {
    id: 'difficulty_analysis',
    nome: 'Análise de Dificuldade',
    descricao: 'Distribuição de dificuldade por tópico e banca',
    preco_base: 340.00,
    atualizacao: 'Mensal',
    formatos: ['JSON', 'CSV'],
  },
  full_dataset: {
    id: 'full_dataset',
    nome: 'Dataset Completo',
    descricao: 'Acesso a todos os dados com atualizações contínuas',
    preco_base: 1490.00,
    atualizacao: 'Contínua',
    formatos: ['JSON', 'CSV', 'API', 'Relatório'],
  },
};

/** Períodos de licença */
const PERIODOS = {
  mensal: { label: 'Mensal', multiplicador: 1 },
  trimestral: { label: 'Trimestral', multiplicador: 2.5 },
  semestral: { label: 'Semestral', multiplicador: 4.5 },
  anual: { label: 'Anual', multiplicador: 8 },
};

// ============================================================
// Stores
// ============================================================

const licensesStore = new Map();
const accessLogStore = new Map();
const revenueStore = {
  total: 0,
  por_tipo: {},
  por_mes: {},
  licencas_ativas: 0,
};

// ============================================================
// Funções Principais
// ============================================================

/**
 * Retorna todos os tipos de dados disponíveis para licenciamento.
 * @returns {Object[]}
 */
export function getAvailableDataTypes() {
  return Object.values(DATA_TYPES).map((dt) => ({
    ...dt,
    periodos_disponiveis: Object.entries(PERIODOS).map(([key, p]) => ({
      id: key,
      label: p.label,
      preco: formatBRL(dt.preco_base * p.multiplicador),
    })),
  }));
}

/**
 * Cria uma licença de dados para um comprador.
 * @param {string} comprador - Nome do comprador
 * @param {string} tipo - Tipo de dado licenciado
 * @param {'mensal'|'trimestral'|'semestral'|'anual'} periodo - Período da licença
 * @param {Object} [meta={}] - Metadados
 * @returns {Object} Licença criada
 */
export function createLicense(comprador, tipo, periodo, meta = {}) {
  if (!comprador || !tipo || !periodo) {
    throw new Error('comprador, tipo e período são obrigatórios');
  }

  if (!DATA_TYPES[tipo]) {
    throw new Error(`Tipo de dado inválido: "${tipo}". Disponíveis: ${Object.keys(DATA_TYPES).join(', ')}`);
  }

  if (!PERIODOS[periodo]) {
    throw new Error(`Período inválido: "${periodo}". Disponíveis: ${Object.keys(PERIODOS).join(', ')}`);
  }

  const dataType = DATA_TYPES[tipo];
  const periodoInfo = PERIODOS[periodo];
  const preco = dataType.preco_base * periodoInfo.multiplicador;

  // Calcula data de expiração
  const now = new Date();
  const expiresAt = new Date(now);
  const mesesPorPeriodo = { mensal: 1, trimestral: 3, semestral: 6, anual: 12 };
  expiresAt.setMonth(expiresAt.getMonth() + (mesesPorPeriodo[periodo] || 1));

  const id = `lic_${randomCode(10)}`;

  const license = {
    id,
    comprador: comprador.trim(),
    tipo,
    tipo_nome: dataType.nome,
    periodo,
    periodo_label: periodoInfo.label,
    preco,
    preco_formatado: formatBRL(preco),
    dados_acessados: [tipo],
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    active: true,
    acessos_mes: 0,
    contato_email: meta.contato_email || null,
    contato_nome: meta.contato_nome || null,
    empresa: meta.empresa || null,
    cnpj: meta.cnpj || null,
  };

  licensesStore.set(id, license);

  // Atualiza receita
  revenueStore.total += preco;
  revenueStore.licencas_ativas++;
  const mesKey = now.toISOString().substring(0, 7);
  revenueStore.por_mes[mesKey] = (revenueStore.por_mes[mesKey] || 0) + preco;
  revenueStore.por_tipo[tipo] = (revenueStore.por_tipo[tipo] || 0) + preco;

  log.info('Licença de dados criada', {
    id,
    comprador,
    tipo,
    periodo,
    preco: formatBRL(preco),
    expires_at: expiresAt.toISOString(),
  });

  return license;
}

/**
 * Registra acesso a dados por uma licença.
 * @param {string} licenseId
 * @param {string} dataType
 * @param {Object} [meta={}]
 * @returns {Object}
 */
export function trackDataAccess(licenseId, dataType, meta = {}) {
  const license = licensesStore.get(licenseId);
  if (!license) {
    throw new Error(`Licença não encontrada: ${licenseId}`);
  }

  if (!license.active) {
    throw new Error('Licença inativa');
  }

  // Verifica expiração
  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    license.active = false;
    licensesStore.set(licenseId, license);
    throw new Error('Licença expirada');
  }

  // Verifica se o tipo de dado está incluído
  if (!license.dados_acessados.includes(dataType) && license.tipo !== 'full_dataset') {
    throw new Error(`Tipo de dado "${dataType}" não incluído nesta licença`);
  }

  license.acessos_mes++;

  const logEntry = {
    id: `access_${randomCode(8)}`,
    license_id: licenseId,
    data_type: dataType,
    timestamp: new Date().toISOString(),
    ip: meta.ip || null,
    endpoint: meta.endpoint || null,
  };

  // Registra no log de acessos
  if (!accessLogStore.has(licenseId)) {
    accessLogStore.set(licenseId, []);
  }
  accessLogStore.get(licenseId).push(logEntry);

  licensesStore.set(licenseId, license);

  return logEntry;
}

/**
 * Gera relatório de insight sobre os dados.
 * @param {string} tipo - Tipo de insight ('topic_trends', 'difficulty_analysis', 'board_patterns')
 * @param {'mensal'|'trimestral'|'semestral'} periodo
 * @param {Object[]} [predicoes=[]] - Predições para basear o insight
 * @returns {Object} Relatório de insight
 */
export function generateInsightReport(tipo, periodo, predicoes = []) {
  if (!tipo || !periodo) {
    throw new Error('tipo e período são obrigatórios');
  }

  const now = new Date();
  const meses = { mensal: 1, trimestral: 3, semestral: 6 };
  const dataInicio = new Date(now);
  dataInicio.setMonth(dataInicio.getMonth() - (meses[periodo] || 1));

  let insight = {};

  if (tipo === 'topic_trends') {
    insight = gerarInsightTendencias(predicoes, dataInicio);
  } else if (tipo === 'difficulty_analysis') {
    insight = gerarInsightDificuldade(predicoes);
  } else if (tipo === 'board_patterns') {
    insight = gerarInsightPadroesBanca(predicoes);
  } else {
    insight = gerarInsightTendencias(predicoes, dataInicio);
  }

  const relatorio = {
    id: `insight_${randomCode(8)}`,
    tipo,
    periodo,
    data_inicio: dataInicio.toISOString(),
    data_fim: now.toISOString(),
    gerado_em: now.toISOString(),
    total_topicos: predicoes.length,
    ...insight,
  };

  log.info('Relatório de insight gerado', { tipo, periodo, topicos: predicoes.length });

  return relatorio;
}

/**
 * Gera insight de tendências de temas.
 */
function gerarInsightTendencias(predicoes, dataInicio) {
  const tendencia = predicoes.map((p) => ({
    topico: p.topico,
    probabilidade: p.probabilidade,
    tendencia: p.probabilidade >= 70 ? 'alta' : p.probabilidade >= 40 ? 'media' : 'baixa',
    recencia: p.recencia || null,
    total_feedbacks: p.total_feedbacks || 0,
    acuracia: p.total_feedbacks > 0 ? Math.round((p.acertos_feedbacks / p.total_feedbacks) * 100) : null,
  }));

  tendencia.sort((a, b) => b.probabilidade - a.probabilidade);

  return {
    titulo: '📈 Tendências de Temas',
    resumo: `${tendencia.filter((t) => t.tendencia === 'alta').length} temas em alta probabilidade`,
    temas_em_alta: tendencia.filter((t) => t.tendencia === 'alta').slice(0, 10),
    temas_em_media: tendencia.filter((t) => t.tendencia === 'media').slice(0, 10),
    temas_em_baixa: tendencia.filter((t) => t.tendencia === 'baixa').slice(0, 10),
  };
}

/**
 * Gera insight de análise de dificuldade.
 */
function gerarInsightDificuldade(predicoes) {
  const porDificuldade = {
    facil: predicoes.filter((p) => p.nivel_dificuldade === 'facil'),
    medio: predicoes.filter((p) => p.nivel_dificuldade === 'medio'),
    dificil: predicoes.filter((p) => p.nivel_dificuldade === 'dificil'),
    muito_dificil: predicoes.filter((p) => p.nivel_dificuldade === 'muito_dificil'),
  };

  return {
    titulo: '📊 Análise de Dificuldade',
    resumo: `Distribuição: ${porDificuldade.facil.length} fáceis, ${porDificuldade.medio.length} médios, ${porDificuldade.dificil.length} difíceis, ${porDificuldade.muito_dificil.length} muito difíceis`,
    distribuicao: {
      facil: porDificuldade.facil.length,
      medio: porDificuldade.medio.length,
      dificil: porDificuldade.dificil.length,
      muito_dificil: porDificuldade.muito_dificil.length,
    },
    topicos_mais_dificeis: porDificuldade.muito_dificil
      .concat(porDificuldade.dificil)
      .sort((a, b) => b.probabilidade - a.probabilidade)
      .slice(0, 10)
      .map((p) => ({ topico: p.topico, probabilidade: p.probabilidade, dificuldade: p.nivel_dificuldade })),
    topicos_mais_faceis: porDificuldade.facil
      .sort((a, b) => b.probabilidade - a.probabilidade)
      .slice(0, 10)
      .map((p) => ({ topico: p.topico, probabilidade: p.probabilidade })),
  };
}

/**
 * Gera insight de padrões por banca.
 */
function gerarInsightPadroesBanca(predicoes) {
  // Agrupa predições por banca
  const porBanca = {};
  for (const p of predicoes) {
    const banca = p.banca || 'outra';
    if (!porBanca[banca]) porBanca[banca] = [];
    porBanca[banca].push(p);
  }

  const padroes = Object.entries(porBanca).map(([banca, preds]) => {
    const estiloPredominante = preds.reduce((acc, p) => {
      const estilo = p.estilo_cobranca || 'conceitual';
      acc[estilo] = (acc[estilo] || 0) + 1;
      return acc;
    }, {});

    const topEstilo = Object.entries(estiloPredominante)
      .sort(([, a], [, b]) => b - a)[0];

    const dificuldadeMedia = preds.reduce((sum, p) => {
      const pesos = { facil: 1, medio: 2, dificil: 3, muito_dificil: 4 };
      return sum + (pesos[p.nivel_dificuldade] || 2);
    }, 0) / preds.length;

    return {
      banca,
      total_topicos: preds.length,
      probabilidade_media: Math.round(preds.reduce((s, p) => s + p.probabilidade, 0) / preds.length),
      dificuldade_media: dificuldadeMedia.toFixed(1),
      estilo_cobranca_predominante: topEstilo ? topEstilo[0] : 'N/A',
      topicos_principais: preds.sort((a, b) => b.probabilidade - a.probabilidade).slice(0, 5).map((p) => p.topico),
    };
  });

  return {
    titulo: '🏛️ Padrões por Banca',
    resumo: `${padroes.length} bancas analisadas`,
    padroes,
  };
}

/**
 * Retorna estimativa de receita com data licensing.
 * @returns {Object}
 */
export function getRevenueEstimate() {
  const licencas = Array.from(licensesStore.values());
  const ativas = licencas.filter((l) => l.active && (!l.expires_at || new Date(l.expires_at) > new Date()));
  const mensalRecurring = ativas.reduce((sum, l) => {
    const mesesPorPeriodo = { mensal: 1, trimestral: 3, semestral: 6, anual: 12 };
    const meses = mesesPorPeriodo[l.periodo] || 1;
    return sum + (l.preco / meses);
  }, 0);

  return {
    receita_total: formatBRL(revenueStore.total),
    receita_total_raw: revenueStore.total,
    licencas_ativas: ativas.length,
    receita_mensal_recorrente: formatBRL(mensalRecurring),
    receita_mensal_recorrente_raw: mensalRecurring,
    por_tipo: Object.fromEntries(
      Object.entries(revenueStore.por_tipo).map(([tipo, valor]) => [tipo, formatBRL(valor)])
    ),
    por_mes: Object.fromEntries(
      Object.entries(revenueStore.por_mes).map(([mes, valor]) => [mes, formatBRL(valor)])
    ),
    projecao_anual: formatBRL(mensalRecurring * 12),
    ticket_medio: licencas.length > 0
      ? formatBRL(revenueStore.total / licencas.length)
      : 'R$ 0,00',
    resumo: `💰 Data Licensing: R$ ${revenueStore.total.toFixed(2)} total | ${ativas.length} licenças ativas | ~${formatBRL(mensalRecurring)}/mês recorrente`,
  };
}

/**
 * Retorna todas as licenças.
 * @param {string} [comprador] - Filtrar por comprador
 * @returns {Object[]}
 */
export function getAllLicenses(comprador) {
  const all = Array.from(licensesStore.values());

  if (comprador) {
    return all.filter((l) =>
      l.comprador.toLowerCase().includes(comprador.toLowerCase())
    );
  }

  return all;
}

/**
 * Ativa/desativa uma licença.
 * @param {string} licenseId
 * @param {boolean} active
 * @returns {Object}
 */
export function toggleLicense(licenseId, active) {
  const license = licensesStore.get(licenseId);
  if (!license) throw new Error(`Licença não encontrada: ${licenseId}`);

  license.active = active;
  licensesStore.set(licenseId, license);

  log.info(`Licença ${active ? 'ativada' : 'desativada'}`, { licenseId, comprador: license.comprador });

  return license;
}

export default {
  getAvailableDataTypes,
  createLicense,
  trackDataAccess,
  generateInsightReport,
  getRevenueEstimate,
  getAllLicenses,
  toggleLicense,
  DATA_TYPES,
  PERIODOS,
};
