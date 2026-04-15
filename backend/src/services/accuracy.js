/**
 * Serviço de Acurácia - Relatórios de desempenho das predições.
 *
 * Compara predições da Gabaritou com o que realmente caiu nas provas,
 * gera relatórios públicos e dados para imagens compartilháveis.
 *
 * Gabaritou v2 - Backend Services Layer
 */

import { randomCode } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const log = logger.child('AccuracyService');

/** Armazenamento em memória dos relatórios (em produção: Supabase) */
const reportsStore = new Map();

// ============================================================
// Geração de Relatórios
// ============================================================

/**
 * Gera relatório completo de acurácia para um concurso.
 * Compara as predições da Gabaritou com as questões reais da prova.
 *
 * @param {string} concurso - Nome do concurso (ex: 'TRF-5 2024')
 * @param {string} banca - Banca examinadora
 * @param {Object[]} questoesReais - Questões que realmente caíram na prova
 * @param {string[]} questoesReais[].topicos - Tópicos de cada questão real
 * @param {string[]} predicoesIds - IDs das predições feitas pela Gabaritou
 * @param {Object[]} predicoesCompletas - Dados completos das predições
 * @returns {Object} Relatório de acurácia completo
 */
export function gerarRelatorioAcuracia(concurso, banca, questoesReais, predicoesIds = [], predicoesCompletas = []) {
  if (!concurso || !banca) {
    throw new Error('concurso e banca são obrigatórios');
  }

  // Extrai todos os tópicos reais das questões
  const topicosReais = questoesReais.flatMap((q) => q.topicos || [q.topico]).filter(Boolean);

  // Usa a função de cálculo de acurácia
  const resultado = compararPredicoesComProva(predicoesIds, topicosReais, predicoesCompletas);

  // Identifica os temas previstos que acertaram com detalhes
  const detalhesAcertos = [];
  for (const pred of predicoesCompletas) {
    if (resultado.temas_acertados.includes(pred.topico)) {
      detalhesAcertos.push({
        topico: pred.topico,
        probabilidade: pred.probabilidade,
        nivel_dificuldade: pred.nivel_dificuldade,
        dicas: pred.dicas || [],
      });
    }
  }

  // Gera ID único
  const id = `rel_${randomCode(10)}`;

  const relatorio = {
    id,
    concurso,
    banca,
    data_prova: new Date().toISOString(),
    total_questoes: questoesReais.length,
    acertos: resultado.acertos,
    erros: resultado.erros,
    porcentagem: resultado.porcentagem,
    temas_mapeados: resultado.temas_acertados,
    temas_acertados: resultado.temas_acertados,
    temas_nao_previstos: resultado.temas_nao_previstos,
    temas_previstos_nao_cairam: resultado.temas_previstos_nao_cairam,
    publicado: false,
    created_at: new Date().toISOString(),
    detalhes_acertos,
    share_image_data: {
      titulo: `Gabaritou x ${concurso}`,
      banca,
      acertos: resultado.acertos,
      erros: resultado.erros,
      porcentagem: resultado.porcentagem,
      total_questoes: questoesReais.length,
      data: new Date().toLocaleDateString('pt-BR'),
      predicoes_acertadas: resultado.temas_acertados.slice(0, 3),
    },
  };

  // Armazena o relatório
  reportsStore.set(id, relatorio);

  log.info('Relatório de acurácia gerado', {
    id,
    concurso,
    banca,
    acertos: resultado.acertos,
    porcentagem: resultado.porcentagem,
  });

  return relatorio;
}

/**
 * Compara predições com o resultado real de uma prova.
 *
 * @param {string[]} predicoesIds - IDs dos tópicos previstos
 * @param {string[]} provaReal - Lista de tópicos que realmente caíram
 * @param {Object[]} [predicoesCompletas=[]] - Dados completos das predições
 * @returns {Object} Resultado da comparação
 */
