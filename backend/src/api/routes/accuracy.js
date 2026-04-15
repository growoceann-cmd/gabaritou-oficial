/**
 * Rotas de Acurácia - Gabaritou v2
 * Endpoints para relatórios de acurácia pública, histórica e compartilhamento.
 */
import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = Router();

// Armazenamento em memória (substituir por banco de dados em produção)
const relatorios = new Map();
const relatoriosHistoricos = new Map();

// Dados iniciais de demonstração
const dadosIniciais = [
  {
    id: 'rpt-cespe-2024',
    banca: 'CESPE',
    periodo: '2024',
    acuraciaGeral: 87.3,
    totalPredicoes: 342,
    acertos: 299,
    topicos: [
      { topico: 'Direitos Fundamentais', predito: true, ocorreu: true },
      { topico: 'Controle de Constitucionalidade', predito: true, ocorreu: true },
      { topico: 'Licitações', predito: true, ocorreu: false },
    ],
    dataGeracao: '2024-12-15T10:00:00Z',
  },
  {
    id: 'rpt-fgv-2024',
    banca: 'FGV',
    periodo: '2024',
    acuraciaGeral: 82.1,
    totalPredicoes: 256,
    acertos: 210,
    topicos: [
      { topico: 'Atos Administrativos', predito: true, ocorreu: true },
      { topico: 'Responsabilidade Civil', predito: true, ocorreu: true },
      { topico: 'Servidores Públicos', predito: true, ocorreu: false },
    ],
    dataGeracao: '2024-12-10T14:30:00Z',
  },
];

for (const rel of dadosIniciais) {
  relatorios.set(rel.id, rel);
  if (!relatoriosHistoricos.has(rel.banca)) {
    relatoriosHistoricos.set(rel.banca, []);
  }
  relatoriosHistoricos.get(rel.banca).push(rel);
}

/**
 * GET /api/accuracy
 * Lista relatórios de acurácia públicos.
 * Query params: banca (filtro opcional)
 */
router.get('/', (req, res) => {
  try {
    const { banca } = req.query;
    let lista = Array.from(relatorios.values());

    if (banca) {
      lista = lista.filter((r) => r.banca.toUpperCase() === banca.toUpperCase());
    }

    lista.sort((a, b) => new Date(b.dataGeracao) - new Date(a.dataGeracao));

    res.json({
      sucesso: true,
      mensagem: 'Relatórios de acurácia',
      dados: lista,
      total: lista.length,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao listar relatórios',
      codigo: 'ERRO_LISTAR_RELATORIOS',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/accuracy/:id
 * Obtém um relatório específico.
 */
router.get('/:id', (req, res) => {
  try {
    const relatorio = relatorios.get(req.params.id);

    if (!relatorio) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Relatório não encontrado',
        codigo: 'RELATORIO_NAO_ENCONTRADO',
      });
    }

    res.json({
      sucesso: true,
      dados: relatorio,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar relatório',
      codigo: 'ERRO_BUSCAR_RELATORIO',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/accuracy/historica/:banca
 * Acurácia histórica por banca examinadora.
 */
router.get('/historica/:banca', (req, res) => {
  try {
    const { banca } = req.params;
    const historico = relatoriosHistoricos.get(banca.toUpperCase()) || [];

    if (historico.length === 0) {
      return res.json({
        sucesso: true,
        mensagem: `Nenhum histórico encontrado para ${banca}`,
        dados: [],
        banca,
      });
    }

    // Calcular estatísticas agregadas
    const acuraciaMedia = historico.reduce((acc, r) => acc + r.acuraciaGeral, 0) / historico.length;
    const melhorAcuracia = Math.max(...historico.map((r) => r.acuraciaGeral));
    const tendencia = historico.length >= 2
      ? (historico[historico.length - 1].acuraciaGeral > historico[0].acuraciaGeral ? 'melhorando' : 'estavel')
      : 'insuficiente';

    res.json({
      sucesso: true,
      mensagem: `Histórico de acurácia: ${banca}`,
      dados: {
        banca,
        totalRelatorios: historico.length,
        acuraciaMedia: `${acuraciaMedia.toFixed(1)}%`,
        melhorAcuracia: `${melhorAcuracia.toFixed(1)}%`,
        tendencia,
        relatorios: historico,
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar histórico',
      codigo: 'ERRO_HISTORICO',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/accuracy/share/:id
 * Dados para gerar imagem de compartilhamento do relatório.
 */
router.get('/share/:id', (req, res) => {
  try {
    const relatorio = relatorios.get(req.params.id);

    if (!relatorio) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Relatório não encontrado',
        codigo: 'RELATORIO_NAO_ENCONTRADO',
      });
    }

    const shareData = {
      titulo: `📊 Acurácia Gabaritou - ${relatorio.banca}`,
      subtitulo: `Período: ${relatorio.periodo}`,
      estatisticas: {
        acuracia: `${relatorio.acuraciaGeral}%`,
        totalPredicoes: relatorio.totalPredicoes,
        acertos: relatorio.acertos,
      },
      mensagemCompartilhamento:
        `🏆 Gabaritou acertou ${relatorio.acuraciaGeral}% das predições para ${relatorio.banca} em ${relatorio.periodo}!\n\n` +
        `✅ ${relatorio.acertos} acertos em ${relatorio.totalPredicoes} predições\n` +
        `📈 Confira: https://gabaritou.com.br/relatorio/${relatorio.id}`,
      cores: {
        primaria: '#2563EB',
        secundaria: '#10B981',
        fundo: '#FFFFFF',
        texto: '#1F2937',
      },
      dimensoes: { largura: 1080, altura: 1080 },
    };

    res.json({
      sucesso: true,
      dados: shareData,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao gerar dados de compartilhamento',
      codigo: 'ERRO_SHARE',
      detalhes: err.message,
    });
  }
});

/**
 * POST /api/accuracy/gerar
 * Gera novo relatório de acurácia (ADMIN ONLY).
 * Header: ADMIN_SECRET
 */
router.post('/gerar', authenticateAdmin, async (req, res) => {
  try {
    const { banca, periodo } = req.body;

    if (!banca || !periodo) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campos obrigatórios: banca, periodo',
        codigo: 'CAMPOS_OBRIGATORIOS',
      });
    }

    // Em produção: calcular acurácia real a partir dos feedbacks
    const acuraciaGeral = 75 + Math.random() * 18;
    const totalPredicoes = Math.floor(100 + Math.random() * 300);
    const acertos = Math.floor(totalPredicoes * (acuraciaGeral / 100));

    const relatorio = {
      id: `rpt-${banca.toLowerCase()}-${periodo}-${Date.now()}`,
      banca: banca.toUpperCase(),
      periodo,
      acuraciaGeral: parseFloat(acuraciaGeral.toFixed(1)),
      totalPredicoes,
      acertos,
      topicos: [],
      dataGeracao: new Date().toISOString(),
    };

    relatorios.set(relatorio.id, relatorio);

    if (!relatoriosHistoricos.has(relatorio.banca)) {
      relatoriosHistoricos.set(relatorio.banca, []);
    }
    relatoriosHistoricos.get(relatorio.banca).push(relatorio);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Relatório gerado com sucesso',
      dados: relatorio,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao gerar relatório',
      codigo: 'ERRO_GERAR_RELATORIO',
      detalhes: err.message,
    });
  }
});

export default router;
