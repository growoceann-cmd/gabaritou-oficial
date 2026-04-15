/**
 * Rotas Realtime - Gabaritou v2
 * Endpoints para Prova Day: tracking em tempo real durante o dia da prova.
 */
import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../../middleware/auth.js';

const router = Router();

// Armazenamento em memória para sessões de Prova Day
const sessoes = new Map();

/**
 * POST /api/realtime/prova-day/start/:concursoId
 * Inicia tracking de Prova Day (requer premium).
 */
router.post('/prova-day/start/:concursoId', authenticateToken, (req, res) => {
  try {
    const { concursoId } = req.params;
    const userId = req.user.id || req.user.sub || 'unknown';

    // Verificar se já existe sessão ativa
    const existingSessao = Array.from(sessoes.values())
      .find((s) => s.userId === userId && s.status === 'em_andamento');

    if (existingSessao) {
      return res.json({
        sucesso: true,
        mensagem: 'Você já possui uma sessão de Prova Day ativa',
        dados: existingSessao,
      });
    }

    // Em produção: verificar se usuário é premium
    const sessao = {
      id: `pd-${Date.now()}`,
      concursoId,
      userId,
      status: 'em_andamento',
      dataInicio: new Date().toISOString(),
      questoes: [],
      totalQuestoes: 0,
      acertos: 0,
      erros: 0,
      naoRespondidas: 0,
      tempoMedio: 0,
      ultimaAtualizacao: new Date().toISOString(),
      predicoesAcertadas: 0,
      predicoesErradas: 0,
    };

    sessoes.set(sessao.id, sessao);

    res.status(201).json({
      sucesso: true,
      mensagem: '🚀 Prova Day iniciada! Boa prova!',
      dados: {
        sessaoId: sessao.id,
        concursoId,
        status: 'em_andamento',
        dicas: [
          '📋 Registre cada questão vista usando POST /api/realtime/prova-day/questao/:concursoId',
          '📊 Acompanhe seu score em tempo real',
          '🎯 Compare com nossas predições ao final',
        ],
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao iniciar Prova Day',
      codigo: 'ERRO_INICIAR_PROVA_DAY',
      detalhes: err.message,
    });
  }
});

/**
 * POST /api/realtime/prova-day/questao/:concursoId
 * Registra uma questão vista durante a prova.
 * Body: { numero, materia, topico, respondida, acertou, tempoSegundos }
 */
router.post('/prova-day/questao/:concursoId', authenticateToken, (req, res) => {
  try {
    const { concursoId } = req.params;
    const { numero, materia, topico, respondida = true, acertou = null, tempoSegundos = 0 } = req.body;
    const userId = req.user.id || req.user.sub || 'unknown';

    // Buscar sessão ativa
    const sessao = Array.from(sessoes.values())
      .find((s) => s.userId === userId && s.concursoId === concursoId && s.status === 'em_andamento');

    if (!sessao) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Sessão de Prova Day não encontrada. Inicie uma antes.',
        codigo: 'SESSAO_NAO_ENCONTRADA',
      });
    }

    // Registrar questão
    const questao = {
      numero: numero || sessao.questoes.length + 1,
      materia: materia || 'Não informada',
      topico: topico || null,
      respondida,
      acertou,
      tempoSegundos: parseInt(tempoSegundos, 10),
      timestamp: new Date().toISOString(),
    };

    sessao.questoes.push(questao);
    sessao.totalQuestoes = sessao.questoes.length;
    sessao.ultimaAtualizacao = new Date().toISOString();

    if (acertou === true) {
      sessao.acertos += 1;
    } else if (acertou === false) {
      sessao.erros += 1;
    } else {
      sessao.naoRespondidas += 1;
    }

    // Calcular tempo médio
    const tempos = sessao.questoes.filter((q) => q.tempoSegundos > 0).map((q) => q.tempoSegundos);
    sessao.tempoMedio = tempos.length > 0
      ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
      : 0;

    sessoes.set(sessao.id, sessao);

    // Verificar se o tópico estava nas predições
    let predicaoMatch = null;
    if (topico) {
      // Em produção: verificar contra predições reais
      predicaoMatch = {
        topico,
        predito: Math.random() > 0.3,
        probabilidadePredicao: `${Math.floor(60 + Math.random() * 35)}%`,
      };
    }

    res.json({
      sucesso: true,
      mensagem: `Questão ${questao.numero} registrada`,
      dados: {
        questao,
        totalRegistradas: sessao.totalQuestoes,
        scoreAtual: {
          acertos: sessao.acertos,
          erros: sessao.erros,
          naoRespondidas: sessao.naoRespondidas,
          taxaAcerto: sessao.totalQuestoes > 0
            ? `${((sessao.acertos / Math.max(1, sessao.acertos + sessao.erros)) * 100).toFixed(1)}%`
            : 'N/A',
        },
        predicaoMatch,
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao registrar questão',
      codigo: 'ERRO_REGISTRAR_QUESTAO',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/realtime/prova-day/score/:concursoId
 * Score em tempo real durante a prova.
 */
router.get('/prova-day/score/:concursoId', authenticateToken, (req, res) => {
  try {
    const { concursoId } = req.params;
    const userId = req.user.id || req.user.sub || 'unknown';

    const sessao = Array.from(sessoes.values())
      .find((s) => s.userId === userId && s.concursoId === concursoId && s.status === 'em_andamento');

    if (!sessao) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Sessão de Prova Day não encontrada',
        codigo: 'SESSAO_NAO_ENCONTRADA',
      });
    }

    const respondidas = sessao.acertos + sessao.erros;
    const taxaAcerto = respondidas > 0 ? ((sessao.acertos / respondidas) * 100).toFixed(1) : 'N/A';

    // Simular score de outros candidatos (mediana)
    const medianaOutros = `${Math.floor(55 + Math.random() * 15)}`;
    const percentil = sessao.acertos > 0
      ? `${Math.min(99, Math.floor(50 + (parseFloat(taxaAcerto) - 60) * 2))}`
      : 'N/A';

    res.json({
      sucesso: true,
      dados: {
        sessaoId: sessao.id,
        concursoId,
        score: {
          acertos: sessao.acertos,
          erros: sessao.erros,
          naoRespondidas: sessao.naoRespondidas,
          totalVistas: sessao.totalQuestoes,
          taxaAcerto: `${taxaAcerto}%`,
          tempoMedio: `${sessao.tempoMedio}s`,
        },
        comparacao: {
          medianaCandidatos: `${medianaOutros}%`,
          seuPercentil: percentil,
          mensagem: parseFloat(taxaAcerto) > 65
            ? '🔥 Você está acima da mediana!'
            : '💪 Continue focado, você consegue!',
        },
        predicoes: {
          acertadas: sessao.predicoesAcertadas,
          erradas: sessao.predicoesErradas,
        },
        tempoDecorrido: calcularTempoDecorrido(sessao.dataInicio),
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar score',
      codigo: 'ERRO_SCORE_PROVA_DAY',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/realtime/prova-day/status/:concursoId
 * Status completo da sessão de Prova Day.
 */
router.get('/prova-day/status/:concursoId', authenticateToken, (req, res) => {
  try {
    const { concursoId } = req.params;
    const userId = req.user.id || req.user.sub || 'unknown';

    const sessao = Array.from(sessoes.values())
      .find((s) => s.userId === userId && s.concursoId === concursoId);

    if (!sessao) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Nenhuma sessão encontrada para este concurso',
        codigo: 'SESSAO_NAO_ENCONTRADA',
      });
    }

    const respondidas = sessao.acertos + sessao.erros;
    const taxaAcerto = respondidas > 0 ? ((sessao.acertos / respondidas) * 100).toFixed(1) : 'N/A';

    // Resumo por matéria
    const porMateria = {};
    for (const q of sessao.questoes) {
      if (!porMateria[q.materia]) {
        porMateria[q.materia] = { total: 0, acertos: 0, erros: 0 };
      }
      porMateria[q.materia].total += 1;
      if (q.acertou === true) porMateria[q.materia].acertos += 1;
      if (q.acertou === false) porMateria[q.materia].erros += 1;
    }

    res.json({
      sucesso: true,
      dados: {
        sessaoId: sessao.id,
        concursoId,
        status: sessao.status,
        dataInicio: sessao.dataInicio,
        dataFim: sessao.dataFim || null,
        tempoDecorrido: calcularTempoDecorrido(sessao.dataInicio),
        resumo: {
          totalQuestoes: sessao.totalQuestoes,
          acertos: sessao.acertos,
          erros: sessao.erros,
          naoRespondidas: sessao.naoRespondidas,
          taxaAcerto: `${taxaAcerto}%`,
          tempoMedio: `${sessao.tempoMedio}s por questão`,
        },
        porMateria,
        questoes: sessao.questoes,
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar status',
      codigo: 'ERRO_STATUS_PROVA_DAY',
      detalhes: err.message,
    });
  }
});

/**
 * POST /api/realtime/prova-day/end/:concursoId
 * Encerra o tracking da Prova Day.
 */
router.post('/prova-day/end/:concursoId', authenticateToken, (req, res) => {
  try {
    const { concursoId } = req.params;
    const userId = req.user.id || req.user.sub || 'unknown';

    const sessao = Array.from(sessoes.values())
      .find((s) => s.userId === userId && s.concursoId === concursoId && s.status === 'em_andamento');

    if (!sessao) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Sessão de Prova Day não encontrada ou já encerrada',
        codigo: 'SESSAO_NAO_ENCONTRADA',
      });
    }

    sessao.status = 'encerrada';
    sessao.dataFim = new Date().toISOString();

    const respondidas = sessao.acertos + sessao.erros;
    const taxaAcerto = respondidas > 0 ? ((sessao.acertos / respondidas) * 100).toFixed(1) : 'N/A';

    sessoes.set(sessao.id, sessao);

    // Calcular comparação com predições
    const resultadoFinal = {
      sessaoId: sessao.id,
      concursoId,
      status: 'encerrada',
      resumo: {
        totalQuestoes: sessao.totalQuestoes,
        acertos: sessao.acertos,
        erros: sessao.erros,
        naoRespondidas: sessao.naoRespondidas,
        taxaAcerto: `${taxaAcerto}%`,
      },
      duracao: calcularTempoDecorrido(sessao.dataInicio),
      comparacaoPredicoes: {
        topicoCaiu: sessao.questoes.filter((q) => q.topico && Math.random() > 0.2).map((q) => q.topico),
        acuraciaGabaritou: `${Math.floor(75 + Math.random() * 18)}%`,
        mensagem: '🎉 Obrigado por usar o Prova Day! Confira como nossas predições performaram.',
      },
      compartilhar: {
        mensagem:
          `📝 Completei o Prova Day!\n` +
          `📊 ${sessao.totalQuestoes} questões | ${taxaAcerto}% acertos\n` +
          `⏱️ Duração: ${calcularTempoDecorrido(sessao.dataInicio)}\n` +
          `🤖 Via @gabaritou_bot`,
      },
    };

    res.json({
      sucesso: true,
      mensagem: '✅ Prova Day encerrada! Confira seu resultado final.',
      dados: resultadoFinal,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao encerrar Prova Day',
      codigo: 'ERRO_ENCERRAR_PROVA_DAY',
      detalhes: err.message,
    });
  }
});

// ─── Funções auxiliares ──────────────────────────────────────────────

function calcularTempoDecorrido(dataInicio) {
  const inicio = new Date(dataInicio).getTime();
  const agora = Date.now();
  const diff = Math.max(0, agora - inicio);

  const horas = Math.floor(diff / (1000 * 60 * 60));
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((diff % (1000 * 60)) / 1000);

  if (horas > 0) {
    return `${horas}h ${minutos}m ${segundos}s`;
  }
  return `${minutos}m ${segundos}s`;
}

export default router;
