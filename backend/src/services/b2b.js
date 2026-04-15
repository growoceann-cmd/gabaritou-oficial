/**
 * Serviço B2B SaaS - Gestão de parceiros e API para instituições.
 *
 * Modelo B2B:
 * - Basic: R$ 3/aluno/mês (predições + relatórios básicos)
 * - Pro: R$ 5/aluno/mês (tudo do Basic + planos de estudo)
 * - Enterprise: R$ 8/aluno/mês (tudo + dados avançados + suporte)
 *
 * Gabaritou v2 - Backend Services Layer
 */

import { randomCode, formatBRL } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const log = logger.child('B2BService');

/** Preços por aluno por mês, por plano */
export const B2B_PRICE_PER_STUDENT = {
  basic: 3,
  pro: 5,
  enterprise: 8,
};

/** Descrição dos planos B2B */
const B2B_PLANOS = {
  basic: {
    nome: 'Basic',
    descricao: 'Predições e relatórios básicos',
    recursos: [
      'Predições de tópicos por banca',
      'Relatórios de acurácia',
      'Dashboard básico',
      'Suporte por e-mail',
    ],
    limite_mensal: 1000,
    api_acesso: true,
  },
  pro: {
    nome: 'Pro',
    descricao: 'Tudo do Basic + planos de estudo',
    recursos: [
      'Tudo do plano Basic',
      'Planos de estudos personalizados',
      'Dashboard avançado',
      'Ranking entre alunos',
      'Simulados adaptativos',
      'Suporte prioritário',
    ],
    limite_mensal: 10000,
    api_acesso: true,
  },
  enterprise: {
    nome: 'Enterprise',
    descricao: 'Acesso completo + dados avançados',
    recursos: [
      'Tudo do plano Pro',
      'Dataset completo de predições',
      'API dedicada com rate limit alto',
      'Relatórios customizados',
      'Integração via webhook',
      'Suporte dedicado 24/7',
      'SLA de 99.9%',
    ],
    limite_mensal: -1, // ilimitado
    api_acesso: true,
  },
};

/** Store de parceiros B2B */
const partnersStore = new Map();

/** Store de uso por parceiro */
const usageStore = new Map();

/** Store de faturas */
const invoicesStore = new Map();

// ============================================================
// Gestão de Parceiros
// ============================================================

/**
 * Cria um novo parceiro B2B com API key.
 * @param {string} nome - Nome da empresa/instituição
 * @param {'basic'|'pro'|'enterprise'} plano - Plano desejado
 * @param {Object} [dados={}] - Dados adicionais
 * @param {string} [dados.contato_email]
 * @param {string} [dados.contato_nome]
 * @param {string} [dados.cnpj]
 * @param {number} [dados.alunos Esperados]
 * @returns {Object} Parceiro criado
 */
export function createPartner(nome, plano, dados = {}) {
  if (!nome || typeof nome !== 'string') {
    throw new Error('Nome do parceiro é obrigatório');
  }

  if (!B2B_PLANOS[plano]) {
    throw new Error(`Plano inválido: "${plano}". Planos disponíveis: ${Object.keys(B2B_PLANOS).join(', ')}`);
  }

  const id = `partner_${randomCode(8)}`;
  const apiKey = `gab_b2b_${randomCode(16)}`;

  const partner = {
    id,
    nome: nome.trim(),
    api_key: apiKey,
    plano,
    alunos_count: dados.alunos_esperados || 0,
    created_at: new Date().toISOString(),
    active: true,
    contato_email: dados.contato_email || null,
    contato_nome: dados.contato_nome || null,
    cnpj: dados.cnpj || null,
    mes_atual_uso: 0,
    limite_mensal: B2B_PLANOS[plano].limite_mensal,
  };

  partnersStore.set(id, partner);
  usageStore.set(id, []);

  log.info('Parceiro B2B criado', {
    id,
    nome: partner.nome,
    plano,
    apiKeyPrefix: apiKey.substring(0, 15) + '...',
  });

  return {
    ...partner,
    api_key_masked: `${apiKey.substring(0, 12)}****`,
    plano_detalhes: B2B_PLANOS[plano],
    valor_estimado_mensal: formatBRL(partner.alunos_count * B2B_PRICE_PER_STUDENT[plano]),
  };
}

