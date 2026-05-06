/**
 * Serviço de Predições — Motor do Data Flywheel (v3).
 *
 * O Data Flywheel funciona assim:
 * 1. Geramos predições baseadas em dados históricos
 * 2. Usários acessam as predições e estudam os tópicos
 * 3. Após a prova, recebemos feedback (acertou/não acertou)
 * 4. O feedback atualiza as probabilidades automaticamente
 * 5. Predições mais precisas → mais confiança → mais feedback → ciclo virtuoso
 *
 * v3: Carrega dados do PostgreSQL em vez de arquivos JSON.
 * Mantém o algoritmo de scoring (probabilidade + recencia + peso_historico + feedback).
 */

import { query, queryOne } from '../db/connection.js';
import { cached, invalidateByPrefix } from '../utils/cache.js';
import { randomCode } from '../utils/helpers.js';
import logger from '../utils/logger.js';
import quantumService from './quantum.js';

const log = logger.child('PredictionsService');

// ============================================================
// Leitura de dados (PostgreSQL)
// ============================================================

/**
 * Carrega predições de uma banca e matéria do banco de dados.
 * @param {string} banca - Nome da banca (ex: 'CESPE', 'FGV')
 * @param {string} materia - Nome da matéria (ex: 'Direito Administrativo')
 * @returns {Promise<Object[]>} Lista de predições
 */
async function loadPredictions(banca, materia) {
  const cacheKey = `predictions:${banca}:${materia}`;

  return cached(cacheKey, async () => {
    const rows = await query(
      `SELECT * FROM predictions
       WHERE banca = $1 AND materia = $2
       ORDER BY probabilidade DESC, peso_historico DESC`,
      [banca, materia]
    );

    log.debug('Predições carregadas do banco', {
      banca,
      materia,
      total: rows.length,
    });

    return rows;
  }, 600); // 10 min cache
}

/**
 * Lista todas as combinações banca+materia disponíveis.
 * @returns {Promise<Array<{banca: string, materia: string, total: number}>>}
 */
export async function getAvailablePredictions() {
  return cached('predictions:available', async () => {
    const rows = await query(
      `SELECT banca, materia, COUNT(*) as total
       FROM predictions
       GROUP BY banca, materia
       ORDER BY banca, materia`
    );

    return rows;
  }, 3600);
}

// ============================================================
// Predições
// ============================================================

/**
 * Obtém predições para uma banca e matéria específicas.
 * @param {string} banca - Nome da banca (ex: 'CESPE', 'FGV')
 * @param {string} materia - Nome da matéria (ex: 'DirAdmin', 'Raciocínio Lógico')
 * @returns {Promise<Object[]>} Lista de predições ordenadas por score composto
 */
export async function getPredicoes(banca, materia) {
  if (!banca || !materia) {
    log.warn('Parâmetros banca/materia são obrigatórios', { banca, materia });
    return [];
  }

  const predictions = await loadPredictions(banca, materia);

  // Ordena por score composto: probabilidade * peso recencia
  const sorted = [...predictions].sort((a, b) => {
    const scoreA = (a.probabilidade || 0) * (1 + (a.recencia === 0 ? 0.5 : 0));
    const scoreB = (b.probabilidade || 0) * (1 + (b.recencia === 0 ? 0.5 : 0));
    return scoreB - scoreA;
  });

  log.info('Predições retornadas', {
    banca,
    materia,
    total: sorted.length,
    topProbabilidade: sorted[0]?.probabilidade || 0,
  });

  return sorted;
}

/**
 * Retorna os N tópicos com maior probabilidade.
 * @param {string} banca
 * @param {string} materia
 * @param {number} [limite=5] - Número máximo de tópicos
 * @returns {Promise<Object[]>}
 */
export async function getTopTopicos(banca, materia, limite = 5) {
  const predicoes = await getPredicoes(banca, materia);
  return predicoes.slice(0, limite);
}

/**
 * Gera uma predição para a próxima prova de uma banca/matéria.
 * Combina probabilidade, recência e feedback dos usuários.
 * @param {string} banca
 * @param {string} materia
 * @returns {Promise<Object>} Predição gerada com score composto e análise
 */
