/**
 * Rotas AI Tutor — Gabaritou v3 (BeConfident Model)
 * Endpoints para progresso do usuário, resumo semanal e geração de questões.
 */
import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { query, queryOne } from '../../db/connection.js';
import { sanitizeInput, isValidUUID } from '../../utils/helpers.js';
import logger from '../../utils/logger.js';

const log = logger.child('AITutorRoutes');

const router = Router();

/**
 * GET /api/ai-tutor/progress/:userId
 * Progresso de estudo do usuário com dados do BeConfident.
 */
router.get('/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidUUID(userId)) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Formato de userId inválido',
        codigo: 'USER_ID_INVALIDO',
      });
    }

    // Busca dados do usuário
    const user = await queryOne(
      `SELECT id, name, plan, adaptive_level, total_micro_sessions,
              total_interceptions, sequencia, pontos, total_predicoes
       FROM users WHERE id = $1`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Usuário não encontrado',
        codigo: 'USUARIO_NAO_ENCONTRADO',
      });
    }

    // Busca progresso por matéria
    const progressByMateria = await query(
      `SELECT materia, banca,
              SUM(acertos) as acertos,
              SUM(erros) as erros,
              ROUND(AVG(taxa_acerto)::numeric, 1) as taxa_acerto,
              COUNT(*) as sessoes
       FROM study_progress
       WHERE user_id = $1
       GROUP BY materia, banca
       ORDER BY taxa_acerto ASC`,
      [userId]
    );

    // Busca últimas micro-sessões
    const recentSessions = await query(
      `SELECT id, topico, banca, dificuldade, status, acertou, tempo_resposta, created_at
       FROM micro_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    const totalAcertos = progressByMateria.reduce((sum, p) => sum + parseInt(p.acertos || 0, 10), 0);
    const totalErros = progressByMateria.reduce((sum, p) => sum + parseInt(p.erros || 0, 10), 0);
    const totalQuestoes = totalAcertos + totalErros;
    const taxaGeral = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0;

    res.json({
      sucesso: true,
      mensagem: 'Progresso de estudo',
      dados: {
        usuario: {
          id: user.id,
          nome: user.name,
          plano: user.plan,
          nivel_adaptativo: user.adaptive_level || 1,
          sequencia: user.sequencia || 0,
          pontos: user.pontos || 0,
        },
        geral: {
          total_questoes: totalQuestoes,
          acertos: totalAcertos,
          erros: totalErros,
          taxa_acerto: taxaGeral,
          micro_sessions_total: user.total_micro_sessions || 0,
          total_interceptions: user.total_interceptions || 0,
        },
        por_materia: progressByMateria,
        sessoes_recentes: recentSessions,
      },
    });
  } catch (err) {
    log.error('Erro ao buscar progresso', { userId: req.params.userId, erro: err.message });
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar progresso',
      codigo: 'ERRO_PROGRESSO',
    });
  }
});

/**
 * GET /api/ai-tutor/weekly/:userId
 * Resumo semanal de atividade do usuário.
 */
router.get('/weekly/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidUUID(userId)) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Formato de userId inválido',
        codigo: 'USER_ID_INVALIDO',
      });
    }

    // Micro-sessões da semana
    const weeklySessions = await query(
      `SELECT DATE(created_at) as dia,
              COUNT(*) as sessoes,
              COUNT(*) FILTER (WHERE acertou = true) as acertos,
              COUNT(*) FILTER (WHERE acertou = false) as erros,
              ROUND(AVG(tempo_resposta)::numeric, 1) as tempo_medio
       FROM micro_sessions
       WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY dia`,
      [userId]
    );

    // Intercepções da semana
    const weeklyInterceptions = await queryOne(
      `SELECT COUNT(*) as total,
              COUNT(*) FILTER (WHERE status = 'respondida') as respondidas
       FROM micro_sessions
       WHERE user_id = $1
         AND created_at >= NOW() - INTERVAL '7 days'
         AND status != 'expirada'`,
      [userId]
    );

    const totalSessoes = weeklySessions.reduce((sum, s) => sum + parseInt(s.sessoes || 0, 10), 0);
    const totalAcertos = weeklySessions.reduce((sum, s) => sum + parseInt(s.acertos || 0, 10), 0);
    const taxaAcerto = totalSessoes > 0 ? Math.round((totalAcertos / totalSessoes) * 100) : 0;

    res.json({
      sucesso: true,
      mensagem: 'Resumo semanal',
      dados: {
        periodo: 'Últimos 7 dias',
        total_sessoes: totalSessoes,
        total_acertos: totalAcertos,
        taxa_acerto: taxaAcerto,
        total_interceptions: parseInt(weeklyInterceptions?.total || 0, 10),
        interceptions_respondidas: parseInt(weeklyInterceptions?.respondidas || 0, 10),
        por_dia: weeklySessions,
      },
    });
  } catch (err) {
    log.error('Erro ao buscar resumo semanal', { userId: req.params.userId, erro: err.message });
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar resumo semanal',
      codigo: 'ERRO_WEEKLY',
    });
  }
});

/**
 * POST /api/ai-tutor/generate
 * Gera uma questão adaptativa para o usuário.
 * Body: { user_id, banca, materia, dificuldade? }
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { user_id, banca, materia, dificuldade } = req.body;

    if (!user_id || !banca || !materia) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campos obrigatórios: user_id, banca, materia',
        codigo: 'CAMPOS_OBRIGATORIOS',
      });
    }

    if (!isValidUUID(user_id)) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Formato de user_id inválido',
        codigo: 'USER_ID_INVALIDO',
      });
    }

    // Sanitize inputs
    const safeBanca = sanitizeInput(banca);
    const safeMateria = sanitizeInput(materia);

    // Busca nível adaptativo do usuário para definir dificuldade
    const user = await queryOne(
      `SELECT adaptive_level, fatigue_score FROM users WHERE id = $1`,
      [user_id]
    );

    const userLevel = user?.adaptive_level || 1;
    const fatigueScore = user?.fatigue_score || 0;

    // Determina dificuldade: usa a informada ou calcula pelo nível
    const levelDificuldadeMap = {
      1: 'facil', 2: 'facil', 3: 'medio', 4: 'medio', 5: 'dificil', 6: 'dificil',
    };
    const selectedDifficulty = dificuldade || levelDificuldadeMap[userLevel] || 'medio';

    // TODO: Integração real com o RAG/generate.js para gerar questão via LLM
    // Por enquanto, retorna uma questão mockada
    const questao = {
      id: `qs_${Date.now()}`,
      banca: safeBanca,
      materia: safeMateria,
      dificuldade: selectedDifficulty,
      topico: 'Tópico adaptativo (geração via LLM pendente)',
      enunciado: `Questão gerada para ${safeMateria} — banca ${safeBanca}. Integração com LLM em desenvolvimento.`,
      alternativas: {
        A: 'Alternativa A — conceito correto',
        B: 'Alternativa B — conceito incorreto',
        C: 'Alternativa C — conceito parcial',
        D: 'Alternativa D — conceito incorreto',
        E: 'Alternativa E — conceito correto',
      },
      gabarito: 'A',
      explicacao: 'Explicação detalhada da resposta correta com fundamentação legal.',
      nivel_usuario: userLevel,
      fadiga_atual: fatigueScore,
    };

    // Registra a micro-sessão
    await query(
      `INSERT INTO micro_sessions
        (id, user_id, topico, banca, questao, gabarito, dificuldade, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendente')`,
      [
        questao.id,
        user_id,
        questao.topico,
        safeBanca,
        JSON.stringify(questao),
        questao.gabarito,
        selectedDifficulty,
      ]
    );

    res.status(201).json({
      sucesso: true,
      mensagem: `Questão gerada para ${safeMateria} (nível ${userLevel}, ${selectedDifficulty})`,
      dados: questao,
    });
  } catch (err) {
    log.error('Erro ao gerar questão', { erro: err.message });
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao gerar questão',
      codigo: 'ERRO_GERAR_QUESTAO',
    });
  }
});

export default router;
