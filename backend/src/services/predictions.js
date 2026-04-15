/**
 * Serviço de Predições - Motor do Data Flywheel.
 *
 * O Data Flywheel funciona assim:
 * 1. Geramos predições baseadas em dados históricos
 * 2. Usários acessam as predições e estudam os tópicos
 * 3. Após a prova, recebemos feedback (acertou/não acertou)
 * 4. O feedback atualiza as probabilidades automaticamente
 * 5. Predições mais precisas → mais confiança → mais feedback → ciclo virtuoso
 *
 * Gabaritou v2 - Backend Services Layer
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomCode } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const log = logger.child('PredictionsService');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Caminho base para os arquivos JSON de dados */
const DADOS_DIR = path.join(__dirname, '..', '..', 'dados');

/** Armazenamento em memória dos feedbacks (em produção, usar Supabase) */
const feedbackStore = new Map();

/** Armazenamento das predições carregadas em memória */
const predictionsStore = new Map();

// ============================================================
// Carregamento de dados
// ============================================================

/**
 * Carrega os dados de predições de um arquivo JSON.
 * @param {string} banca - Nome da banca
 * @param {string} materia - Nome da matéria
 * @returns {Object[]} Lista de predições
 */
function loadPredictions(banca, materia) {
  const bancaSlug = banca.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const materiaSlug = materia.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/dir-admin/g, 'diradmin');

  const cacheKey = `${bancaSlug}:${materiaSlug}`;

  // Verifica se já está em memória
  if (predictionsStore.has(cacheKey)) {
    return predictionsStore.get(cacheKey);
  }

  // Tenta carregar do arquivo JSON
  const fileName = `${bancaSlug}-${materiaSlug}.json`;
  const filePath = path.join(DADOS_DIR, fileName);

  try {
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const predictions = JSON.parse(rawData);

      if (Array.isArray(predictions)) {
        predictionsStore.set(cacheKey, predictions);
        log.debug('Predições carregadas do arquivo', {
          banca,
          materia,
          arquivo: fileName,
          total: predictions.length,
        });
        return predictions;
      }
    }
  } catch (error) {
    log.error('Erro ao carregar predições do arquivo', {
      banca,
      materia,
      arquivo: fileName,
      erro: error.message,
    });
  }

  // Retorna array vazio se não encontrar arquivo
  return [];
}

/**
 * Salva predições atualizadas no arquivo JSON.
 * @param {string} banca
 * @param {string} materia
 * @param {Object[]} predictions
 */
function savePredictions(banca, materia, predictions) {
  const bancaSlug = banca.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const materiaSlug = materia.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/dir-admin/g, 'diradmin');

  const fileName = `${bancaSlug}-${materiaSlug}.json`;
  const filePath = path.join(DADOS_DIR, fileName);

  try {
    // Garante que o diretório existe
    if (!fs.existsSync(DADOS_DIR)) {
      fs.mkdirSync(DADOS_DIR, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(predictions, null, 2), 'utf-8');
    log.info('Predições salvas no arquivo', {
      banca,
      materia,
      arquivo: fileName,
      total: predictions.length,
    });
  } catch (error) {
    log.error('Erro ao salvar predições', {
      banca,
      materia,
      erro: error.message,
    });
  }
}

/**
 * Lista todos os arquivos de predições disponíveis.
 * @returns {Array<{banca: string, materia: string, total: number}>}
 */
