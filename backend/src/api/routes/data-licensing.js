/**
 * Rotas Data Licensing - Gabaritou v2
 * Endpoints para licenciamento de dados e insights.
 */
import { Router } from 'express';
import { authenticateB2B, authenticateAdmin } from '../../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = Router();

// Armazenamento em memória
const licencas = new Map();
const insightsCache = new Map();

// Dados disponíveis
const tiposDados = [
  {
    tipo: 'predicoes_agregadas',
    nome: 'Predições Agregadas',
    descricao: 'Dados agregados de predições por banca, matéria e período',
    formatos: ['JSON', 'CSV', 'API streaming'],
    preco: 'R$ 2.490/mês',
  },
  {
    tipo: 'topicos_tendencia',
    nome: 'Tendências de Tópicos',
    descricao: 'Análise de tendências de tópicos ao longo do tempo',
    formatos: ['JSON', 'CSV'],
    preco: 'R$ 1.990/mês',
  },
  {
    tipo: 'acuracia_historica',
    nome: 'Acurácia Histórica',
    descricao: 'Histórico completo de acurácia das predições',
    formatos: ['JSON', 'CSV', 'PDF'],
    preco: 'R$ 990/mês',
  },
  {
    tipo: 'feedback_anonimizado',
    nome: 'Feedback Anonimizado',
    descricao: 'Feedbacks de usuários anonimizados (data flywheel)',
    formatos: ['JSON', 'CSV'],
    preco: 'R$ 3.490/mês',
  },
  {
    tipo: 'estatisticas_candidatos',
    nome: 'Estatísticas de Candidatos',
    descricao: 'Estatísticas agregadas sobre candidatos e desempenho',
    formatos: ['JSON', 'CSV', 'Dashboard'],
    preco: 'R$ 4.990/mês',
  },
];

// Inicializar insights
const insightsDemo = {
  'predicoes_agregadas_2025': {
    tipo: 'predicoes_agregadas',
    periodo: '2025',
    dados: {
      totalPredicoes: 12847,
      bancas: { CESPE: 4200, FGV: 3100, FCC: 2800, VUNESP: 1747 },
      materiasTop: ['Direito Constitucional', 'Direito Administrativo', 'Português', 'Raciocínio Lógico'],
      taxaAcuraciaGeral: '84.2%',
      crescimento: '+12% vs período anterior',
    },
    dataGeracao: '2025-01-15',
  },
  'topicos_tendencia_2025': {
    tipo: 'topicos_tendencia',
    periodo: '2025',
    dados: {
      topicosEmAlta: ['Licitações (Nova Lei)', 'Direitos Fundamentais', 'IA no Direito'],
      topicosEmBaixa: ['Direito Previdenciário', 'Processo Legislativo antigo'],
      novasTendencias: ['Inteligência Artificial', 'LGPD', 'Direito Digital'],
    },
    dataGeracao: '2025-01-15',
  },
};
for (const [key, val] of Object.entries(insightsDemo)) {
  insightsCache.set(key, val);
}

// Licença demo
licencas.set('demo-license', {
  id: 'demo-license',
  parceiroId: 'partner-demo',
  tipo: 'enterprise',
  tiposDados: ['predicoes_agregadas', 'topicos_tendencia', 'acuracia_historica'],
  dataInicio: '2024-06-01',
  dataFim: '2025-06-01',
  status: 'ativa',
  requisicoesMes: 15230,
  limiteRequisicoes: 50000,
});

/**
 * GET /api/data-licensing/available
 * Lista os tipos de dados disponíveis para licenciamento.
 */
