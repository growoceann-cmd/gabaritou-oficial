/**
 * Rotas Virais - Gabaritou v2
 * Endpoints para Gabaritou Score, leaderboard, referrals e métricas virais.
 */
import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { authenticateAdmin } from '../../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = Router();

// Armazenamento em memória (substituir por banco de dados)
const userScores = new Map();
const referrals = new Map();
const leaderboards = new Map();

// Dados iniciais de demonstração
const scoresIniciais = [
  { userId: 'user-001', score: 2850, nivel: 'Lenda', acertos: 142, predicoes: 165 },
  { userId: 'user-002', score: 2340, nivel: 'Mestre', acertos: 118, predicoes: 140 },
  { userId: 'user-003', score: 1980, nivel: 'Expert', acertos: 98, predicoes: 120 },
  { userId: 'user-004', score: 1650, nivel: 'Avançado', acertos: 82, predicoes: 100 },
  { userId: 'user-005', score: 1200, nivel: 'Intermediário', acertos: 60, predicoes: 75 },
];
for (const s of scoresIniciais) userScores.set(s.userId, s);

leaderboards.set('concurso-geral', scoresIniciais);

/**
 * GET /api/viral/score/:userId
 * Obtém o Gabaritou Score do usuário para compartilhamento.
 */
router.get('/score/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    if (!userScores.has(userId)) {
      // Criar score padrão para novo usuário
      userScores.set(userId, {
        userId,
        score: 0,
        nivel: 'Iniciante',
        acertos: 0,
        predicoes: 0,
      });
    }

    const scoreData = userScores.get(userId);

    // Calcular nível
    const nivel = calcularNivel(scoreData.score);

    const responseData = {
      ...scoreData,
      nivel,
      mensagemCompartilhamento:
        `🏆 Meu Gabaritou Score: ${scoreData.score} pontos!\n` +
        `📋 Nível: ${nivel}\n` +
        `✅ ${scoreData.acertos} acertos em ${scoreData.predicoes} predições\n\n` +
        `📊 Teste também: https://t.me/gabaritou_bot`,
      badge: getEmojiNivel(nivel),
    };

    res.json({
      sucesso: true,
      dados: responseData,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar score',
      codigo: 'ERRO_SCORE',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/viral/leaderboard/:concurso
 * Ranking para um concurso específico.
 * Query params: limite (default 10)
 */
router.get('/leaderboard/:concurso', (req, res) => {
  try {
    const { concurso } = req.params;
    const limite = parseInt(req.query.limite, 10) || 10;

    const ranking = leaderboards.get(`concurso-${concurso}`) ||
      leaderboards.get('concurso-geral') || [];

    const rankingLimitado = ranking
      .slice(0, limite)
      .map((entry, index) => ({
        posicao: index + 1,
        userId: entry.userId,
        score: entry.score,
        nivel: calcularNivel(entry.score),
        medalha: index < 3 ? ['🥇', '🥈', '🥉'][index] : null,
      }));

    res.json({
      sucesso: true,
      mensagem: `Ranking: ${concurso}`,
      dados: rankingLimitado,
      totalParticipantes: ranking.length,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar ranking',
      codigo: 'ERRO_LEADERBOARD',
      detalhes: err.message,
    });
  }
});

/**
 * POST /api/viral/referral
 * Processa um convite/referral.
 * Body: { userId, referrerId }
 */
router.post('/referral', (req, res) => {
  try {
    const { userId, referrerId } = req.body;

    if (!userId || !referrerId) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campos obrigatórios: userId, referrerId',
        codigo: 'CAMPOS_OBRIGATORIOS',
      });
    }

    if (userId === referrerId) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Usuário não pode indicar a si mesmo',
        codigo: 'AUTO_REFERRAL',
      });
    }

    // Verificar se já existe
    const existingReferral = referrals.get(userId);
    if (existingReferral) {
      return res.json({
        sucesso: true,
        mensagem: 'Convite já registrado',
        dados: existingReferral,
      });
    }

    const referral = {
      id: `ref-${Date.now()}`,
      userId,
      referrerId,
      dataRegistro: new Date().toISOString(),
      status: 'ativo',
      recompensas: {
        indicado: { tipo: '3_dias_premium', status: 'pendente_ativacao' },
        indicador: { tipo: 'pontos_bonus', quantidade: 500, status: 'creditado' },
      },
    };

    referrals.set(userId, referral);

    // Creditar pontos ao indicador
    if (userScores.has(referrerId)) {
      const referrerScore = userScores.get(referrerId);
      referrerScore.score += referral.recompensas.indicador.quantidade;
      userScores.set(referrerId, referrerScore);
    }

    res.status(201).json({
      sucesso: true,
      mensagem: 'Convite processado com sucesso!',
      dados: referral,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao processar convite',
      codigo: 'ERRO_REFERRAL',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/viral/referral/status/:userId
 * Verifica o status e recompensas de referrals de um usuário.
 */
router.get('/referral/status/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    // Contar referrals feitos pelo usuário
    const referralsFeitos = Array.from(referrals.values())
      .filter((r) => r.referrerId === userId);

    const totalIndicacoes = referralsFeitos.length;
    const indicacoesAtivas = referralsFeitos.filter((r) => r.status === 'ativo').length;

    const niveisRecompensa = [
      { minIndicacoes: 3, recompensa: '7 dias premium', atingido: totalIndicacoes >= 3 },
      { minIndicacoes: 10, recompensa: '30 dias premium', atingido: totalIndicacoes >= 10 },
      { minIndicacoes: 25, recompensa: '1 ano premium + Gabaritou Pro', atingido: totalIndicacoes >= 25 },
    ];

    const linkReferral = `https://t.me/gabaritou_bot?start=${userId}`;

    res.json({
      sucesso: true,
      dados: {
        userId,
        totalIndicacoes,
        indicacoesAtivas,
        pontosGanhos: totalIndicacoes * 500,
        linkReferral,
        niveisRecompensa,
        proximaRecompensa: niveisRecompensa.find((n) => !n.atingido)?.recompensa || 'Todas atingidas! 🎉',
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar status de convites',
      codigo: 'ERRO_REFERRAL_STATUS',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/viral/metrics
 * Métricas virais do sistema (ADMIN ONLY).
 */
router.get('/metrics', authenticateAdmin, (req, res) => {
  try {
    const totalUsuarios = userScores.size;
    const totalReferrals = referrals.size;
    const mediaScore = totalUsuarios > 0
      ? Math.round(Array.from(userScores.values()).reduce((a, b) => a + b.score, 0) / totalUsuarios)
      : 0;
    const usuariosAtivos = Math.floor(totalUsuarios * 0.65);
    const viralCoefficient = totalUsuarios > 0
      ? ((totalReferrals / totalUsuarios) * 1.2).toFixed(2)
      : '0.00';

    const metrics = {
      usuarios: {
        total: totalUsuarios,
        ativos: usuariosAtivos,
        novosMes: Math.floor(totalUsuarios * 0.15),
      },
      engajamento: {
        mediaScore,
        mediaPredicoesPorUsuario: 12.5,
        taxaRetencao: '68.3%',
        sessoesPorDia: Math.floor(totalUsuarios * 0.4),
      },
      viralidade: {
        totalReferrals,
        viralCoefficient: parseFloat(viralCoefficient),
        indicadoresAtivos: Math.floor(totalUsuarios * 0.25),
        compartilhamentos: Math.floor(totalUsuarios * 1.8),
      },
      crescimento: {
        crescimentoSemana: '+8.2%',
        crescimentoMes: '+23.5%',
        projecaoTrimestral: '+67%',
      },
    };

    res.json({
      sucesso: true,
      mensagem: 'Métricas virais do sistema',
      dados: metrics,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar métricas',
      codigo: 'ERRO_METRICAS_VIRAIS',
      detalhes: err.message,
    });
  }
});

// ─── Funções auxiliares ──────────────────────────────────────────────

function calcularNivel(score) {
  if (score >= 3000) return 'Lenda';
  if (score >= 2000) return 'Mestre';
  if (score >= 1500) return 'Expert';
  if (score >= 1000) return 'Avançado';
  if (score >= 500) return 'Intermediário';
  if (score >= 100) return 'Iniciante';
  return 'Novato';
}

function getEmojiNivel(nivel) {
  const emojis = {
    'Lenda': '👑',
    'Mestre': '🏆',
    'Expert': '⭐',
    'Avançado': '🔥',
    'Intermediário': '📈',
    'Iniciante': '🌱',
    'Novato': '🎯',
  };
  return emojis[nivel] || '🎯';
}

export default router;