export async function gerarPredicaoProximaProva(banca, materia) {
  const predicoes = await getPredicoes(banca, materia);

  if (predicoes.length === 0) {
    return {
      banca,
      materia,
      topicos: [],
      resumo: `Nenhuma predição disponível para ${banca} - ${materia}`,
      confianca: 0,
      data_geracao: new Date().toISOString(),
    };
  }

  // Calcula score composto para cada tópico
  const scored = predicoes.map((pred) => {
    let score = pred.probabilidade || 0;

    // Bônus por recência (recentemente cobrado = maior chance de repetir)
    if (pred.recencia !== undefined && pred.recencia !== null) {
      if (pred.recencia === 0) {
        score += 10; // cobrado na última prova
      } else if (pred.recencia <= 180) {
        score += 5; // cobrado nos últimos 6 meses
      } else if (pred.recencia <= 365) {
        score += 2; // cobrado no último ano
      }
    }

    // Bônus por peso histórico
    if (pred.peso_historico) {
      score += pred.peso_historico * 2;
    }

    // Ajuste por feedback dos usuários
    if (pred.total_feedbacks > 0) {
      const taxaAcerto = pred.acertos_feedbacks / pred.total_feedbacks;
      if (taxaAcerto >= 0.7) {
        score += 8;
      } else if (taxaAcerto >= 0.5) {
        score += 4;
      } else if (taxaAcerto < 0.3) {
        score -= 5;
      }
    }

    // Normaliza o score para 0-100
    const scoreNormalizado = Math.min(100, Math.max(0, Math.round(score)));

    return {
      ...pred,
      score_composto: scoreNormalizado,
    };
  });

  // Ordena pelo score composto
  scored.sort((a, b) => b.score_composto - a.score_composto);

  // --- AETHER ENGINE v4.0 (Quantum Integration) ---
  let quantumMetadata = null;
  if (scored.length > 0 && process.env.ORIGIN_QUANTUM_TOKEN) {
    try {
      const quantumData = {
        banca,
        materia,
        topics: scored.slice(0, 10).map(s => ({ id: s.id, score: s.score_composto }))
      };
      const qResult = await quantumService.simulateCorrelations(quantumData);
      
      if (qResult && qResult.status === 'success') {
        quantumMetadata = {
          engine: qResult.engine,
          boost: qResult.boost
        };
        
        // Aplica o boost quântico nos scores
        scored.forEach(s => {
          const qTopic = qResult.results.find(qr => qr.id === s.id);
          if (qTopic) {
            s.score_composto = Math.min(100, qTopic.quantum_score);
            s.is_quantum_verified = true;
          }
        });
        
        // Re-ordena após o boost quântico
        scored.sort((a, b) => b.score_composto - a.score_composto);
      }
    } catch (err) {
      log.error('Falha na integração quântica', { error: err.message });
    }
  }
  // ------------------------------------------------

  // Calcula confiança geral baseada no feedback disponível
  const totalFeedbacks = scored.reduce((sum, p) => sum + (p.total_feedbacks || 0), 0);
  const acertosFeedbacks = scored.reduce((sum, p) => sum + (p.acertos_feedbacks || 0), 0);
  const confianca = totalFeedbacks > 0
    ? Math.round((acertosFeedbacks / totalFeedbacks) * 100)
    : null;

  const topicos = scored.map((s) => ({
    id: s.id,
    topico: s.topico,
    subtopicos: s.subtopicos || [],
    probabilidade: s.probabilidade,
    score_composto: s.score_composto,
    nivel_dificuldade: s.nivel_dificuldade,
    armadilhas: s.armadilhas || [],
    dicas: s.dicas || [],
    total_feedbacks: s.total_feedbacks || 0,
    acertos_feedbacks: s.acertos_feedbacks || 0,
  }));

  const predicao = {
    banca,
    materia,
    topicos,
    resumo: `${topicos.length} tópicos mapeados para ${banca} - ${materia}. Top: ${topicos[0]?.topico || 'N/A'} (${topicos[0]?.score_composto}%).`,
    confianca,
    total_topicos: topicos.length,
    total_feedbacks,
    data_geracao: new Date().toISOString(),
  };

  log.info('Predição gerada com sucesso', {
    banca,
    materia,
    topicos: topicos.length,
    confianca,
  });

  return predicao;
}

// ============================================================
// Acurácia
// ============================================================

/**
 * Compara predições com o resultado real de uma prova.
 * @param {string[]} predicoesIds - IDs dos tópicos previstos
 * @param {string[]} topicosReais - Nomes dos tópicos que realmente caíram
 * @param {Object[]} predicoesCompletas - Lista completa das predições para referência
 * @returns {Object} Relatório de comparação
 */
