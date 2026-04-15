/**
 * Serviço de AI Tutor - Tutor inteligente personalizado.
 *
 * Gera planos de estudos, resumos de tópicos, simulados adaptativos
 * e análises de performance usando IA (Groq/LLM).
 *
 * Gabaritou v2 - Backend Services Layer
 */

import { randomCode } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const log = logger.child('AITutorService');

// ============================================================
// Store de planos e sessões
// ============================================================

const plansStore = new Map();
const sessionsStore = new Map();
const performanceStore = new Map();

// ============================================================
// Planos de Estudos
// ============================================================

/**
 * Gera um plano de estudos personalizado para o usuário.
 * O plano é baseado nas predições de tópicos e prioriza
 * os temas com maior probabilidade de cair.
 *
 * @param {string} userId - ID do usuário
 * @param {string} banca - Banca examinadora alvo
 * @param {string} cargo - Cargo alvo
 * @param {number} horasDiarias - Horas de estudo por dia
 * @param {Object[]} [predicoes=[]] - Predições de tópicos para basear o plano
 * @returns {Object} Plano de estudos completo
 */
export function gerarPlanoEstudos(userId, banca, cargo, horasDiarias, predicoes = []) {
  if (!userId || !banca || !cargo) {
    throw new Error('userId, banca e cargo são obrigatórios');
  }

  const horas = Number(horasDiarias) || 2;
  const diasEstudoPorSemana = 5; // segunda a sexta
  const semanasEstimadas = 8;

  // Organiza os tópicos das predições no plano
  let topicos = [];

  if (predicoes.length > 0) {
    // Usa as predições para montar o plano
    topicos = predicoes
      .sort((a, b) => (b.probabilidade || 0) - (a.probabilidade || 0))
      .map((pred, index) => {
        const horasPorTopico = pred.nivel_dificuldade === 'dificil' || pred.nivel_dificuldade === 'muito_dificil'
          ? Math.ceil(horas * 2)
          : Math.ceil(horas * 1.5);

        return {
          nome: pred.topico,
          prioridade: index < 3 ? 1 : index < 7 ? 2 : 3,
          horas: horasPorTopico,
          status: 'nao_iniciado',
          materiais: gerarMateriaisRecomendados(pred.topico, pred.referencias_legais || []),
          ordem: index + 1,
          probabilidade: pred.probabilidade,
          subtopicos: pred.subtopicos || [],
          armadilhas: pred.armadilhas || [],
          dicas: pred.dicas || [],
          nivel_dificuldade: pred.nivel_dificuldade || 'medio',
        };
      });
  } else {
    // Plano genérico para a banca/cargo
    topicos = gerarTopicosGenericos(banca, horas);
  }

  const horasTotais = topicos.reduce((sum, t) => sum + t.horas, 0);
  const diasTotais = Math.ceil(horasTotais / (horas * diasEstudoPorSemana) * 7);

  const plano = {
    id: `plan_${randomCode(10)}`,
    user_id: userId,
    banca,
    cargo,
    topicos,
    horas_estimadas: horasTotais,
    dias_estimados: diasTotais,
    horas_diarias: horas,
    dias_estudo_semana: diasEstudoPorSemana,
    semanas_estimadas: semanasEstimadas,
    created_at: new Date().toISOString(),
    status: 'ativo',
    progresso: 0,
    proxima_sessao: topicos.length > 0 ? topicos[0].nome : null,
  };

  plansStore.set(plano.id, plano);

  log.info('Plano de estudos gerado', {
    userId,
    banca,
    cargo,
    topicos: topicos.length,
    horasTotais,
    diasTotais,
  });

  return plano;
}

/**
 * Gera materiais de estudo recomendados para um tópico.
 * @param {string} topico
 * @param {string[]} referencias
 * @returns {string[]}
 */
function gerarMateriaisRecomendados(topico, referencias = []) {
  const materiais = [];

  if (referencias.length > 0) {
    materiais.push(`📖 Estudar ${referencias.slice(0, 3).join(', ')}`);
  }

  materiais.push(`📝 Questões comentadas de ${topico}`);
  materiais.push(`🎬 Videoaulas sobre ${topico}`);
  materiais.push(`📖 Resumos e mapas mentais de ${topico}`);

  return materiais;
}

/**
 * Gera tópicos genéricos para uma banca quando não há predições.
 * @param {string} banca
 * @param {number} horasDiarias
 * @returns {Object[]}
 */