export function getAvailablePredictions() {
  const results = [];

  if (!fs.existsSync(DADOS_DIR)) {
    return results;
  }

  try {
    const files = fs.readdirSync(DADOS_DIR).filter((f) => f.endsWith('.json'));

    for (const file of files) {
      // Parseia o nome do arquivo: banca-materia.json
      const name = file.replace('.json', '');
      const parts = name.split('-');

      // O primeiro segmento é a banca, o resto é a matéria
      // Lida com matérias que contêm hífens
      const bancasConhecidas = ['cespe', 'cebraspe', 'fgv', 'vunesp', 'fcc', 'quadrix'];

      let banca = '';
      let materia = '';

      if (bancasConhecidas.includes(parts[0])) {
        banca = parts[0];
        materia = parts.slice(1).join('-');
      } else {
        banca = parts[0];
        materia = parts.slice(1).join('-') || 'geral';
      }

      try {
        const data = JSON.parse(fs.readFileSync(path.join(DADOS_DIR, file), 'utf-8'));
        results.push({
          banca: banca.toUpperCase(),
          materia: materia.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          total: Array.isArray(data) ? data.length : 0,
        });
      } catch {
        results.push({
          banca: banca.toUpperCase(),
          materia: file,
          total: 0,
        });
      }
    }
  } catch (error) {
    log.error('Erro ao listar predições disponíveis', { erro: error.message });
  }

  return results;
}

// ============================================================
// Predições
// ============================================================

/**
 * Obtém predições para uma banca e matéria específicas.
 * @param {string} banca - Nome da banca (ex: 'CESPE', 'FGV')
 * @param {string} materia - Nome da matéria (ex: 'DirAdmin', 'Raciocínio Lógico')
 * @returns {Object[]} Lista de predições ordenadas por probabilidade
 */