export function calcularAcuracia(predicoesIds, topicosReais, predicoesCompletas = []) {
  if (!Array.isArray(predicoesIds) || !Array.isArray(topicosReais)) {
    return {
      acertos: 0,
      erros: 0,
      porcentagem: 0,
      temas_acertados: [],
      temas_nao_previstos: topicosReais || [],
      temas_previstos_nao_cairam: predicoesIds || [],
    };
  }

  const predicoesPrevistas = predicoesCompletas.filter((p) =>
    predicoesIds.includes(p.id)
  );

  const reaisNorm = topicosReais.map((t) =>
    t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  );

  const acertados = [];
  const previstosNaoCairam = [];

  for (const pred of predicoesPrevistas) {
    const predNorm = pred.topico
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    const match = reaisNorm.some((real) =>
      real.includes(predNorm) || predNorm.includes(real)
    );

    if (match) {
      acertados.push(pred.topico);
    } else {
      previstosNaoCairam.push(pred.topico);
    }
  }

  const naoPrevistos = [];
  for (const real of topicosReais) {
    const realNorm = real.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const foiPrevisto = predicoesPrevistas.some((pred) => {
      const predNorm = pred.topico.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      return realNorm.includes(predNorm) || predNorm.includes(realNorm);
    });
    if (!foiPrevisto) {
      naoPrevistos.push(real);
    }
  }

  const totalVerificaveis = Math.max(predicoesIds.length, topicosReais.length);
  const porcentagem = totalVerificaveis > 0
    ? Math.round((acertados.length / predicoesIds.length) * 100)
    : 0;

  return {
    acertos: acertados.length,
    erros: previstosNaoCairam.length,
    porcentagem: Math.min(100, porcentagem),
    temas_acertados: acertados,
    temas_nao_previstos: naoPrevistos,
    temas_previstos_nao_cairam: previstosNaoCairam,
    total_previstos: predicoesIds.length,
    total_reais: topicosReais.length,
  };
}

// ============================================================
// Data Flywheel — Feedback (PostgreSQL)
// ============================================================

/**
 * Registra feedback do usuário sobre uma predição.
 * Motor do Data Flywheel: cada feedback melhora automaticamente as predições futuras.
 *
 * @param {string} topicoId - ID da predição/tópico
 * @param {boolean} acertou - Se a predição estava correta
 * @param {Object} [meta={}] - Metadados adicionais
 * @param {string} [meta.userId] - ID do usuário
 * @param {string} [meta.concurso] - Nome do concurso
 * @returns {Promise<Object>} Feedback registrado
 */
export async function registrarFeedback(topicoId, acertou, meta = {}) {
  if (!topicoId) {
    throw new Error('topicoId é obrigatório para registrar feedback');
  }

  const feedback = {
    id: `fb_${randomCode(12)}`,
    topico_id: topicoId,
    acertou: Boolean(acertou),
    user_id: meta.userId || null,
    concurso: meta.concurso || null,
    created_at: new Date().toISOString(),
  };

  // Persistir no banco
  await query(
    `INSERT INTO prediction_feedbacks (id, predicao_id, user_id, acertou, concurso)
     VALUES ($1, $2, $3, $4, $5)`,
    [feedback.id, feedback.topico_id, feedback.user_id, feedback.acertou, feedback.concurso]
  );

  log.info('Feedback registrado (Data Flywheel)', {
    topicoId,
    acertou: feedback.acertou,
    userId: meta.userId || 'anonimo',
    concurso: meta.concurso || 'N/A',
  });

  // Atualiza as probabilidades automaticamente
  await atualizarProbabilidadesPorFeedback(topicoId, feedback.acertou);

  return feedback;
}

/**
 * Atualiza probabilidades de uma predição no banco com base no feedback.
 * Motor do flywheel: ajusta scores no PostgreSQL.
 *
 * @param {string} banca - Banca examinadora
 * @param {string} materia - Matéria
 * @param {Object} feedback
 * @param {string} feedback.topico_id
 * @param {boolean} feedback.acertou
 * @returns {Promise<Object>} Resultado da atualização
 */