function gerarTopicosGenericos(banca, horasDiarias) {
  const bancaNorm = banca.toUpperCase();

  const topicosPorBanca = {
    CESPE: [
      'Direito Administrativo', 'Direito Constitucional', 'Direito Civil',
      'Raciocínio Lógico', 'Língua Portuguesa', 'Direito Penal',
      'Administração Pública', 'Contabilidade',
    ],
    FGV: [
      'Direito Tributário', 'Direito Civil', 'Direito Empresarial',
      'Direito Constitucional', 'Língua Portuguesa', 'Raciocínio Lógico',
    ],
    FCC: [
      'Direito Administrativo', 'Língua Portuguesa', 'Informática',
      'Raciocínio Lógico', 'Direito Constitucional',
    ],
  };

  const topicos = topicosPorBanca[bancaNorm] || topicosPorBanca.CESPE;

  return topicos.map((nome, index) => ({
    nome,
    prioridade: index < 3 ? 1 : index < 6 ? 2 : 3,
    horas: Math.ceil(horasDiarias * 1.5),
    status: 'nao_iniciado',
    materiais: [`📝 Questões comentadas de ${nome}`, `📖 Resumo de ${nome}`],
    ordem: index + 1,
    probabilidade: null,
    subtopicos: [],
    armadilhas: [],
    dicas: [],
    nivel_dificuldade: 'medio',
  }));
}

/**
 * Obtém plano de estudos de um usuário.
 * @param {string} userId
 * @returns {Object|null}
 */
export function getPlanoEstudos(userId) {
  for (const [, plano] of plansStore) {
    if (plano.user_id === userId && plano.status === 'ativo') {
      return plano;
    }
  }
  return null;
}

// ============================================================
// Resumos de Tópicos
// ============================================================

/**
 * Gera resumo de um tópico para estudo rápido.
 * O resumo é estruturado com conceitos-chave, dicas e pontos de atenção.
 *
 * @param {string} topicoId - ID do tópico (deve existir nas predições)
 * @param {Object} [dadosTopico={}] - Dados do tópico (da predição)
 * @returns {Object} Resumo estruturado
 */
export function getResumoTopico(topicoId, dadosTopico = {}) {
  if (!topicoId) {
    throw new Error('topicoId é obrigatório');
  }

  const topico = dadosTopico.topico || topicoId;
  const subtopicos = dadosTopico.subtopicos || [];
  const armadilhas = dadosTopico.armadilhas || [];
  const dicas = dadosTopico.dicas || [];
  const referencias = dadosTopico.referencias_legais || [];
  const dificuldade = dadosTopico.nivel_dificuldade || 'medio';
  const probabilidade = dadosTopico.probabilidade || null;

  // Gera pontos-chave baseados nos dados disponíveis
  const pontosChave = [];

  if (subtopicos.length > 0) {
    pontosChave.push(`📌 Subtópicos principais: ${subtopicos.join(', ')}`);
  }

  if (referencias.length > 0) {
    pontosChave.push(`📚 Base legal: ${referencias.slice(0, 5).join(', ')}`);
  }

  // Adiciona dicas como pontos-chave
  for (const dica of dicas.slice(0, 3)) {
    pontosChave.push(`💡 ${dica}`);
  }

  // Adiciona armadilhas como alertas
  const alertas = [];
  for (const armadilha of armadilhas.slice(0, 3)) {
    alertas.push(`⚠️ ${armadilha}`);
  }

  // Estimativa de tempo de estudo
  const horasEstimadas = dificuldade === 'dificil' || dificuldade === 'muito_dificil' ? 4 : 2;

  const resumo = {
    id: `resumo_${randomCode(8)}`,
    topico,
    topico_id: topicoId,
    nivel_dificuldade: dificuldade,
    horas_estimadas: horasEstimadas,
    probabilidade_cobranca: probabilidade,
    pontos_chave: pontosChave,
    armadilhas_principais: alertas,
    dicas_estudo: dicas.slice(3), // dicas restantes
    referencias_legais: referencias,
    plano_revisao: gerarPlanoRevisao(dificuldade, horasEstimadas),
    created_at: new Date().toISOString(),
  };

  return resumo;
}

/**
 * Gera plano de revisão baseado na dificuldade.
 * @param {string} dificuldade
 * @param {number} horas
 * @returns {Object[]}
 */
