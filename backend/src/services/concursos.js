/**
 * Serviço de Concursos Públicos — Gabaritou v3.
 *
 * Busca dados de concursos abertos para exibição no bot e na API.
 * Retorna dados mockados por enquanto (integração com API real futura).
 */

import { cached } from '../utils/cache.js';
import logger from '../utils/logger.js';
import { formatDateBR } from '../utils/helpers.js';

const log = logger.child('ConcursosService');

/**
 * Lista completa das UFs do Brasil.
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

// ============================================================
// Dados Mockados (serão substituídos por integração real)
// ============================================================

/** @type {Object[]} Dados mockados de concursos */
const MOCK_CONCURSOS = [
  {
    id: 'mock-ifam-2026',
    nome: 'Instituto Federal do Amazonas 2026',
    orgao: 'IFAM',
    banca: 'A Definir',
    uf: 'AM',
    cargo: 'Administrativo / Docente',
    vagas: 'N/A',
    salario: 'Até R$ 6.400,00',
    data_prova: '2026-07-12',
    data_fim_inscricao: '2026-06-01',
    situacao: 'Inscrições Abertas (01/05)',
    link: 'https://www.ifam.edu.br',
  },
  {
    id: 'mock-nav-2026',
    nome: 'NAV Brasil — Serviços de Navegação Aérea',
    orgao: 'NAV Brasil',
    banca: 'A Definir',
    uf: 'BR',
    cargo: 'Técnico / Administrativo',
    vagas: 351,
    salario: 'R$ 6.000,00',
    data_prova: '2026-08-16',
    data_fim_inscricao: '2026-06-15',
    situacao: 'Edital Publicado',
    link: 'https://www.navbrasil.gov.br',
  },
  {
    id: 'mock-ibira-2026',
    nome: 'Prefeitura de Ibiraçu/ES',
    orgao: 'Prefeitura',
    banca: 'A Definir',
    uf: 'ES',
    cargo: 'Diversos',
    vagas: 200,
    salario: 'A consultar',
    data_prova: '2026-06-28',
    data_fim_inscricao: '2026-05-24',
    situacao: 'Inscrições Abertas',
    link: 'https://www.ibiracu.es.gov.br',
  },
  {
    id: 'mock-sefaz-ce-2026',
    nome: 'Secretaria da Fazenda do Ceará 2026',
    orgao: 'SEFAZ-CE',
    banca: 'A Definir',
    uf: 'CE',
    cargo: 'Auditor Fiscal',
    vagas: 300,
    salario: 'R$ 16.000,00',
    data_prova: '2026-09-13',
    data_fim_inscricao: '2026-07-15',
    situacao: 'Autorizado / Edital Iminente',
    link: 'https://www.sefaz.ce.gov.br',
  },
  {
    id: 'mock-001',
    nome: 'Escola de Sargentos das Armas 2026',
    orgao: 'ESA',
    banca: 'EB (Própria)',
    uf: 'BR',
    cargo: 'Sargento (Geral/Saúde/Música)',
    vagas: 1100,
    salario: 'R$ 5.483,00',
    data_prova: '2026-10-04',
    data_fim_inscricao: '2026-05-04',
    situacao: 'Inscrições Abertas',
    link: 'https://www.esa.eb.mil.br',
  },
  {
    id: 'mock-002',
    nome: 'Corpo de Bombeiros Militar de Minas Gerais',
    orgao: 'CBM-MG',
    banca: 'IDEcan',
    uf: 'MG',
    cargo: 'Soldado / Oficiais',
    vagas: 329,
    salario: 'R$ 5.097,11',
    data_prova: '2026-09-28',
    data_fim_inscricao: '2026-06-17',
    situacao: 'Inscrições Abertas',
    link: 'https://www.bombeiros.mg.gov.br',
  },
  {
    id: 'mock-003',
    nome: 'Banco do Brasil 2026',
    orgao: 'BB',
    banca: 'CESGRANRIO',
    uf: 'BR',
    cargo: 'Escriturário / TI',
    vagas: 4000,
    salario: 'R$ 3.765,00',
    data_prova: '2026-11-22',
    data_fim_inscricao: '2026-09-15',
    situacao: 'Confirmado',
    link: 'https://www.bb.com.br',
  },
  {
    id: 'mock-004',
    nome: 'Supremo Tribunal Federal',
    orgao: 'STF',
    banca: 'CEBRASPE',
    uf: 'DF',
    cargo: 'Agente de Polícia Judicial',
    vagas: 40,
    salario: 'R$ 16.040,85',
    data_prova: '2026-12-13',
    data_fim_inscricao: '2026-10-20',
    situacao: 'Previsto (LOA)',
    link: 'https://www.stf.jus.br',
  },
  {
    id: 'mock-005',
    nome: 'Secretaria da Fazenda do Ceará',
    orgao: 'SEFAZ-CE',
    banca: 'A Definir',
    uf: 'CE',
    cargo: 'Auditor Fiscal',
    vagas: 50,
    salario: 'R$ 16.064,00',
    data_prova: '2026-11-08',
    data_fim_inscricao: '2026-09-01',
    situacao: 'Previsto para Abril',
    link: 'https://www.sefaz.ce.gov.br',
  },
  {
    id: 'mock-006',
    nome: 'Tribunal de Contas da União',
    orgao: 'TCU',
    banca: 'CESPE',
    uf: 'DF',
    cargo: 'Analista de Controle Externo',
    vagas: 20,
    salario: 'R$ 32.000,00',
    data_prova: '2025-12-07',
    data_fim_inscricao: '2025-10-05',
    situacao: 'Próximas Inscrições',
    link: 'https://www.tcu.gov.br',
  },
  {
    id: 'mock-007',
    nome: 'Banco do Brasil — Escriturário',
    orgao: 'BB',
    banca: 'CESPE',
    uf: 'BR',
    cargo: 'Escriturário',
    vagas: 2000,
    salario: 'R$ 3.622,00',
    data_prova: '2025-11-16',
    data_fim_inscricao: '2025-09-25',
    situacao: 'Próximas Inscrições',
    link: 'https://www.bb.com.br',
  },
  {
    id: 'mock-008',
    nome: 'Tribunal Regional Federal 5ª Região',
    orgao: 'TRF-5',
    banca: 'FCC',
    uf: 'PE',
    cargo: 'Técnico Judiciário — Área Administrativa',
    vagas: 75,
    salario: 'R$ 8.736,19',
    data_prova: '2025-08-24',
    data_fim_inscricao: '2025-06-30',
    situacao: 'Inscrições Abertas',
    link: 'https://www.trf5.jus.br',
  },
  {
    id: 'mock-009',
    nome: 'INSS — Analista do Seguro Social',
    orgao: 'INSS',
    banca: 'FGV',
    uf: 'BR',
    cargo: 'Analista do Seguro Social',
    vagas: 300,
    salario: 'R$ 12.522,00',
    data_prova: '2025-10-05',
    data_fim_inscricao: '2025-08-15',
    situacao: 'Inscrições Abertas',
    link: 'https://www.inss.gov.br',
  },
  {
    id: 'mock-010',
    nome: 'Tribunal Regional Federal 1ª Região',
    orgao: 'TRF-1',
    banca: 'CESPE',
    uf: 'DF',
    cargo: 'Juiz Federal Substituto',
    vagas: 10,
    salario: 'R$ 33.763,00',
    data_prova: '2025-11-23',
    data_fim_inscricao: '2025-09-15',
    situacao: 'Próximas Inscrições',
    link: 'https://www.trf1.jus.br',
  },
];

