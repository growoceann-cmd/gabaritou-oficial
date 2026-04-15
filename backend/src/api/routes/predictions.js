/**
 * Rotas de Predições - Gabaritou v2
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

const router = Router();

/**
 * GET /api/predictions
 * Lista predições por banca e matéria.
 * Query params: banca, materia, limite (default 20)
 */
router.get('/', async (req, res) => {
  try {
    const { banca, materia, limite = 20 } = req.query;

    if (!banca && !materia) {
      // Retornar predições gerais mais populares
      const bancasPopulares = ['CESPE', 'FGV', 'FCC', 'VUNESP'];
      const resultado = [];

      for (const b of bancasPopulares) {
        const preds = await getTopTopicos(b, 'Direito Constitucional', 3);
        resultado.push({
          banca: b,
          materia: 'Direito Constitucional',
          topicos: preds,
        });
      }

      return res.json({
        sucesso: true,
        mensagem: 'Predições gerais das bancas mais populares',
        dados: resultado,
        total: resultado.length,
      });
    }

    const predicoes = await getPredicoes(
      banca || 'CESPE',
      materia || 'Direito Constitucional'
    );

    const predicoesLimitadas = predicoes.slice(0, parseInt(limite, 10));

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
      erro: 'Erro ao gerar predições',
      codigo: 'ERRO_PREDICOES',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/predictions/top/:banca/:materia
 * Retorna os top N tópicos mais prováveis.
 * Query param: n (default 10)
 */
router.get('/top/:banca/:materia', async (req, res) => {
  try {
    const { banca, materia } = req.params;
    const n = parseInt(req.query.n, 10) || 10;

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
      detalhes: err.message,
    });
  }
});

/**
 * POST /api/predictions/feedback
 * Registra feedback do usuário - ENTRADA DO DATA FLYWHEEL.
 * Body: { topico_id, acertou, user_id }
 */
router.post('/feedback', async (req, res) => {
  try {
    const { topico_id, acertou, user_id } = req.body;

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

    const feedback = registrarFeedback(topico_id, acertou, { userId: user_id });

    res.json({
      sucesso: true,
      mensagem: 'Feedback registrado com sucesso! Obrigado por contribuir.',
      dados: feedback,
      dataFlywheel: {
        status: 'ativo',
        mensagem: acertou
          ? '🎉 Predição confirmada! Modelo ajustado positivamente.'
          : '📝 Predição não confirmada. Modelo será recalibrado.',
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao registrar feedback',
      codigo: 'ERRO_FEEDBACK',
      detalhes: err.message,
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
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/predictions/proxima/:banca/:materia
 * Predição da próxima prova.
 */
router.get('/proxima/:banca/:materia', async (req, res) => {
  try {
    const { banca, materia } = req.params;
    const proximaProva = gerarPredicaoProximaProva(banca, materia);

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
      detalhes: err.message,
    });
  }
});

export default router;