function gerarPlanoRevisao(dificuldade, horas) {
  const etapas = [
    { etapa: 1, atividade: 'Leitura do material base', duracao_minutos: Math.round(horas * 15) },
    { etapa: 2, atividade: 'Resumo e mapas mentais', duracao_minutos: Math.round(horas * 10) },
    { etapa: 3, atividade: 'Questões comentadas', duracao_minutos: Math.round(horas * 15) },
    { etapa: 4, atividade: 'Revisão das questões erradas', duracao_minutos: Math.round(horas * 10) },
    { etapa: 5, atividade: 'Simulado rápido', duracao_minutos: Math.round(horas * 10) },
  ];

  if (dificuldade === 'dificil' || dificuldade === 'muito_dificil') {
    etapas.splice(2, 0, {
      etapa: 2.5,
      atividade: 'Videoaulas sobre o tema',
      duracao_minutos: Math.round(horas * 8),
    });
    // Reordena etapas
    etapas.forEach((e, i) => { e.etapa = i + 1; });
  }

  return etapas;
}

// ============================================================
// Simulado Adaptativo
// ============================================================

/**
 * Gera um simulado adaptativo baseado no perfil do usuário.
 * Questões mais difíceis se o usuário está indo bem, mais fáceis se está errando.
 *
 * @param {string} userId - ID do usuário
 * @param {string} banca - Banca examinadora
 * @param {string} materia - Matéria
 * @param {'facil'|'medio'|'dificil'} [dificuldade='medio'] - Dificuldade inicial
 * @param {Object[]} [predicoes=[]] - Predições para basear questões
 * @returns {Object} Simulado com questões e configurações
 */
export function gerarSimuladoAdaptativo(userId, banca, materia, dificuldade = 'medio', predicoes = []) {
  if (!userId || !banca || !materia) {
    throw new Error('userId, banca e matéria são obrigatórios');
  }

  // Busca performance anterior do usuário
  const performance = performanceStore.get(userId) || { acertos: 0, total: 0 };

  // Ajusta dificuldade baseada na performance
  if (performance.total >= 10) {
    const taxaAcerto = performance.acertos / performance.total;
    if (taxaAcerto >= 0.8 && dificuldade !== 'dificil') {
      dificuldade = 'dificil';
    } else if (taxaAcerto >= 0.6 && dificuldade === 'facil') {
      dificuldade = 'medio';
    } else if (taxaAcerto < 0.4 && dificuldade === 'dificil') {
      dificuldade = 'medio';
    } else if (taxaAcerto < 0.3 && dificuldade !== 'facil') {
      dificuldade = 'facil';
    }
  }

  // Quantidade de questões por dificuldade
  const numQuestoes = {
    facil: 10,
    medio: 15,
    dificil: 20,
  };

  // Gera questões baseadas nos tópicos das predições
  const topicos = predicoes.length > 0
    ? predicoes.slice(0, numQuestoes[dificuldade])
    : gerarTopicosGenericos(banca, 2).slice(0, numQuestoes[dificuldade]);

  const questoes = topicos.map((topico, index) => ({
    id: `q_${index + 1}`,
    topico: topico.topico || topico.nome,
    dificuldade: topico.nivel_dificuldade || dificuldade,
    estilo_cobranca: topico.estilo_cobranca || 'conceitual',
    enunciado: gerarEnunciadoSimulado(topico.topico || topico.nome, banca, topico.nivel_dificuldade || dificuldade),
    alternativas: gerarAlternativas(topico.topico || topico.nome),
    resposta_correta: 'C',
    explicacao: gerarExplicacao(topico.topico || topico.nome),
    armadilha: (topico.armadilhas || [])[0] || null,
  }));

  const simulado = {
    id: `sim_${randomCode(10)}`,
    user_id: userId,
    banca,
    materia,
    dificuldade,
    questoes,
    total_questoes: questoes.length,
    status: 'em_andamento',
    created_at: new Date().toISOString(),
    tempo_limite_minutos: questoes.length * 3,
    instrucoes: [
      `📋 Simulado adaptativo - ${banca} | ${materia}`,
      `📊 Dificuldade: ${dificuldade}`,
      `⏱️ Tempo: ${questoes.length * 3} minutos`,
      `📝 Questões: ${questoes.length}`,
      ``,
      `💡 As questões se adaptam ao seu nível de conhecimento!`,
    ].join('\n'),
  };

  // Registra sessão
  sessionsStore.set(simulado.id, {
    ...simulado,
    respostas: [],
    pontuacao: 0,
  });

  log.info('Simulado adaptativo gerado', {
    userId,
    banca,
    materia,
    dificuldade,
    questoes: questoes.length,
  });

  return simulado;
}

/**
 * Gera enunciado de questão simulada (placeholder estruturado).
 * @param {string} topico
 * @param {string} banca
 * @param {string} dificuldade
 * @returns {string}
 */