/**
 * Busca concursos por estado (UF).
 * Em produção, integrará com API externa. Por enquanto, retorna dados mockados.
 *
 * @param {string} uf - Sigla do estado (ex: 'SP', 'RJ', 'DF'). Use 'BR' para nacionais.
 * @returns {Promise<Object[]>} Lista de concursos filtrados por estado
 */
export async function getConcursosPorEstado(uf) {
  if (!uf || typeof uf !== 'string') {
    throw new Error('UF é obrigatória e deve ser uma string');
  }

  // Sanitize: only allow 2-3 alphanumeric chars to prevent injection
  const ufClean = uf.toUpperCase().trim().replace(/[^A-Z0-9]/g, '').slice(0, 3);
  if (ufClean.length < 2) {
    throw new Error('UF inválida');
  }
  if (ufClean !== 'BR' && !UFS.includes(ufClean)) {
    throw new Error(`UF não reconhecida: ${ufClean}`);
  }

  const cacheKey = `concursos:estado:${ufClean}`;

  return cached(cacheKey, async () => {
    log.info('Buscando concursos por estado', { uf: ufClean });

    // Filtra os mockados — 'BR' retorna todos
    const filtered = ufClean === 'BR'
      ? MOCK_CONCURSOS
      : MOCK_CONCURSOS.filter((c) => c.uf === ufClean || c.uf === 'BR');

    log.info('Concursos encontrados', {
      uf: ufClean,
      total: filtered.length,
      estadoNome: ESTADOS_NOMES[ufClean] || ufClean,
    });

    return filtered;
  }, 1800); // 30 min cache
}

