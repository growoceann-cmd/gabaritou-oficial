/**
 * Rotas de Comunidade - Gabaritou v2
 * Endpoints para rankings, perfis, desafios e grupos de estudo.
 */
import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../../middleware/auth.js';

const router = Router();

// Armazenamento em memória
const perfis = new Map();
const desafios = new Map();
const grupos = new Map();
const desafioParticipantes = new Map();

// Dados iniciais
const rankingsIniciais = {
  pontos: [
    { userId: 'user-001', nome: 'Maria Silva', pontos: 4850, level: 42, badges: ['🔥 30 dias seguidos', '🏆 Top 10'] },
    { userId: 'user-002', nome: 'João Santos', pontos: 4230, level: 38, badges: ['🎯 Precisão 90%+'] },
    { userId: 'user-003', nome: 'Ana Oliveira', pontos: 3780, level: 35, badges: ['📚 100 simulados'] },
    { userId: 'user-004', nome: 'Pedro Costa', pontos: 3200, level: 30, badges: [] },
    { userId: 'user-005', nome: 'Carla Souza', pontos: 2890, level: 27, badges: ['🔥 15 dias seguidos'] },
  ],
  streaks: [
    { userId: 'user-001', nome: 'Maria Silva', streak: 45, melhorStreak: 62 },
    { userId: 'user-005', nome: 'Carla Souza', streak: 23, melhorStreak: 30 },
    { userId: 'user-002', nome: 'João Santos', streak: 18, melhorStreak: 25 },
  ],
  predicoes: [
    { userId: 'user-003', nome: 'Ana Oliveira', acertos: 89, total: 102, taxa: '87.3%' },
    { userId: 'user-001', nome: 'Maria Silva', acertos: 76, total: 95, taxa: '80.0%' },
    { userId: 'user-002', nome: 'João Santos', acertos: 65, total: 85, taxa: '76.5%' },
  ],
};

// Inicializar perfis
for (const entry of rankingsIniciais.pontos) {
  perfis.set(entry.userId, {
    ...entry,
    cargos: ['Analista Judiciário', 'Auditor Fiscal'],
    bancas: ['CESPE', 'FGV'],
    estudioDiario: `${Math.floor(2 + Math.random() * 4)}h`,
    membroDesde: '2024-06-15',
  });
}

// Inicializar desafios
const desafiosIniciais = [
  {
    id: 'desafio-01',
    titulo: '🔥 Desafio Semanal: Direito Constitucional',
    descricao: 'Acerte o máximo de predições sobre Dir. Constitucional nesta semana!',
    tipo: 'predicoes',
    banca: 'CESPE',
    materia: 'Direito Constitucional',
    dataInicio: '2025-01-13',
    dataFim: '2025-01-19',
    recompensa: '500 pontos + badge exclusiva',
    participantes: 234,
    maxParticipantes: null,
    status: 'ativo',
  },
  {
    id: 'desafio-02',
    titulo: '⚔️ Batalha de Bancas: CESPE vs FGV',
    descricao: 'Qual banca você domina mais? Participe e descubra!',
    tipo: 'batalha',
    banca: 'GERAL',
    materia: 'Geral',
    dataInicio: '2025-01-15',
    dataFim: '2025-01-22',
    recompensa: '1000 pontos + 7 dias Premium',
    participantes: 456,
    maxParticipantes: 1000,
    status: 'ativo',
  },
  {
    id: 'desafio-03',
    titulo: '📅 Desafio 30 Dias: Streak de Estudos',
    descricao: 'Estude todos os dias por 30 dias consecutivos!',
    tipo: 'streak',
    banca: 'GERAL',
    materia: 'Geral',
    dataInicio: '2025-01-01',
    dataFim: '2025-01-31',
    recompensa: 'Badge Lenda + 30 dias Premium',
    participantes: 892,
    maxParticipantes: null,
    status: 'ativo',
  },
];
for (const d of desafiosIniciais) {
  desafios.set(d.id, d);
  desafioParticipantes.set(d.id, new Set());
}

// Inicializar grupos
const gruposPorBanca = {
  CESPE: [
    { id: 'grp-01', nome: 'Estudos CESPE - Geral', membros: 1245, online: 89, topicos: ['Dir. Constitucional', 'Dir. Administrativo', 'Português'] },
    { id: 'grp-02', nome: 'CESPE - TRF', membros: 567, online: 34, topicos: ['Dir. Constitucional', 'Dir. Processual Civil'] },
  ],
  FGV: [
    { id: 'grp-03', nome: 'Estudos FGV - Geral', membros: 987, online: 67, topicos: ['Dir. Administrativo', 'Raciocínio Lógico'] },
  ],
  FCC: [
    { id: 'grp-04', nome: 'Estudos FCC - Geral', membros: 432, online: 23, topicos: ['Português', 'Informática'] },
  ],
};

/**
 * GET /api/community/ranking/:tipo
 * Rankings da comunidade.
 * Tipos: pontos, streaks, predicoes
 */
