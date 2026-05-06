/**
 * Rotas de Predições — Gabaritou v3
 * Endpoints para predição de tópicos, feedback (data flywheel) e predição de próxima prova.
 */
import { Router } from 'express';
import {
  getPredicoes,
  getTopTopicos,
  registrarFeedback,
  getFlywheelStats,
  gerarPredicaoProximaProva,
} from '../../services/predictions.js';
import { sanitizeInput } from '../../utils/helpers.js';
import { BANCAS } from '../../config/constants.js';

const router = Router();

// Whitelist of valid banca IDs for input sanitization
const VALID_BANCAS = BANCAS.map(b => b.id.toUpperCase());

/**
 * GET /api/predictions/:banca/:materia
 * Lista predições por banca e matéria.
 * Query param: limite (default 20)
 */
router.get('/:banca/:materia', async (req, res) => {
  try {
    const banca = sanitizeInput(req.params.banca).toUpperCase();
    const materia = sanitizeInput(req.params.materia);
    const limite = parseInt(req.query.limite, 10) || 20;

    // Input sanitization for banca
    if (!VALID_BANCAS.includes(banca)) {
      return res.status(400).json({
        sucesso: false,
        erro: `Banca inválida: "${banca}". Bancas disponíveis: ${VALID_BANCAS.join(', ')}`,
        codigo: 'BANCA_INVALIDA',
      });
    }

    const predicoes = await getPredicoes(banca, materia);
    const predicoesLimitadas = predicoes.slice(0, limite);

    res.json({
      sucesso: true,
      mensagem: `Predições para ${banca} - ${materia}`,
      dados: predicoesLimitadas,
      total: predicoesLimitadas.length,
      filtros: { banca, materia },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar predições',
      codigo: 'ERRO_PREDICOES',
    });
  }
});

/**
 * GET /api/predictions/top/:banca
 * Retorna os top N tópicos mais prováveis para uma banca.
 * Query params: materia, n (default 10)
 */
router.get('/top/:banca', async (req, res) => {
  try {
    const banca = sanitizeInput(req.params.banca).toUpperCase();
    const materia = sanitizeInput(req.query.materia || 'Direito Administrativo');
    const n = parseInt(req.query.n, 10) || 10;

    if (!VALID_BANCAS.includes(banca)) {
      return res.status(400).json({
        sucesso: false,
        erro: `Banca inválida: "${banca}". Bancas disponíveis: ${VALID_BANCAS.join(', ')}`,
        codigo: 'BANCA_INVALIDA',
      });
    }

    const topTopicos = await getTopTopicos(banca, materia, n);

    res.json({
      sucesso: true,
      mensagem: `Top ${n} tópicos para ${banca} - ${materia}`,
      dados: topTopicos,
      banca,
      materia,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar top tópicos',
      codigo: 'ERRO_TOP_TOPICOS',
    });
  }
});

/**
 * POST /api/predictions/feedback
 * Registra feedback do usuário — ENTRADA DO DATA FLYWHEEL.
 * Body: { topico_id, acertou, user_id, concurso? }
 */
router.post('/feedback', async (req, res) => {
  try {
    const { topico_id, acertou, user_id, concurso } = req.body;

    if (!topico_id || acertou === undefined || !user_id) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campos obrigatórios: topico_id, acertou, user_id',
        codigo: 'CAMPOS_OBRIGATORIOS',
      });
    }

    if (typeof acertou !== 'boolean') {
      return res.status(400).json({
        sucesso: false,
        erro: 'O campo "acertou" deve ser um booleano (true/false)',
        codigo: 'TIPO_INVALIDO',
      });
    }

    const feedback = await registrarFeedback(topico_id, acertou, {
      userId: sanitizeInput(String(user_id)),
      concurso: concurso ? sanitizeInput(String(concurso)) : null,
    });

    res.json({
      sucesso: true,
      mensagem: 'Feedback registrado com sucesso! Obrigado por contribuir.',
      dados: feedback,
      dataFlywheel: {
        status: 'ativo',
        mensagem: acertou
          ? 'Predição confirmada! Modelo ajustado positivamente.'
          : 'Predição não confirmada. Modelo será recalibrado.',
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao registrar feedback',
      codigo: 'ERRO_FEEDBACK',
    });
  }
});

/**
 * GET /api/predictions/flywheel/stats
 * Métricas do data flywheel (total de feedbacks, melhoria de precisão).
 */
router.get('/flywheel/stats', async (req, res) => {
  try {
    const stats = await getFlywheelStats();

    res.json({
      sucesso: true,
      mensagem: 'Estatísticas do Data Flywheel',
      dados: stats,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar estatísticas do flywheel',
      codigo: 'ERRO_FLYWHEEL_STATS',
    });
  }
});

/**
 * GET /api/predictions/proxima/:banca/:materia
 * Predição da próxima prova com score composto.
 */
router.get('/proxima/:banca/:materia', async (req, res) => {
  try {
    const banca = sanitizeInput(req.params.banca).toUpperCase();
    const materia = sanitizeInput(req.params.materia);

    const proximaProva = await gerarPredicaoProximaProva(banca, materia);

    res.json({
      sucesso: true,
      mensagem: `Predição para próxima prova: ${banca}`,
      dados: proximaProva,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao predizer próxima prova',
      codigo: 'ERRO_PROXIMA_PROVA',
    });
  }
});

export default router;