/**
 * Autentica um parceiro pela API key.
 * @param {string} apiKey - Chave de API do parceiro
 * @returns {Object|null} Dados do parceiro autenticado ou null
 */
export function authenticatePartner(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return null;
  }

  // Busca por API key nos parceiros
  for (const [, partner] of partnersStore) {
    if (partner.api_key === apiKey && partner.active) {
      // Verifica limite mensal
      const uso = usageStore.get(partner.id) || [];
      const mesAtual = new Date().toISOString().substring(0, 7); // YYYY-MM
      const usoMes = uso.filter((u) => u.timestamp.startsWith(mesAtual)).length;

      if (partner.limite_mensal > 0 && usoMes >= partner.limite_mensal) {
        log.warn('Limite mensal atingido para parceiro B2B', {
          partnerId: partner.id,
          nome: partner.nome,
          uso: usoMes,
          limite: partner.limite_mensal,
        });
        return {
          ...partner,
          rate_limited: true,
          motivo: 'Limite mensal de chamadas API atingido',
        };
      }

      return partner;
    }
  }

  return null;
}

/**
 * Registra uso da API por um parceiro.
 * @param {string} partnerId - ID do parceiro
 * @param {string} endpoint - Endpoint acessado
 * @param {Object} [meta={}] - Metadados da chamada
 * @returns {Object} Registro de uso
 */
export function trackUsage(partnerId, endpoint, meta = {}) {
  const usage = usageStore.get(partnerId) || [];

  const entry = {
    id: `usage_${randomCode(10)}`,
    partner_id: partnerId,
    endpoint,
    timestamp: new Date().toISOString(),
    status_code: meta.status_code || 200,
    response_time_ms: meta.response_time_ms || 0,
    ip: meta.ip || null,
    user_agent: meta.user_agent || null,
  };

  usage.push(entry);
  usageStore.set(partnerId, usage);

  // Atualiza contagem do mês no parceiro
  const partner = partnersStore.get(partnerId);
  if (partner) {
    partner.mes_atual_uso++;
  }

  return entry;
}

/**
 * Retorna estatísticas de uso de um parceiro.
 * @param {string} partnerId
 * @returns {Object} Estatísticas
 */
export function getPartnerStats(partnerId) {
  const partner = partnersStore.get(partnerId);
  if (!partner) {
    throw new Error(`Parceiro não encontrado: ${partnerId}`);
  }

  const usage = usageStore.get(partnerId) || [];

  // Agrupa por mês
  const porMes = {};
  for (const entry of usage) {
    const mes = entry.timestamp.substring(0, 7);
    if (!porMes[mes]) {
      porMes[mes] = { total: 0, endpoints: {} };
    }
    porMes[mes].total++;

    const ep = entry.endpoint;
    if (!porMes[mes].endpoints[ep]) porMes[mes].endpoints[ep] = 0;
    porMes[mes].endpoints[ep]++;
  }

  // Uso do mês atual
  const mesAtual = new Date().toISOString().substring(0, 7);
  const usoAtual = porMes[mesAtual] || { total: 0, endpoints: {} };

  // Top endpoints
  const todosEndpoints = {};
  for (const entry of usage) {
    const ep = entry.endpoint;
    if (!todosEndpoints[ep]) todosEndpoints[ep] = 0;
    todosEndpoints[ep]++;
  }

  const topEndpoints = Object.entries(todosEndpoints)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([endpoint, count]) => ({ endpoint, count }));

  // Tempo médio de resposta
  const tempos = usage.map((u) => u.response_time_ms).filter((t) => t > 0);
  const tempoMedio = tempos.length > 0
    ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
    : 0;

  return {
    parceiro: {
      id: partner.id,
      nome: partner.nome,
      plano: partner.plano,
      ativo: partner.active,
    },
    uso_mes_atual: usoAtual.total,
    limite_mensal: partner.limite_mensal,
    percentual_uso: partner.limite_mensal > 0
      ? Math.round((usoAtual.total / partner.limite_mensal) * 100)
      : null,
    total_chamadas: usage.length,
    tempo_medio_resposta_ms: tempoMedio,
    por_mes: porMes,
    top_endpoints: topEndpoints,
  };
}

/**
 * Gera fatura mensal para um parceiro.
 * @param {string} partnerId
 * @param {string} [mes] - Mês no formato YYYY-MM (padrão: mês atual)
 * @returns {Object} Fatura gerada
 */