router.get('/ranking/:tipo', (req, res) => {
  try {
    const { tipo } = req.params;
    const limite = parseInt(req.query.limite, 10) || 10;

    const ranking = rankingsIniciais[tipo];

    if (!ranking) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Tipo de ranking inválido',
        codigo: 'TIPO_INVALIDO',
        tiposDisponiveis: Object.keys(rankingsIniciais),
      });
    }

    const rankingLimitado = ranking.slice(0, limite).map((entry, index) => ({
      posicao: index + 1,
      ...entry,
      medalha: index < 3 ? ['🥇', '🥈', '🥉'][index] : null,
    }));

    res.json({
      sucesso: true,
      mensagem: `Ranking: ${tipo}`,
      dados: rankingLimitado,
      tipo,
      total: ranking.length,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar ranking',
      codigo: 'ERRO_RANKING',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/community/perfil/:userId
 * Perfil do usuário na comunidade.
 */
router.get('/perfil/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    if (!perfis.has(userId)) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Perfil não encontrado',
        codigo: 'PERFIL_NAO_ENCONTRADO',
      });
    }

    const perfil = perfis.get(userId);

    // Enriquecer com dados de ranking
    const rankingPontos = rankingsIniciais.pontos.findIndex((p) => p.userId === userId) + 1;

    res.json({
      sucesso: true,
      dados: {
        ...perfil,
        posicaoRanking: rankingPontos > 0 ? rankingPontos : null,
        estatisticas: {
          predicoesHoje: Math.floor(Math.random() * 5),
          acertosSemana: Math.floor(15 + Math.random() * 20),
          estudoHoje: true,
          pontosHoje: Math.floor(50 + Math.random() * 150),
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar perfil',
      codigo: 'ERRO_PERFIL',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/community/desafios
 * Lista desafios ativos.
 * Query params: status (ativo, encerrado, todos)
 */
router.get('/desafios', (req, res) => {
  try {
    const { status = 'ativo' } = req.query;
    let lista = Array.from(desafios.values());

    if (status !== 'todos') {
      lista = lista.filter((d) => d.status === status);
    }

    lista.sort((a, b) => new Date(a.dataFim) - new Date(b.dataFim));

    res.json({
      sucesso: true,
      mensagem: 'Desafios disponíveis',
      dados: lista,
      total: lista.length,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar desafios',
      codigo: 'ERRO_DESAFIOS',
      detalhes: err.message,
    });
  }
});

/**
 * POST /api/community/desafio/:desafioId/participar
 * Inscreve o usuário em um desafio.
 * Body: { userId }
 */
router.post('/desafio/:desafioId/participar', (req, res) => {
  try {
    const { desafioId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campo obrigatório: userId',
        codigo: 'CAMPO_OBRIGATORIO',
      });
    }

    const desafio = desafios.get(desafioId);
    if (!desafio) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Desafio não encontrado',
        codigo: 'DESAFIO_NAO_ENCONTRADO',
      });
    }

    if (desafio.status !== 'ativo') {
      return res.status(400).json({
        sucesso: false,
        erro: 'Este desafio não está mais aceitando participantes',
        codigo: 'DESAFIO_ENCERRADO',
      });
    }

    if (desafio.maxParticipantes && desafio.participantes >= desafio.maxParticipantes) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Desafio com lotação máxima atingida',
        codigo: 'DESAFIO_LOTADO',
      });
    }

    const participantes = desafioParticipantes.get(desafioId);
    if (participantes.has(userId)) {
      return res.json({
        sucesso: true,
        mensagem: 'Você já está participando deste desafio! 💪',
        dados: { desafioId, userId, status: 'já inscrito' },
      });
    }

    participantes.add(userId);
    desafio.participantes += 1;
    desafios.set(desafioId, desafio);

    res.json({
      sucesso: true,
      mensagem: `🎯 Inscrição no desafio "${desafio.titulo}" realizada com sucesso!`,
      dados: {
        desafioId,
        userId,
        desafio: {
          titulo: desafio.titulo,
          recompensa: desafio.recompensa,
          dataFim: desafio.dataFim,
        },
        posicao: desafio.participantes,
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao participar do desafio',
      codigo: 'ERRO_PARTICIPAR_DESAFIO',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/community/grupos/:banca
 * Grupos de estudo por banca.
 */
router.get('/grupos/:banca', (req, res) => {
  try {
    const { banca } = req.params;
    const gruposBanca = gruposPorBanca[banca.toUpperCase()];

    if (!gruposBanca || gruposBanca.length === 0) {
      return res.json({
        sucesso: true,
        mensagem: `Nenhum grupo encontrado para ${banca}`,
        dados: [],
        banca,
      });
    }

    res.json({
      sucesso: true,
      mensagem: `Grupos de estudo: ${banca}`,
      dados: gruposBanca,
      banca,
      total: gruposBanca.length,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar grupos',
      codigo: 'ERRO_GRUPOS',
      detalhes: err.message,
    });
  }
});

export default router;