function gerarEnunciadoSimulado(topico, banca, dificuldade) {
  const estilos = {
    conceitual: `Considerando as disposições sobre ${topico} e a jurisprudência aplicável, assinale a alternativa correta.`,
    situacional: `Um servidor público de um órgão federal, no exercício de suas atribuições, depara-se com situação envolvendo ${topico}. Com base na legislação vigente e entendimentos dos tribunais, é correto afirmar que:`,
    jurisprudencia: `A respeito de ${topico}, à luz da jurisprudência predominante do ${banca === 'CESPE' ? 'STJ e STF' : 'TJ e STJ'}, julgue o item seguinte.`,
    legislacao_seca: `De acordo com a legislação vigente sobre ${topico}, assinale a opção que apresenta a afirmação correta.`,
  };

  const estilo = dificuldade === 'dificil' ? 'situacional' : 'conceitual';

  return estilos[estilo] || estilos.conceitual;
}

/**
 * Gera alternativas para questão simulada.
 * @param {string} topico
 * @returns {Object[]}
 */
function gerarAlternativas(topico) {
  return [
    { letra: 'A', texto: `A prática de ${topico} é regulada exclusivamente pela Constituição Federal, sem necessidade de legislação complementar.` },
    { letra: 'B', texto: `A aplicação de ${topico} deve observar os princípios da legalidade, impessoalidade, moralidade, publicidade e eficiência.` },
    { letra: 'C', texto: `O regime jurídico de ${topico} permite exceções expressamente previstas em lei, desde que observado o interesse público.` },
    { letra: 'D', texto: `A matéria de ${topico} é de competência exclusiva da União, vedada qualquer regulamentação estadual.` },
    { letra: 'E', texto: `A respeito de ${topico}, a doutrina majoritária entende que se aplica apenas ao Poder Executivo.` },
  ];
}

/**
 * Gera explicação para questão simulada.
 * @param {string} topico
 * @returns {string}
 */
function gerarExplicacao(topico) {
  return `A alternativa C é a correta. O regime jurídico aplicável a ${topico} admite exceções quando expressamente previstas em lei, desde que fundamentadas no interesse público. As demais alternativas incorrem em generalizações indevidas ou afirmações contrárias à jurisprudência predominante.`;
}

// ============================================================
// Análise de Performance
// ============================================================

/**
 * Analisa a performance do usuário e gera recomendações.
 * @param {string} userId
 * @param {Object[]} [historicoSimulados=[]] - Histórico de simulados
 * @returns {Object} Análise completa
 */
export function analisarPerformance(userId, historicoSimulados = []) {
  // Busca performance acumulada
  const performance = performanceStore.get(userId) || { acertos: 0, total: 0, topicos_fracos: [], topicos_fortes: [] };

  const taxaGeral = performance.total > 0
    ? Math.round((performance.acertos / performance.total) * 100)
    : 0;

  // Analisa tendência
  let tendencia = 'estavel';
  if (historicoSimulados.length >= 3) {
    const ultimos = historicoSimulados.slice(-3);
    const primeiros = ultimos.slice(0, 1);
    const ultimos2 = ultimos.slice(1);

    const mediaPrimeira = primeiros[0]?.porcentagem || 0;
    const mediaUltima = ultimos2.reduce((s, h) => s + (h.porcentagem || 0), 0) / ultimos2.length;

    if (mediaUltima > mediaPrimeira + 10) tendencia = 'melhorando';
    else if (mediaUltima < mediaPrimeira - 10) tendencia = 'precisa_atencao';
  }

  // Gera recomendações baseadas nos pontos fracos
  const recomendacoes = [];

  if (performance.topicos_fracos && performance.topicos_fracos.length > 0) {
    recomendacoes.push({
      tipo: 'reforcar',
      topicos: performance.topicos_fracos.slice(0, 3),
      mensagem: `📚 Recomendamos reforçar os estudos em: ${performance.topicos_fracos.slice(0, 3).join(', ')}`,
    });
  }

  if (taxaGeral < 50) {
    recomendacoes.push({
      tipo: 'base',
      mensagem: '📖 Foque na revisão dos conceitos fundamentais antes de avançar para questões difíceis.',
    });
  } else if (taxaGeral >= 70) {
    recomendacoes.push({
      tipo: 'avançar',
      mensagem: '🚀 Ótimo desempenho! Hora de aumentar a dificuldade e focar nos temas mais cobrados.',
    });
  }

  recomendacoes.push({
    tipo: 'consistencia',
    mensagem: `🔥 Mantenha sua streak de estudos! A constância é o maior diferencial.`,
  });

  const analise = {
    user_id: userId,
    taxa_geral: taxaGeral,
    total_questoes: performance.total,
    acertos: performance.acertos,
    tendencia,
    topicos_fortes: performance.topicos_fortes || [],
    topicos_fracos: performance.topicos_fracos || [],
    recomendacoes,
    proximo_passo: taxaGeral < 50
      ? 'Revisar conceitos fundamentais'
      : taxaGeral < 70
        ? 'Praticar mais questões comentadas'
        : 'Focar em temas de alta probabilidade',
    created_at: new Date().toISOString(),
    resumo: taxaGeral >= 70
      ? `📊 Performance: ${taxaGeral}% - Bom desempenho! Continue assim!`
      : taxaGeral >= 50
        ? `📊 Performance: ${taxaGeral}% - Na média. Dá para melhorar!`
        : `📊 Performance: ${taxaGeral}% - Precisa de mais revisão. Não desista!`,
  };

  return analise;
}

