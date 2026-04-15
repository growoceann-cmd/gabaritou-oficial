/**
 * Rotas B2B - Gabaritou v2
 * Endpoints para parceiros corporativos, com autenticação via API key.
 */
import { Router } from 'express';
import { authenticateB2B, authenticateAdmin } from '../../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = Router();

// Aplicar middleware B2B em todas as rotas
router.use(authenticateB2B);

// Armazenamento em memória
const parceiros = new Map();
const faturas = new Map();

// Dados iniciais de demonstração
const parceiroDemo = {
  id: 'partner-demo',
  nome: 'Curso Exemplo Ltda',
  cnpj: '12.345.678/0001-90',
  email: 'contato@cursoexemplo.com.br',
  plano: 'enterprise',
  maxUsuarios: 500,
  usuariosAtivos: 234,
  dataContrato: '2024-01-15',
  status: 'ativo',
  apiKey: 'demo-key-12345',
};

parceiros.set(parceiroDemo.id, parceiroDemo);

faturas.set('partner-demo', [
  {
    id: 'inv-001',
    parceiroId: 'partner-demo',
    valor: 2499.90,
    periodo: '2024-12',
    status: 'pago',
    dataPagamento: '2024-12-05',
  },
  {
    id: 'inv-002',
    parceiroId: 'partner-demo',
    valor: 2499.90,
    periodo: '2025-01',
    status: 'pendente',
    dataVencimento: '2025-01-10',
  },
]);

/**
 * POST /api/b2b/partner
 * Cria um novo parceiro B2B (ADMIN ONLY).
 * Body: { nome, cnpj, email, plano, maxUsuarios }
 */
router.post('/partner', authenticateAdmin, async (req, res) => {
  try {
    const { nome, cnpj, email, plano = 'starter', maxUsuarios = 50 } = req.body;

    if (!nome || !email) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campos obrigatórios: nome, email',
        codigo: 'CAMPOS_OBRIGATORIOS',
      });
    }

    // Verificar se já existe parceiro com mesmo email
    const existing = Array.from(parceiros.values()).find((p) => p.email === email);
    if (existing) {
      return res.status(409).json({
        sucesso: false,
        erro: 'Já existe um parceiro com este email',
        codigo: 'PARCEIRO_EXISTENTE',
        parceiroId: existing.id,
      });
    }

    const planosValidos = ['starter', 'professional', 'enterprise'];
    const planoFinal = planosValidos.includes(plano) ? plano : 'starter';

    const parceiro = {
      id: `partner-${randomUUID().slice(0, 8)}`,
      nome,
      cnpj: cnpj || null,
      email,
      plano: planoFinal,
      maxUsuarios,
      usuariosAtivos: 0,
      dataContrato: new Date().toISOString().split('T')[0],
      status: 'ativo',
      apiKey: `b2b_${randomUUID().replace(/-/g, '')}`,
    };

    parceiros.set(parceiro.id, parceiro);

    const precos = { starter: 499.90, professional: 1499.90, enterprise: 2499.90 };

    res.status(201).json({
      sucesso: true,
      mensagem: 'Parceiro B2B criado com sucesso',
      dados: {
        ...parceiro,
        precoMensal: `R$ ${precos[planoFinal].toFixed(2)}`,
        funcionalidades: getFuncionalidadesPlano(planoFinal),
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao criar parceiro',
      codigo: 'ERRO_CRIAR_PARCEIRO',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/b2b/stats/:partnerId
 * Estatísticas de uso de um parceiro.
 */
router.get('/stats/:partnerId', (req, res) => {
  try {
    const { partnerId } = req.params;

    const parceiro = parceiros.get(partnerId);
    if (!parceiro) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Parceiro não encontrado',
        codigo: 'PARCEIRO_NAO_ENCONTRADO',
      });
    }

    const stats = {
      parceiro: {
        id: parceiro.id,
        nome: parceiro.nome,
        plano: parceiro.plano,
        status: parceiro.status,
      },
      uso: {
        usuariosAtivos: parceiro.usuariosAtivos,
        maxUsuarios: parceiro.maxUsuarios,
        utilizacaoPercentual: `${((parceiro.usuariosAtivos / parceiro.maxUsuarios) * 100).toFixed(1)}%`,
        predicoesGeradasMes: parceiro.usuariosAtivos * 45,
        simuladosRealizados: Math.floor(parceiro.usuariosAtivos * 3.2),
      },
      api: {
        totalRequisicoesMes: parceiro.usuariosAtivos * 320,
        mediaDiaria: Math.floor(parceiro.usuariosAtivos * 10.7),
        p99Latencia: '142ms',
        uptime: '99.97%',
      },
    };

    res.json({
      sucesso: true,
      mensagem: 'Estatísticas do parceiro',
      dados: stats,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar estatísticas',
      codigo: 'ERRO_STATS_B2B',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/b2b/invoices/:partnerId
 * Faturas de um parceiro.
 */
router.get('/invoices/:partnerId', (req, res) => {
  try {
    const { partnerId } = req.params;

    const parceiro = parceiros.get(partnerId);
    if (!parceiro) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Parceiro não encontrado',
        codigo: 'PARCEIRO_NAO_ENCONTRADO',
      });
    }

    const invoices = faturas.get(partnerId) || [];

    const totalPago = invoices
      .filter((inv) => inv.status === 'pago')
      .reduce((acc, inv) => acc + inv.valor, 0);
    const totalPendente = invoices
      .filter((inv) => inv.status === 'pendente')
      .reduce((acc, inv) => acc + inv.valor, 0);

    res.json({
      sucesso: true,
      mensagem: 'Faturas do parceiro',
      dados: {
        parceiroId: partnerId,
        faturas: invoices,
        resumo: {
          totalFaturas: invoices.length,
          totalPago: `R$ ${totalPago.toFixed(2)}`,
          totalPendente: `R$ ${totalPendente.toFixed(2)}`,
          totalGeral: `R$ ${(totalPago + totalPendente).toFixed(2)}`,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar faturas',
      codigo: 'ERRO_FATURAS_B2B',
      detalhes: err.message,
    });
  }
});

// ─── Funções auxiliares ──────────────────────────────────────────────

function getFuncionalidadesPlano(plano) {
  const funcs = {
    starter: [
      'API de predições',
      'Até 50 usuários',
      'Suporte por email',
      'Relatórios básicos',
    ],
    professional: [
      'API completa',
      'Até 200 usuários',
      'Suporte prioritário',
      'Relatórios avançados',
      'Tutor IA integrado',
      'Simulados adaptativos',
    ],
    enterprise: [
      'API completa + SLA garantido',
      'Usuários ilimitados',
      'Suporte dedicado 24/7',
      'Relatórios customizados',
      'Tutor IA integrado',
      'Simulados adaptativos',
      'Dados em lote (bulk)',
      'Webhooks personalizados',
      'Integração via SSO',
    ],
  };
  return funcs[plano] || funcs.starter;
}

export default router;