export function getPredicoes(banca, materia) {
  if (!banca || !materia) {
    log.warn('Parâmetros banca/materia são obrigatórios', { banca, materia });
    return [];
  }

  const predictions = loadPredictions(banca, materia);

  // Ordena por probabilidade decrescente (maior chance primeiro)
  const sorted = [...predictions].sort((a, b) => {
    // Score composto: probabilidade * peso_recencia
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
 * @returns {Object[]}
 */
export function getTopTopicos(banca, materia, limite = 5) {
  const predicoes = getPredicoes(banca, materia);
  return predicoes.slice(0, limite);
}

/**
 * Gera uma predição para a próxima prova de uma banca/matéria.
 * Combina probabilidade, recência e feedback dos usuários.
 * @param {string} banca
 * @param {string} materia
 * @returns {Object} Predição gerada com score composto e análise
 */
export function gerarPredicaoProximaProva(banca, materia) {
  const predicoes = getPredicoes(banca, materia);

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

    // Bonus por recência (recentemente cobrado = maior chance de repetir)
    if (pred.recencia !== undefined && pred.recencia !== null) {
      if (pred.recencia === 0) {
        score += 10; // cobrado na última prova
      } else if (pred.recencia <= 180) {
        score += 5; // cobrado nos últimos 6 meses
      } else if (pred.recencia <= 365) {
        score += 2; // cobrado no último ano
      }
    }

    // Bonus por peso histórico
    if (pred.peso_historico) {
      score += pred.peso_historico * 2;
    }

    // Ajuste por feedback dos usuários
    if (pred.total_feedbacks > 0) {
      const taxaAcerto = pred.acertos_feedbacks / pred.total_feedbacks;
      if (taxaAcerto >= 0.7) {
        score += 8; // feedback confirma alta acurácia
      } else if (taxaAcerto >= 0.5) {
        score += 4;
      } else if (taxaAcerto < 0.3) {
        score -= 5; // feedback indica que o tópico está sendo mal previsto
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

  // Calcula confiança geral baseada no feedback disponível
  const totalFeedbacks = scored.reduce((sum, p) => sum + (p.total_feedbacks || 0), 0);
  const acertosFeedbacks = scored.reduce((sum, p) => sum + (p.acertos_feedbacks || 0), 0);
  const confianca = totalFeedbacks > 0
    ? Math.round((acertosFeedbacks / totalFeedbacks) * 100)
    : null; // null significa "sem dados suficientes"

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
    resumo: `🎯 ${topicos.length} tópicos mapeados para ${banca} - ${materia}. Top: ${topicos[0]?.topico || 'N/A'} (${topicos[0]?.score_composto}%).`,
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
      tema_acertados: [],
      tema_nao_previstos: topicosReais || [],
      tema_previstos_nao_cairam: predicoesIds || [],
    };
  }

  // Encontra as predições completas pelos IDs
  const predicoesPrevistas = predicoesCompletas.filter((p) =>
    predicoesIds.includes(p.id)
  );

  // Normaliza nomes dos tópicos reais para comparação
  const reaisNorm = topicosReais.map((t) =>
    t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  );

  // Verifica quais predições acertaram
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

  // Tópicos reais que não foram previstos
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
// Data Flywheel - Feedback
// ============================================================

/**
 * Registra feedback do usuário sobre uma predição.
 * Este é o mecanismo central do Data Flywheel:
 * cada feedback melhora automaticamente as predições futuras.
 *
 * @param {string} topicoId - ID da predição/tópico
 * @param {boolean} acertou - Se a predição estava correta
 * @param {Object} [meta={}] - Metadados adicionais
 * @param {string} [meta.userId] - ID do usuário que deu o feedback
 * @param {string} [meta.concurso] - Nome do concurso
 * @returns {Object} Feedback registrado
 */
export function registrarFeedback(topicoId, acertou, meta = {}) {
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

  // Armazena o feedback
  if (!feedbackStore.has(topicoId)) {
    feedbackStore.set(topicoId, []);
  }
  feedbackStore.get(topicoId).push(feedback);

  log.info('Feedback registrado (Data Flywheel)', {
    topicoId,
    acertou: feedback.acertou,
    userId: meta.userId || 'anonimo',
    concurso: meta.concurso || 'N/A',
    totalFeedbacksTopico: feedbackStore.get(topicoId).length,
  });

  // Tenta atualizar as probabilidades automaticamente
  atualizarProbabilidadesPorFeedback(topicoId, feedback.acertou);

  return feedback;
}

/**
 * Atualiza probabilidades com base no feedback.
 * O motor do flywheel: ajusta scores internamente.
 * @param {string} banca
 * @param {string} materia
 * @param {Object} feedback
 * @param {string} feedback.topico_id
 * @param {boolean} feedback.acertou
 * @returns {Object} Resultado da atualização
 */
export function atualizarProbabilidades(banca, materia, feedback) {
  const predictions = loadPredictions(banca, materia);

  let atualizados = 0;

  const updated = predictions.map((pred) => {
    if (pred.id !== feedback.topico_id) return pred;

    const novoTotal = (pred.total_feedbacks || 0) + 1;
    const novosAcertos = (pred.acertos_feedbacks || 0) + (feedback.acertou ? 1 : 0);
    const taxaHistorica = pred.acertos_feedbacks > 0
      ? pred.acertos_feedbacks / pred.total_feedbacks
      : 0.5;
    const taxaNova = novosAcertos / novoTotal;

    // Ajuste suave: mistura taxa histórica com nova informação
    const taxaAjustada = Math.round((taxaHistorica * 0.3 + taxaNova * 0.7) * 100) / 100;

    // Atualiza probabilidade baseada na taxa ajustada
    let novaProbabilidade = pred.probabilidade;

    if (feedback.acertou) {
      // Acertou: aumenta probabilidade proporcionalmente
      novaProbabilidade = Math.min(100, Math.round(pred.probabilidade + (100 - pred.probabilidade) * 0.1));
    } else {
      // Errou: diminui probabilidade proporcionalmente
      novaProbabilidade = Math.max(5, Math.round(pred.probabilidade * 0.9));
    }

    atualizados++;

    return {
      ...pred,
      probabilidade: novaProbabilidade,
      total_feedbacks: novoTotal,
      acertos_feedbacks: novosAcertos,
      ultima_atualizacao: new Date().toISOString(),
    };
  });

  // Salva as predições atualizadas
  if (atualizados > 0) {
    savePredictions(banca, materia, updated);
    // Atualiza o cache em memória
    const bancaSlug = banca.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const materiaSlug = materia.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/dir-admin/g, 'diradmin');
    predictionsStore.set(`${bancaSlug}:${materiaSlug}`, updated);
  }

  log.info('Probabilidades atualizadas via feedback', {
    banca,
    materia,
    topicoId: feedback.topico_id,
    acertou: feedback.acertou,
    atualizados,
  });

  return {
    banca,
    materia,
    topicoId: feedback.topico_id,
    atualizados,
    feedbacks_totais: feedbackStore.get(feedback.topico_id)?.length || 0,
  };
}

/**
 * Atualiza predições buscando em todos os dados disponíveis.
 * Chamada interna pelo registrarFeedback.
 * @param {string} topicoId
 * @param {boolean} acertou
 */
function atualizarProbabilidadesPorFeedback(topicoId, acertou) {
  const disponiveis = getAvailablePredictions();

  for (const { banca, materia } of disponiveis) {
    const predictions = loadPredictions(banca, materia);
    const predMatch = predictions.find((p) => p.id === topicoId);

    if (predMatch) {
      atualizarProbabilidades(banca, materia, { topico_id: topicoId, acertou });
      return; // Atualiza apenas no primeiro match encontrado
    }
  }
}

/**
 * Retorna métricas do Data Flywheel.
 * Mostra o impacto do feedback na qualidade das predições.
 * @returns {Object} Métricas do flywheel
 */
export function getFlywheelStats() {
  let totalFeedbacks = 0;
  let totalAcertos = 0;
  let topicosComFeedback = 0;
  let topicosMelhorados = 0;

  // Conta feedbacks em memória
  for (const [, feedbacks] of feedbackStore) {
    for (const fb of feedbacks) {
      totalFeedbacks++;
      if (fb.acertou) totalAcertos++;
    }
  }

  // Conta predições com feedback nos dados
  const disponiveis = getAvailablePredictions();
  for (const { banca, materia } of disponiveis) {
    const predictions = loadPredictions(banca, materia);
    for (const pred of predictions) {
      if ((pred.total_feedbacks || 0) > 0) {
        topicosComFeedback++;
        const taxa = pred.acertos_feedbacks / pred.total_feedbacks;
        if (taxa >= 0.6) topicosMelhorados++;
      }
    }
  }

  const acuraciaMedia = totalFeedbacks > 0
    ? Math.round((totalAcertos / totalFeedbacks) * 100)
    : null;

  // Calcula o "momentum" do flywheel
  // Quanto mais feedback, mais confiável o sistema
  let momentum = 'iniciando';
  if (totalFeedbacks >= 500) momentum = 'acelerando';
  if (totalFeedbacks >= 2000) momentum = 'crescendo';
  if (totalFeedbacks >= 5000) momentum = 'forte';
  if (totalFeedbacks >= 10000) momentum = 'autossustentavel';

  return {
    total_feedbacks,
    acertos: totalAcertos,
    erros: totalFeedbacks - totalAcertos,
    acuracia_media: acuraciaMedia,
    topicos_com_feedback: topicosComFeedback,
    topicos_melhorados,
    predicoes_disponiveis: disponiveis.length,
    momentum,
    data_consulta: new Date().toISOString(),
    resumo: acuraciaMedia !== null
      ? `📊 Flywheel: ${totalFeedbacks} feedbacks | Acurácia média: ${acuraciaMedia}% | Momentum: ${momentum}`
      : `📊 Flywheel: ${totalFeedbacks} feedbacks | Ainda sem dados suficientes para acurácia`,
  };
}

/**
 * Busca feedbacks para um tópico específico.
 * @param {string} topicoId
 * @returns {Object[]}
 */
export function getFeedbacks(topicoId) {
  return feedbackStore.get(topicoId) || [];
}

/**
 * Retorna todos os feedbacks armazenados (para análise).
 * @returns {Object[]}
 */
export function getAllFeedbacks() {
  const all = [];
  for (const [, feedbacks] of feedbackStore) {
    all.push(...feedbacks);
  }
  return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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
  getAllFeedbacks,
};
