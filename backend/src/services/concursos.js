/**
 * Serviço de Concursos Públicos.
 * Busca dados de concursos da API externa e formata para uso no bot e na plataforma.
 * Gabaritou v2 - Backend Services Layer
 */

import { cached, invalidateByPrefix } from '../utils/cache.js';
import logger from '../utils/logger.js';
import { formatDateBR, truncate } from '../utils/helpers.js';

const log = logger.child('ConcursosService');

/** URL base da API de concursos */
export const API_BASE = 'https://concursos-api.deno.dev';

/**
 * Lista completa das UFs do Brasil (27 estados + DF).
 * @type {string[]}
 */
export const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR',
  'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

/** Mapa de nomes completos dos estados por UF */
const ESTADOS_NOMES = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso', PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco',
  PI: 'Piauí', PR: 'Paraná', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RO: 'Rondônia', RR: 'Roraima', RS: 'Rio Grande do Sul', SC: 'Santa Catarina',
  SE: 'Sergipe', SP: 'São Paulo', TO: 'Tocantins',
};

/**
 * Bancas examinadoras conhecidas para normalização.
 * @type {string[]}
 */
export const BANCAS_CONHECIDAS = [
  'CESPE', 'CEBRASPE', 'FGV', 'VUNESP', 'FCC', 'FCB',
  'QUADRIX', 'AOCP', 'IBFC', 'COPEVE', 'UFV', 'UFU',
  'CONSULPLAN', 'IDECAN', 'FUNCAB', 'FUMARC', 'FADESP',
  'NUCEPE', 'UNIVERSA', 'INSTITUTO CIENTEC',
];

/**
 * Normaliza o nome da banca para formato padronizado (maiúsculas, sem acentos).
 * @param {string} banca
 * @returns {string}
 */