router.get('/available', (req, res) => {
  try {
    res.json({
      sucesso: true,
      mensagem: 'Dados disponíveis para licenciamento',
      dados: tiposDados,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar dados disponíveis',
      codigo: 'ERRO_DADOS_DISPONIVEIS',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/data-licensing/insight/:tipo/:periodo
 * Obtém um insight report (requer licença ativa).
 */
router.get('/insight/:tipo/:periodo', authenticateB2B, (req, res) => {
  try {
    const { tipo, periodo } = req.params;

    const cacheKey = `${tipo}_${periodo}`;
    let insight = insightsCache.get(cacheKey);

    if (!insight) {
      // Gerar insight genérico
      insight = {
        tipo,
        periodo,
        dados: {
          mensagem: `Insight gerado para ${tipo} no período ${periodo}`,
          totalRegistros: Math.floor(1000 + Math.random() * 5000),
          atualizadoEm: new Date().toISOString(),
        },
        dataGeracao: new Date().toISOString().split('T')[0],
      };
      insightsCache.set(cacheKey, insight);
    }

    res.json({
      sucesso: true,
      mensagem: `Insight: ${tipo} - ${periodo}`,
      dados: insight,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar insight',
      codigo: 'ERRO_INSIGHT',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/data-licensing/revenue
 * Estimativa de receita por data licensing (ADMIN ONLY).
 */
router.get('/revenue', authenticateAdmin, (req, res) => {
  try {
    const licencasAtivas = Array.from(licencas.values()).filter((l) => l.status === 'ativa');
    const receitaMensal = licencasAtivas.reduce((acc, l) => {
      const precos = { starter: 990, professional: 4490, enterprise: 9990 };
      return acc + (precos[l.tipo] || 990);
    }, 0);

    const revenue = {
      resumo: {
        totalLicencas: licencas.size,
        licencasAtivas: licencasAtivas.length,
        receitaMensal: `R$ ${receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        receitaAnualProjetada: `R$ ${(receitaMensal * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      porTipo: {
        starter: licencasAtivas.filter((l) => l.tipo === 'starter').length,
        professional: licencasAtivas.filter((l) => l.tipo === 'professional').length,
        enterprise: licencasAtivas.filter((l) => l.tipo === 'enterprise').length,
      },
      crescimento: {
        novosClientesMes: 3,
        churn: '5.2%',
        crescimentoMensal: '+18%',
      },
      projecao: {
        trimestre1: `R$ ${(receitaMensal * 3 * 1.12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        semestre1: `R$ ${(receitaMensal * 6 * 1.25).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        anual: `R$ ${(receitaMensal * 12 * 1.5).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
    };

    res.json({
      sucesso: true,
      mensagem: 'Receita de data licensing',
      dados: revenue,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar receita',
      codigo: 'ERRO_REVENUE',
      detalhes: err.message,
    });
  }
});

/**
 * POST /api/data-licensing/license
 * Cria uma nova licença (ADMIN ONLY).
 * Body: { parceiroId, tipo, tiposDados[] }
 */
router.post('/license', authenticateAdmin, (req, res) => {
  try {
    const { parceiroId, tipo = 'starter', tiposDados = [] } = req.body;

    if (!parceiroId) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campo obrigatório: parceiroId',
        codigo: 'CAMPO_OBRIGATORIO',
      });
    }

    const tiposValidos = ['starter', 'professional', 'enterprise'];
    const tipoFinal = tiposValidos.includes(tipo) ? tipo : 'starter';

    const limites = {
      starter: 10000,
      professional: 50000,
      enterprise: 200000,
    };

    const licenca = {
      id: `lic-${randomUUID().slice(0, 8)}`,
      parceiroId,
      tipo: tipoFinal,
      tiposDados: tiposDados.length > 0 ? tiposDados : ['predicoes_agregadas', 'acuracia_historica'],
      dataInicio: new Date().toISOString().split('T')[0],
      dataFim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'ativa',
      requisicoesMes: 0,
      limiteRequisicoes: limites[tipoFinal],
      apiKey: `dl_${randomUUID().replace(/-/g, '')}`,
    };

    licencas.set(licenca.id, licenca);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Licença criada com sucesso',
      dados: licenca,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao criar licença',
      codigo: 'ERRO_CRIAR_LICENCA',
      detalhes: err.message,
    });
  }
});

export default router;