export function compararPredicoesComProva(predicoesIds, provaReal, predicoesCompletas = []) {
  if (!Array.isArray(predicoesIds) || !Array.isArray(provaReal)) {
    return {
      acertos: 0,
      erros: 0,
      porcentagem: 0,
      temas_acertados: [],
      temas_nao_previstos: [],
      temas_previstos_nao_cairam: [],
    };
  }

  const predicoesPrevistas = predicoesCompletas.filter((p) =>
    predicoesIds.includes(p.id)
  );

  // Normaliza textos para comparação flexível
  const normalize = (text) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const reaisNorm = provaReal.map(normalize);

  // Verifica acertos
  const acertados = [];
  const previstosNaoCairam = [];

  for (const pred of predicoesPrevistas) {
    const predNorm = normalize(pred.topico);
    const matched = reaisNorm.some((real) =>
      real.includes(predNorm) || predNorm.includes(real)
    );

    if (matched) {
      acertados.push(pred.topico);
    } else {
      previstosNaoCairam.push(pred.topico);
    }
  }

  // Tópicos que caíram e não foram previstos
  const naoPrevistos = [];
  for (const real of provaReal) {
    const realNorm = normalize(real);
    const foiPrevisto = predicoesPrevistas.some((pred) => {
      const predNorm = normalize(pred.topico);
      return realNorm.includes(predNorm) || predNorm.includes(realNorm);
    });
    if (!foiPrevisto) {
      naoPrevistos.push(real);
    }
  }

  const totalPrevistos = Math.max(predicoesIds.length, 1);
  const porcentagem = Math.round((acertados.length / totalPrevistos) * 100);

  return {
    acertos: acertados.length,
    erros: previstosNaoCairam.length,
    porcentagem: Math.min(100, porcentagem),
    temas_acertados: acertados,
    temas_nao_previstos: naoPrevistos,
    temas_previstos_nao_cairam: previstosNaoCairam,
    total_previstos: predicoesIds.length,
    total_reais: provaReal.length,
  };
}

/**
 * Retorna todos os relatórios publicados.
 * @returns {Object[]}
 */
export function getRelatoriosPublicos() {
  const publicos = [];

  for (const [, relatorio] of reportsStore) {
    if (relatorio.publicado) {
      publicos.push(relatorio);
    }
  }

  // Ordena por data de criação decrescente
  publicos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return publicos;
}

/**
 * Retorna todos os relatórios (incluindo não publicados).
 * @returns {Object[]}
 */
export function getAllRelatorios() {
  const todos = Array.from(reportsStore.values());
  todos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return todos;
}

/**
 * Publica um relatório, tornando-o visível publicamente.
 * @param {string} relatorioId - ID do relatório
 * @returns {Object} Relatório atualizado
 * @throws {Error} Se relatório não for encontrado
 */
export function publishRelatorio(relatorioId) {
  const relatorio = reportsStore.get(relatorioId);

  if (!relatorio) {
    throw new Error(`Relatório não encontrado: ${relatorioId}`);
  }

  relatorio.publicado = true;
  relatorio.published_at = new Date().toISOString();

  log.info('Relatório publicado', {
    id: relatorioId,
    concurso: relatorio.concurso,
    porcentagem: relatorio.porcentagem,
  });

  return relatorio;
}

/**
 * Gera dados para imagem compartilhável do relatório.
 * Retorna objeto estruturado para ser usado na geração de imagem.
 *
 * @param {string} relatorioId
 * @returns {Object} Dados para geração de imagem
 */
export function generateShareImage(relatorioId) {
  const relatorio = reportsStore.get(relatorioId);

  if (!relatorio) {
    throw new Error(`Relatório não encontrado: ${relatorioId}`);
  }

  // Classifica o desempenho
  let classificacao = '';
  let emoji = '';
  if (relatorio.porcentagem >= 80) {
    classificacao = 'Excelente';
    emoji = '🏆';
  } else if (relatorio.porcentagem >= 60) {
    classificacao = 'Muito Bom';
    emoji = '🎯';
  } else if (relatorio.porcentagem >= 40) {
    classificacao = 'Bom';
    emoji = '👍';
  } else if (relatorio.porcentagem >= 20) {
    classificacao = 'Regular';
    emoji = '📊';
  } else {
    classificacao = 'Precisa Melhorar';
    emoji = '📈';
  }

  return {
    tipo: 'acuracia_report',
    titulo: `Gabaritou x ${relatorio.concurso}`,
    subtitulo: `Relatório de Acurácia - ${relatorio.banca}`,
    classificacao,
    emoji,
    data: new Date(relatorio.created_at).toLocaleDateString('pt-BR'),
    estatisticas: {
      acertos: relatorio.acertos,
      erros: relatorio.erros,
      porcentagem: relatorio.porcentagem,
      total_questoes: relatorio.total_questoes,
    },
    grafico_barras: {
      acertados: relatorio.temas_acertados,
      previstos_nao_cairam: relatorio.temas_previstos_nao_cairam,
      nao_previstos: relatorio.temas_nao_previstos,
    },
    destaques: relatorio.temas_acertados.slice(0, 5),
    rodape: 'gabaritou.com.br | Predições baseadas em dados reais',
    cores: {
      primaria: relatorio.porcentagem >= 60 ? '#10B981' : '#F59E0B',
      secundaria: '#1F2937',
      fundo: '#FFFFFF',
    },
  };
}