export function normalizarBanca(banca) {
  if (!banca) return '';
  return banca
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Verifica se uma banca corresponde a uma banca conhecida (incluindo variações).
 * Exemplo: CEBRASPE corresponde a CESPE.
 * @param {string} banca - Banca a ser verificada
 * @param {string} bancaAlvo - Banca alvo para comparação
 * @returns {boolean}
 */
export function bancaCorresponde(banca, bancaAlvo) {
  const normalized = normalizarBanca(banca);
  const target = normalizarBanca(bancaAlvo);

  if (normalized === target) return true;

  // CEBRASPE é o novo nome do CESPE
  if ((normalized === 'CESPE' && target === 'CEBRASPE') ||
      (normalized === 'CEBRASPE' && target === 'CESPE')) {
    return true;
  }

  // Verifica se uma contém a outra
  if (normalized.includes(target) || target.includes(normalized)) {
    return true;
  }

  return false;
}

/**
 * Busca concursos por estado (UF) com cache de 1 hora.
 * @param {string} uf - Sigla do estado (ex: 'SP', 'RJ', 'DF')
 * @returns {Promise<Object[]>} Lista de concursos
 * @throws {Error} Se UF for inválida ou a API retornar erro
 */
export async function getConcursosPorEstado(uf) {
  if (!uf || typeof uf !== 'string') {
    throw new Error('UF é obrigatória e deve ser uma string');
  }

  const ufUpper = uf.toUpperCase().trim();

  if (!UFS.includes(ufUpper)) {
    throw new Error(`UF inválida: "${uf}". UFs disponíveis: ${UFS.join(', ')}`);
  }

  const cacheKey = `concursos:estado:${ufUpper}`;

  return cached(cacheKey, async () => {
    const url = `${API_BASE}/estado/${ufUpper}`;

    log.info('Buscando concursos por estado', { uf: ufUpper, url });

    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`API retornou status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        log.warn('API retornou formato inesperado', { tipo: typeof data });
        return [];
      }

      log.info('Concursos encontrados', {
        uf: ufUpper,
        total: data.length,
        estadoNome: ESTADOS_NOMES[ufUpper] || ufUpper,
      });

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        log.error('Timeout ao buscar concursos', { uf: ufUpper });
        throw new Error('Timeout: API de concursos demorou demais para responder');
      }
      log.error('Erro ao buscar concursos', {
        uf: ufUpper,
        erro: error.message,
      });
      throw error;
    }
  }, 3600); // 1 hora de cache
}

/**
 * Filtra concursos por banca examinadora.
 * Faz matching flexível considerando variações de nome.
 * @param {Object[]} concursos - Lista de concursos
 * @param {string} banca - Nome da banca para filtrar
 * @returns {Object[]} Concursos filtrados pela banca
 */
export function filtrarPorBanca(concursos, banca) {
  if (!Array.isArray(concursos)) return [];
  if (!banca) return concursos;

  const bancaNorm = normalizarBanca(banca);

  return concursos.filter((concurso) => {
    // Tenta diferentes campos onde a banca pode estar
    const bancaConcurso = concurso.banca || concurso.banca_examinadora || '';
    const orgao = concurso.orgao || concurso.instituicao || '';

    return bancaCorresponde(bancaConcurso, bancaNorm) ||
           bancaCorresponde(orgao, bancaNorm);
  });
}

/**
 * Filtra concursos por palavra-chave no nome/órgão.
 * @param {Object[]} concursos
 * @param {string} keyword
 * @returns {Object[]}
 */
export function filtrarPorKeyword(concursos, keyword) {
  if (!Array.isArray(concursos)) return [];
  if (!keyword) return concursos;

  const kw = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return concursos.filter((c) => {
    const nome = (c.nome || c.titulo || c.concurso || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const orgao = (c.orgao || c.instituicao || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return nome.includes(kw) || orgao.includes(kw);
  });
}

/**
 * Filtra concursos com inscrições abertas.
 * @param {Object[]} concursos
 * @returns {Object[]}
 */
export function filtrarAbertos(concursos) {
  if (!Array.isArray(concursos)) return [];

  return concursos.filter((c) => {
    if (c.situacao === 'Inscrições Abertas') return true;
    if (c.inscricoes_abertas === true) return true;

    const dataFim = c.data_fim_inscricao || c.fim_inscricoes;
    if (dataFim && new Date(dataFim) > new Date()) return true;

    return false;
  });
}

/**
 * Formata concursos para exibição no Telegram bot.
 * Gera texto markdown-friendly com as informações essenciais.
 * @param {Object[]} dados - Lista de concursos
 * @param {number} [limite=10] - Número máximo de concursos a exibir
 * @returns {string} Texto formatado para o Telegram
 */
export function formatarConcursosBot(dados, limite = 10) {
  if (!Array.isArray(dados) || dados.length === 0) {
    return '🔍 *Nenhum concurso encontrado* para os filtros selecionados.\n\nTente buscar por outro estado ou banca.';
  }

  const concursos = dados.slice(0, limite);
  const totalOcultos = dados.length - concursos.length;

  let texto = `📋 *Concursos Encontrados* (${dados.length})\n\n`;

  concursos.forEach((concurso, index) => {
    const nome = concurso.nome || concurso.titulo || concurso.concurso || 'Sem nome';
    const orgao = concurso.orgao || concurso.instituicao || '';
    const banca = concurso.banca || concurso.banca_examinadora || 'Não informada';
    const situacao = concurso.situacao || concurso.status || '';
    const dataProva = concurso.data_prova ? formatDateBR(concurso.data_prova) : '';
    const dataFimInsc = concurso.data_fim_inscricao ? formatDateBR(concurso.data_fim_inscricao) : '';
    const vagas = concurso.vagas || concurso.quantidade_vagas || '?';
    const salario = concurso.salario ? `R$ ${concurso.salario}` : '';
    const link = concurso.link || concurso.url_inscricao || '';

    texto += `*${index + 1}.* ${truncate(nome, 60)}\n`;
    if (orgao && orgao !== nome) texto += `   🏛️ Órgão: ${truncate(orgao, 50)}\n`;
    texto += `   📝 Banca: ${banca}\n`;
    if (vagas && vagas !== '?') texto += `   💼 Vagas: ${vagas}\n`;
    if (salario) texto += `   💰 Salário: ${salario}\n`;
    if (situacao) texto += `   📌 ${situacao}\n`;
    if (dataProva) texto += `   📅 Prova: ${dataProva}\n`;
    if (dataFimInsc) texto += `   ⏰ Inscrições até: ${dataFimInsc}\n`;
    if (link) texto += `   🔗 [Ver mais](${link})\n`;
    texto += '\n';
  });

  if (totalOcultos > 0) {
    texto += `➕ E mais ${totalOcultos} concurso(s). Acesse o site para ver todos.\n`;
  }

  texto += '\n⚡ _Dados fornecidos automaticamente pela Gabaritou v2_';

  return texto;
}

/**
 * Formata um único concurso para card compacto.
 * @param {Object} concurso
 * @returns {string}
 */
export function formatarConcursoCard(concurso) {
  const nome = concurso.nome || concurso.titulo || 'Sem nome';
  const banca = concurso.banca || 'N/I';
  const vagas = concurso.vagas || '?';
  const dataProva = concurso.data_prova ? formatDateBR(concurso.data_prova) : 'N/I';

  return `📌 *${truncate(nome, 55)}*\n📝 Banca: ${banca} | 💼 Vagas: ${vagas} | 📅 ${dataProva}`;
}

/**
 * Busca concursos por múltiplos filtros combinados.
 * @param {Object} filtros
 * @param {string} [filtros.uf] - Filtrar por estado
 * @param {string} [filtros.banca] - Filtrar por banca
 * @param {string} [filtros.keyword] - Filtrar por palavra-chave
 * @param {boolean} [filtros.abertos=false] - Apenas inscrições abertas
 * @param {number} [filtros.limite=50] - Limite de resultados
 * @returns {Promise<Object[]>}
 */
export async function buscarConcursos({ uf, banca, keyword, abertos = false, limite = 50 } = {}) {
  let concursos = [];

  if (uf) {
    concursos = await getConcursosPorEstado(uf);
  }

  if (banca) {
    concursos = filtrarPorBanca(concursos, banca);
  }

  if (keyword) {
    concursos = filtrarPorKeyword(concursos, keyword);
  }

  if (abertos) {
    concursos = filtrarAbertos(concursos);
  }

  return concursos.slice(0, limite);
}

/**
 * Invalida o cache de concursos (para forçar atualização).
 * @param {string} [uf] - UF específica ou todas se omitido
 */
export function invalidarCache(uf) {
  if (uf) {
    const ufUpper = uf.toUpperCase();
    invalidateByPrefix(`concursos:estado:${ufUpper}`);
    log.info('Cache invalidado para UF', { uf: ufUpper });
  } else {
    invalidateByPrefix('concursos:');
    log.info('Cache de concursos completamente invalidado');
  }
}

/**
 * Retorna o nome completo de um estado pela UF.
 * @param {string} uf
 * @returns {string}
 */
export function getEstadoNome(uf) {
  return ESTADOS_NOMES[uf.toUpperCase()] || uf;
}

/**
 * Retorna estatísticas sobre concursos (resumo).
 * @param {Object[]} concursos
 * @returns {Object}
 */
export function getEstatisticasConcursos(concursos) {
  if (!Array.isArray(concursos) || concursos.length === 0) {
    return { total: 0, porBanca: {}, porEstado: {}, abertos: 0 };
  }

  const porBanca = {};
  const porEstado = {};
  let abertos = 0;

  for (const c of concursos) {
    // Conta por banca
    const banca = c.banca || c.banca_examinadora || 'Não informada';
    porBanca[banca] = (porBanca[banca] || 0) + 1;

    // Conta por estado
    const estado = c.estado || c.uf || 'N/I';
    porEstado[estado] = (porEstado[estado] || 0) + 1;

    // Conta abertos
    if (c.situacao === 'Inscrições Abertas' || c.inscricoes_abertas === true) {
      abertos++;
    }
  }

  return {
    total: concursos.length,
    porBanca,
    porEstado,
    abertos,
    bancas_count: Object.keys(porBanca).length,
  };
}

export default {
  API_BASE,
  UFS,
  BANCAS_CONHECIDAS,
  getConcursosPorEstado,
  filtrarPorBanca,
  filtrarPorKeyword,
  filtrarAbertos,
  formatarConcursosBot,
  formatarConcursoCard,
  buscarConcursos,
  invalidarCache,
  normalizarBanca,
  bancaCorresponde,
  getEstadoNome,
  getEstatisticasConcursos,
};