/**
 * Determina o que o usuário deve estudar na próxima sessão.
 * Baseado na performance anterior e nas predições.
 * @param {string} userId
 * @param {Object[]} [predicoes=[]]
 * @param {Object} [analise=null]
 * @returns {Object} Próxima sessão recomendada
 */
export function getNextSession(userId, predicoes = [], analise = null) {
  // Se não tem análise, gera uma
  if (!analise) {
    analise = analisarPerformance(userId);
  }

  // Decide o foco da sessão
  let foco = 'revisao';
  let topicosRecomendados = [];

  if (analise.topicos_fracos && analise.topicos_fracos.length > 0) {
    foco = 'reforco';
    topicosRecomendados = analise.topicos_fracos.slice(0, 2);
  } else if (predicoes.length > 0) {
    foco = 'predicoes';
    topicosRecomendados = predicoes.slice(0, 3).map((p) => p.topico);
  }

  // Busca o plano de estudos ativo
  const plano = getPlanoEstudos(userId);

  let proximoTopico = null;
  if (plano && plano.topicos) {
    const proximo = plano.topicos.find((t) => t.status === 'nao_iniciado');
    if (proximo) {
      proximoTopico = proximo.nome;
    } else {
      proximoTopico = 'Revisão geral';
    }
  }

  const duracao = analise.taxa_geral < 50 ? 60 : analise.taxa_geral < 70 ? 90 : 45;

  return {
    user_id: userId,
    foco,
    topicos_recomendados: topicosRecomendados,
    proximo_topico_plano: proximoTopico,
    duracao_recomendada_minutos: duracao,
    atividade: foco === 'reforco'
      ? 'Revisar pontos fracos com questões comentadas'
      : foco === 'predicoes'
        ? 'Estudar tópicos de alta probabilidade'
        : 'Revisão geral do conteúdo',
    dificuldade_recomendada: analise.taxa_geral < 40 ? 'facil' : analise.taxa_geral < 70 ? 'medio' : 'dificil',
    created_at: new Date().toISOString(),
  };
}

/**
 * Registra resultado de simulado para análise de performance.
 * @param {string} userId
 * @param {Object} resultado
 * @param {number} resultado.acertos
 * @param {number} resultado.total
 * @param {string[]} resultado.topicosAcertados
 * @param {string[]} resultado.topicosErrados
 */
export function registrarResultadoSimulado(userId, resultado) {
  const performance = performanceStore.get(userId) || {
    acertos: 0,
    total: 0,
    topicos_fortes: [],
    topicos_fracos: [],
    historico: [],
  };

  performance.acertos += resultado.acertos;
  performance.total += resultado.total;

  // Atualiza tópicos fortes e fracos
  if (resultado.topicosAcertados) {
    performance.topicos_fortes = [...new Set([
      ...performance.topicos_fortes,
      ...resultado.topicosAcertados,
    ])];
  }

  if (resultado.topicosErrados) {
    performance.topicos_fracos = [...new Set([
      ...performance.topicos_fracos,
      ...resultado.topicosErrados,
    ])];
  }

  // Adiciona ao histórico
  performance.historico = performance.historico || [];
  performance.historico.push({
    acertos: resultado.acertos,
    total: resultado.total,
    porcentagem: Math.round((resultado.acertos / resultado.total) * 100),
    data: new Date().toISOString(),
  });

  performanceStore.set(userId, performance);
}

export default {
  gerarPlanoEstudos,
  getPlanoEstudos,
  getResumoTopico,
  gerarSimuladoAdaptativo,
  analisarPerformance,
  getNextSession,
  registrarResultadoSimulado,
};