export async function atualizarProbabilidades(banca, materia, feedback) {
  // Busca a predição atual
  const pred = await queryOne(
    `SELECT * FROM predictions WHERE id = $1 AND banca = $2 AND materia = $3`,
    [feedback.topico_id, banca, materia]
  );

  if (!pred) {
    return { atualizados: 0 };
  }

  const novoTotal = (pred.total_feedbacks || 0) + 1;
  const novosAcertos = (pred.acertos_feedbacks || 0) + (feedback.acertou ? 1 : 0);

  // Calcula nova probabilidade
  let novaProbabilidade = pred.probabilidade;
  if (feedback.acertou) {
    novaProbabilidade = Math.min(100, Math.round(pred.probabilidade + (100 - pred.probabilidade) * 0.1));
  } else {
    novaProbabilidade = Math.max(5, Math.round(pred.probabilidade * 0.9));
  }

  // Atualiza no banco
  await query(
    `UPDATE predictions
     SET probabilidade = $1,
         total_feedbacks = $2,
         acertos_feedbacks = $3,
         updated_at = NOW()
     WHERE id = $4`,
    [novaProbabilidade, novoTotal, novosAcertos, feedback.topico_id]
  );

  // Invalida cache para forçar recarregamento
  invalidateByPrefix(`predictions:${banca}:${materia}`);

  log.info('Probabilidades atualizadas via feedback', {
    banca,
    materia,
    topicoId: feedback.topico_id,
    acertou: feedback.acertou,
    novaProbabilidade,
    totalFeedbacks: novoTotal,
  });

  return {
    banca,
    materia,
    topicoId: feedback.topico_id,
    atualizados: 1,
    novaProbabilidade,
    totalFeedbacks: novoTotal,
  };
}

/**
 * Busca a predição em todas as bancas/materias e atualiza.
 * Chamada interna pelo registrarFeedback.
 * @param {string} topicoId
 * @param {boolean} acertou
 */
async function atualizarProbabilidadesPorFeedback(topicoId, acertou) {
  // Busca em qual banca+materia está a predição
  const pred = await queryOne(
    `SELECT banca, materia FROM predictions WHERE id = $1`,
    [topicoId]
  );

  if (pred) {
    await atualizarProbabilidades(pred.banca, pred.materia, { topico_id: topicoId, acertou });
  }
}

/**
 * Retorna métricas do Data Flywheel.
 * Mostra o impacto do feedback na qualidade das predições.
 * @returns {Promise<Object>} Métricas do flywheel
 */
export async function getFlywheelStats() {
  const feedbackStats = await queryOne(
    `SELECT
       COUNT(*) as total_feedbacks,
       COUNT(*) FILTER (WHERE acertou = true) as acertos,
       COUNT(*) FILTER (WHERE acertou = false) as erros
     FROM prediction_feedbacks`
  );

  const predictionStats = await queryOne(
    `SELECT
       COUNT(*) as total_predicoes,
       COUNT(*) FILTER (WHERE total_feedbacks > 0) as topicos_com_feedback,
       COUNT(*) FILTER (WHERE total_feedbacks > 0 AND (acertos_feedbacks::float / total_feedbacks) >= 0.6) as topicos_melhorados
     FROM predictions`
  );

  const totalFeedbacks = parseInt(feedbackStats?.total_feedbacks || 0, 10);
  const totalAcertos = parseInt(feedbackStats?.acertos || 0, 10);
  const topicosComFeedback = parseInt(predictionStats?.topicos_com_feedback || 0, 10);
  const topicosMelhorados = parseInt(predictionStats?.topicos_melhorados || 0, 10);

  const acuraciaMedia = totalFeedbacks > 0
    ? Math.round((totalAcertos / totalFeedbacks) * 100)
    : null;

  // Momentum do flywheel
  let momentum = 'iniciando';
  if (totalFeedbacks >= 500) momentum = 'acelerando';
  if (totalFeedbacks >= 2000) momentum = 'crescendo';
  if (totalFeedbacks >= 5000) momentum = 'forte';
  if (totalFeedbacks >= 10000) momentum = 'autossustentavel';

  return {
    total_feedbacks: totalFeedbacks,
    acertos: totalAcertos,
    erros: totalFeedbacks - totalAcertos,
    acuracia_media: acuraciaMedia,
    topicos_com_feedback: topicosComFeedback,
    topicos_melhorados,
    total_predicoes: parseInt(predictionStats?.total_predicoes || 0, 10),
    momentum,
    data_consulta: new Date().toISOString(),
    resumo: acuraciaMedia !== null
      ? `Flywheel: ${totalFeedbacks} feedbacks | Acurácia média: ${acuraciaMedia}% | Momentum: ${momentum}`
      : `Flywheel: ${totalFeedbacks} feedbacks | Ainda sem dados suficientes para acurácia`,
  };
}

/**
 * Busca feedbacks para um tópico específico.
 * @param {string} topicoId
 * @returns {Promise<Object[]>}
 */
export async function getFeedbacks(topicoId) {
  return query(
    `SELECT * FROM prediction_feedbacks WHERE predicao_id = $1 ORDER BY created_at DESC`,
    [topicoId]
  );
}

export default {
  getPredicoes,
  getTopTopicos,
  gerarPredicaoProximaProva,
  calcularAcuracia,
  registrarFeedback,
  atualizarProbabilidades,
  getFlywheelStats,
  getAvailablePredictions,
  getFeedbacks,
};