export function generateInvoice(partnerId, mes) {
  const partner = partnersStore.get(partnerId);
  if (!partner) {
    throw new Error(`Parceiro não encontrado: ${partnerId}`);
  }

  const mesFaturado = mes || new Date().toISOString().substring(0, 7);
  const ano = parseInt(mesFaturado.substring(0, 4));
  const mesNum = parseInt(mesFaturado.substring(5, 7));

  // Conta uso no mês
  const usage = usageStore.get(partnerId) || [];
  const usoMes = usage.filter((u) => u.timestamp.startsWith(mesFaturado));

  // Calcula valor
  const precoPorAluno = B2B_PRICE_PER_STUDENT[partner.plano];
  const valorTotal = partner.alunos_count * precoPorAluno;

  const invoice = {
    id: `inv_${randomCode(8)}`,
    partner_id: partnerId,
    parceiro_nome: partner.nome,
    mes: mesFaturado,
    plano: partner.plano,
    alunos_count: partner.alunos_count,
    preco_por_aluno: precoPorAluno,
    valor_total: valorTotal,
    valor_formatado: formatBRL(valorTotal),
    chamadas_api: usoMes.length,
    data_emissao: new Date().toISOString(),
    vencimento: new Date(ano, mesNum, 10).toISOString(), // 10 do mês seguinte
    status: 'pendente',
    descricao: `Fatura Gabaritou B2B - Plano ${B2B_PLANOS[partner.plano].nome} - ${mesFaturado}`,
  };

  // Armazena a fatura
  const invoices = invoicesStore.get(partnerId) || [];
  invoices.push(invoice);
  invoicesStore.set(partnerId, invoices);

  log.info('Fatura B2B gerada', {
    invoiceId: invoice.id,
    partnerId,
    mes: mesFaturado,
    valor: formatBRL(valorTotal),
  });

  return invoice;
}

/**
 * Retorna informações de planos B2B.
 * @returns {Object}
 */
export function getB2BPlans() {
  return Object.entries(B2B_PLANOS).map(([key, plano]) => ({
    id: key,
    ...plano,
    preco_por_aluno: B2B_PRICE_PER_STUDENT[key],
    preco_formatado: formatBRL(B2B_PRICE_PER_STUDENT[key]) + '/aluno/mês',
  }));
}

/**
 * Ativa/desativa um parceiro B2B.
 * @param {string} partnerId
 * @param {boolean} active
 * @returns {Object}
 */
export function togglePartner(partnerId, active) {
  const partner = partnersStore.get(partnerId);
  if (!partner) {
    throw new Error(`Parceiro não encontrado: ${partnerId}`);
  }

  partner.active = active;
  partnersStore.set(partnerId, partner);

  log.info(`Parceiro B2B ${active ? 'ativado' : 'desativado'}`, { partnerId, nome: partner.nome });

  return partner;
}

/**
 * Atualiza contagem de alunos de um parceiro.
 * @param {string} partnerId
 * @param {number} alunosCount
 * @returns {Object}
 */
export function updateAlunosCount(partnerId, alunosCount) {
  const partner = partnersStore.get(partnerId);
  if (!partner) {
    throw new Error(`Parceiro não encontrado: ${partnerId}`);
  }

  partner.alunos_count = Math.max(0, alunosCount);
  partnersStore.set(partnerId, partner);

  log.info('Contagem de alunos atualizada', {
    partnerId,
    nome: partner.nome,
    alunos: partner.alunos_count,
  });

  return partner;
}

/**
 * Lista todos os parceiros B2B.
 * @returns {Object[]}
 */
export function getAllPartners() {
  return Array.from(partnersStore.values()).map((p) => ({
    id: p.id,
    nome: p.nome,
    plano: p.plano,
    ativo: p.active,
    alunos: p.alunos_count,
    criado_em: p.created_at,
    api_key_masked: `${p.api_key.substring(0, 12)}****`,
  }));
}

export default {
  B2B_PRICE_PER_STUDENT,
  createPartner,
  authenticatePartner,
  trackUsage,
  getPartnerStats,
  generateInvoice,
  getB2BPlans,
  togglePartner,
  updateAlunosCount,
  getAllPartners,
};