/**
 * Busca concursos por banca examinadora.
 * Em produção, integrará com API externa. Por enquanto, retorna dados mockados.
 *
 * @param {string} banca - Nome da banca (ex: 'CESPE', 'FGV')
 * @returns {Promise<Object[]>} Lista de concursos filtrados por banca
 */
export async function getConcursosPorBanca(banca) {
  if (!banca || typeof banca !== 'string') {
    throw new Error('Banca é obrigatória e deve ser uma string');
  }

  // Sanitize: normalize, strip special chars, limit length
  const bancaNorm = normalizarBanca(banca).replace(/[^A-Z0-9 ]/g, '').slice(0, 50);
  if (bancaNorm.length < 2) {
    throw new Error('Banca inválida');
  }
  const cacheKey = `concursos:banca:${bancaNorm}`;

  return cached(cacheKey, async () => {
    log.info('Buscando concursos por banca', { banca: bancaNorm });

    const filtered = MOCK_CONCURSOS.filter((c) => {
      const bancaConcurso = normalizarBanca(c.banca || '');
      return bancaConcurso.includes(bancaNorm) || bancaNorm.includes(bancaConcurso);
    });

    log.info('Concursos encontrados por banca', {
      banca: bancaNorm,
      total: filtered.length,
    });

    return filtered;
  }, 1800);
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
    return 'Nenhum concurso encontrado para os filtros selecionados.\n\nTente buscar por outro estado ou banca.';
  }

  const concursos = dados.slice(0, limite);
  const totalOcultos = dados.length - concursos.length;

  let texto = `Concursos Encontrados (${dados.length})\n\n`;

  concursos.forEach((concurso, index) => {
    const nome = concurso.nome || concurso.titulo || 'Sem nome';
    const orgao = concurso.orgao || '';
    const banca = concurso.banca || 'Não informada';
    const vagas = concurso.vagas || '?';
    const dataProva = concurso.data_prova ? formatDateBR(concurso.data_prova) : '';
    const dataFimInsc = concurso.data_fim_inscricao ? formatDateBR(concurso.data_fim_inscricao) : '';
    const link = concurso.link || '';

    texto += `${index + 1}. ${nome}\n`;
    if (orgao) texto += `   Orgao: ${orgao}\n`;
    texto += `   Banca: ${banca}\n`;
    if (vagas !== '?') texto += `   Vagas: ${vagas}\n`;
    if (dataProva) texto += `   Prova: ${dataProva}\n`;
    if (dataFimInsc) texto += `   Inscricoes ate: ${dataFimInsc}\n`;
    if (link) texto += `   Link: ${link}\n`;
    texto += '\n';
  });

  if (totalOcultos > 0) {
    texto += `+ mais ${totalOcultos} concurso(s).\n`;
  }

  return texto;
}

/**
 * Retorna o nome completo de um estado pela UF.
 * @param {string} uf
 * @returns {string}
 */
export function getEstadoNome(uf) {
  return ESTADOS_NOMES[uf?.toUpperCase()] || uf;
}

/**
 * Retorna estatísticas sobre os concursos mockados.
 * @returns {Object}
 */
export function getEstatisticasConcursos() {
  const abertos = MOCK_CONCURSOS.filter((c) => c.situacao === 'Inscrições Abertas').length;
  const porBanca = {};
  const porEstado = {};

  for (const c of MOCK_CONCURSOS) {
    const banca = c.banca || 'Não informada';
    porBanca[banca] = (porBanca[banca] || 0) + 1;

    const estado = c.uf || 'N/I';
    porEstado[estado] = (porEstado[estado] || 0) + 1;
  }

  return {
    total: MOCK_CONCURSOS.length,
    abertos,
    porBanca,
    porEstado,
    bancas_count: Object.keys(porBanca).length,
  };
}

export default {
  UFS,
  BANCAS_CONHECIDAS,
  getConcursosPorEstado,
  getConcursosPorBanca,
  normalizarBanca,
  formatarConcursosBot,
  getEstadoNome,
  getEstatisticasConcursos,
};