/**
 * Retorna acurácia histórica por banca.
 * Calcula média de todos os relatórios de uma banca.
 *
 * @param {string} banca - Banca para filtrar
 * @returns {Object} Histórico de acurácia
 */
export function getAcuraciaHistorica(banca) {
  const relatorios = [];

  for (const [, relatorio] of reportsStore) {
    if (!banca || relatorio.banca === banca) {
      relatorios.push(relatorio);
    }
  }

  if (relatorios.length === 0) {
    return {
      banca,
      total_relatorios: 0,
      acuracia_media: null,
      melhor_acuracia: null,
      pior_acuracia: null,
      tendencia: 'sem_dados',
      historico: [],
    };
  }

  // Ordena por data
  relatorios.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const acuracias = relatorios.map((r) => ({
    concurso: r.concurso,
    porcentagem: r.porcentagem,
    data: r.created_at,
    publicado: r.publicado,
  }));

  const porcentagens = relatorios.map((r) => r.porcentagem);
  const media = Math.round(porcentagens.reduce((a, b) => a + b, 0) / porcentagens.length);
  const melhor = Math.max(...porcentagens);
  const pior = Math.min(...porcentagens);

  // Calcula tendência (compara últimos 3 com os 3 anteriores)
  let tendencia = 'estavel';
  if (relatorios.length >= 6) {
    const metade = Math.floor(relatorios.length / 2);
    const primeiraMetade = porcentagens.slice(0, metade);
    const segundaMetade = porcentagens.slice(metade);
    const mediaPrimeira = primeiraMetade.reduce((a, b) => a + b, 0) / primeiraMetade.length;
    const mediaSegunda = segundaMetade.reduce((a, b) => a + b, 0) / segundaMetade.length;

    if (mediaSegunda > mediaPrimeira + 5) tendencia = 'melhorando';
    else if (mediaSegunda < mediaPrimeira - 5) tendencia = 'piorando';
  } else if (relatorios.length >= 2) {
    const ultimo = porcentagens[porcentagens.length - 1];
    const penultimo = porcentagens[porcentagens.length - 2];
    if (ultimo > penultimo + 5) tendencia = 'melhorando';
    else if (ultimo < penultimo - 5) tendencia = 'piorando';
  }

  return {
    banca,
    total_relatorios: relatorios.length,
    acuracia_media: media,
    melhor_acuracia: melhor,
    pior_acuracia: pior,
    tendencia,
    historico: acuracias,
    resumo: `📈 ${banca}: ${relatorios.length} relatórios | Média: ${media}% | Tendência: ${tendencia}`,
  };
}

/**
 * Retorna um relatório específico por ID.
 * @param {string} relatorioId
 * @returns {Object|null}
 */
export function getRelatorioById(relatorioId) {
  return reportsStore.get(relatorioId) || null;
}

/**
 * Remove um relatório.
 * @param {string} relatorioId
 * @returns {boolean}
 */
export function deleteRelatorio(relatorioId) {
  const deleted = reportsStore.delete(relatorioId);
  if (deleted) {
    log.info('Relatório removido', { id: relatorioId });
  }
  return deleted;
}

/**
 * Gera resumo geral de todas as acurácias.
 * @returns {Object}
 */
export function getResumoGeral() {
  const todos = getAllRelatorios();

  if (todos.length === 0) {
    return {
      total_relatorios: 0,
      acuracia_geral: null,
      por_banca: {},
    };
  }

  const porcentagens = todos.map((r) => r.porcentagem);
  const mediaGeral = Math.round(porcentagens.reduce((a, b) => a + b, 0) / porcentagens.length);

  // Agrupa por banca
  const porBanca = {};
  for (const r of todos) {
    if (!porBanca[r.banca]) {
      porBanca[r.banca] = { relatorios: 0, acuracia_media: 0 };
    }
    porBanca[r.banca].relatorios++;
    porBanca[r.banca].acuracia_media += r.porcentagem;
  }

  for (const banca of Object.keys(porBanca)) {
    const b = porBanca[banca];
    b.acuracia_media = Math.round(b.acuracia_media / b.relatorios);
  }

  return {
    total_relatorios: todos.length,
    acuracia_geral: mediaGeral,
    por_banca: porBanca,
    publicados: todos.filter((r) => r.publicado).length,
  };
}

export default {
  gerarRelatorioAcuracia,
  compararPredicoesComProva,
  getRelatoriosPublicos,
  getAllRelatorios,
  publishRelatorio,
  generateShareImage,
  getAcuraciaHistorica,
  getRelatorioById,
  deleteRelatorio,
  getResumoGeral,
};
