/**
 * Rotas AI Tutor - Gabaritou v2
 * Endpoints para plano de estudos, resumos, simulados adaptativos e análise de desempenho.
 */
import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

// Armazenamento em memória
const planosEstudo = new Map();
const simuladosAtivos = new Map();

/**
 * GET /api/ai-tutor/plano/:userId
 * Obtém o plano de estudos atual do usuário.
 */
router.get('/plano/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    if (!planosEstudo.has(userId)) {
      return res.json({
        sucesso: true,
        mensagem: 'Nenhum plano de estudos encontrado. Crie um usando POST /api/ai-tutor/plano/:userId',
        dados: null,
      });
    }

    const plano = planosEstudo.get(userId);

    res.json({
      sucesso: true,
      mensagem: 'Plano de estudos',
      dados: plano,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar plano de estudos',
      codigo: 'ERRO_PLANO_ESTUDOS',
      detalhes: err.message,
    });
  }
});

/**
 * POST /api/ai-tutor/plano/:userId
 * Gera um novo plano de estudos personalizado.
 * Body: { banca, cargo, horasDiarias }
 */
router.post('/plano/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { banca, cargo, horasDiarias = 3 } = req.body;

    if (!banca || !cargo) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campos obrigatórios: banca, cargo',
        codigo: 'CAMPOS_OBRIGATORIOS',
      });
    }

    const horas = parseInt(horasDiarias, 10);
    if (horas < 1 || horas > 12) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Horas diárias deve ser entre 1 e 12',
        codigo: 'HORAS_INVALIDAS',
      });
    }

    const plano = gerarPlanoEstudo(banca, cargo, horas);
    plano.userId = userId;
    plano.dataGeracao = new Date().toISOString();

    planosEstudo.set(userId, plano);

    res.status(201).json({
      sucesso: true,
      mensagem: `📋 Plano de estudos gerado para ${cargo} - ${banca} (${horas}h/dia)`,
      dados: plano,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao gerar plano de estudos',
      codigo: 'ERRO_GERAR_PLANO',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/ai-tutor/topico/:topicoId/summary
 * Resumo de um tópico específico.
 */
router.get('/topico/:topicoId/summary', (req, res) => {
  try {
    const { topicoId } = req.params;

    const topicos = {
      'direitos_fundamentais': {
        id: 'direitos_fundamentais',
        nome: 'Direitos Fundamentais',
        resumo: 'Os direitos fundamentais são normas que protegem a dignidade da pessoa humana. Compreendem direitos individuais, coletivos, sociais, de nacionalidade e políticos. Previstos principalmente no art. 5º da CF/88.',
        pontosPrincipais: [
          'Art. 5º, caput: igualdade perante a lei',
          'Direitos e deveres individuais e coletivos (arts. 5º a 17)',
          'Aplicabilidade imediata (§1º do art. 5º)',
          'Proibição de discriminação (XLII, XLIII, XLIV)',
          'Direito de resposta proporcional ao agravo (V)',
          'Inviolabilidade da intimidade, vida privada, honra e imagem (X)',
        ],
        dicaProva: 'CESPE costuma cobrar a diferença entre direitos e garantias fundamentais. Fique atento ao §2º do art. 5º sobre tratados internacionais.',
        questoesRecomendadas: 25,
        tempoEstimado: '2h30',
        dificuldade: 'intermediario',
      },
      'controle_constitucionalidade': {
        id: 'controle_constitucionalidade',
        nome: 'Controle de Constitucionalidade',
        resumo: 'O controle de constitucionalidade verifica a adequação das normas inferiores à Constituição Federal. Pode ser difuso (incidental) ou concentrado (principal), com via de ação ou de defesa.',
        pontosPrincipais: [
          'ADI, ADC, ADPF e ADIN',
          'Legitimados para propositura (art. 103, CF)',
          'Efeito vinculante e erga omnes',
          'Cláusula de reserva de plenário (art. 97)',
          'Senado Federal: suspender execução de lei (art. 52, X)',
          'Modulação dos efeitos da decisão',
        ],
        dicaProva: 'Atenção à diferença entre ADI e ADPF. A ADPF é utilizada quando não há mais another meio effective.',
        questoesRecomendadas: 30,
        tempoEstimado: '3h',
        dificuldade: 'avancado',
      },
      'licitacoes': {
        id: 'licitacoes',
        nome: 'Licitações (Lei 14.133/2021)',
        resumo: 'A Nova Lei de Licitações (Lei 14.133/2021) trouxe mudanças significativas no processo licitatório. Substituiu a Lei 8.666/93 e introduziu novas modalidades e procedimentos.',
        pontosPrincipais: [
          'Modalidades: pregão, concorrência, concurso, leilão, diálogo competitivo',
          'Novidade: diálogo competitivo',
          'Contratação integrada e semi-integrada',
          'Critérios de julgamento: menor preço, melhor técnica, técnica e preço',
          'Banco de preços em práticas e sustentável',
          'Sanções administrativas',
        ],
        dicaProva: 'Cuidado para não confundir as modalidades da nova lei com as da lei antiga. FGV e FCC cobram muito as diferenças.',
        questoesRecomendadas: 35,
        tempoEstimado: '4h',
        dificuldade: 'avancado',
      },
    };

    const topico = topicos[topicoId.replace(/[^a-z_]/g, '').toLowerCase()];

    if (!topico) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Tópico não encontrado',
        codigo: 'TOPICO_NAO_ENCONTRADO',
        topicoId,
      });
    }

    res.json({
      sucesso: true,
      dados: topico,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar resumo do tópico',
      codigo: 'ERRO_TOPICO_SUMMARY',
      detalhes: err.message,
    });
  }
});

/**
 * POST /api/ai-tutor/simulado/:userId
 * Gera simulado adaptativo baseado no desempenho do usuário.
 * Body: { banca, materia, quantidadeQuestoes (default 10) }
 */
router.post('/simulado/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { banca, materia, quantidadeQuestoes = 10 } = req.body;

    if (!banca || !materia) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campos obrigatórios: banca, materia',
        codigo: 'CAMPOS_OBRIGATORIOS',
      });
    }

    const qtd = parseInt(quantidadeQuestoes, 10);
    if (qtd < 5 || qtd > 50) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Quantidade de questões deve ser entre 5 e 50',
        codigo: 'QUANTIDADE_INVALIDA',
      });
    }

    // Verificar se já existe simulado ativo
    if (simuladosAtivos.has(userId)) {
      return res.json({
        sucesso: true,
        mensagem: 'Você já possui um simulado em andamento',
        dados: simuladosAtivos.get(userId),
      });
    }

    const simulado = gerarSimuladoAdaptativo(banca, materia, qtd);
    simulado.userId = userId;
    simulado.dataInicio = new Date().toISOString();
    simulado.status = 'em_andamento';

    simuladosAtivos.set(userId, simulado);

    res.status(201).json({
      sucesso: true,
      mensagem: `📝 Simulado adaptativo gerado: ${qtd} questões de ${materia}`,
      dados: {
        id: simulado.id,
        banca,
        materia,
        totalQuestoes: qtd,
        tempoEstimado: `${Math.ceil(qtd * 3)} minutos`,
        dificuldade: 'adaptativa',
        questoes: simulado.questoes,
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao gerar simulado',
      codigo: 'ERRO_SIMULADO',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/ai-tutor/performance/:userId
 * Análise de desempenho do usuário.
 */
router.get('/performance/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    // Em produção: buscar dados reais do banco
    const performance = {
      userId,
      periodo: 'Últimos 30 dias',
      geral: {
        acertos: 127,
        erros: 43,
        total: 170,
        taxaAcerto: '74.7%',
        tendencia: '+5.3%',
      },
      porMateria: [
        { materia: 'Direito Constitucional', acertos: 45, erros: 12, taxa: '78.9%', tendencia: 'subindo' },
        { materia: 'Direito Administrativo', acertos: 38, erros: 15, taxa: '71.7%', tendencia: 'estavel' },
        { materia: 'Português', acertos: 28, erros: 10, taxa: '73.7%', tendencia: 'subindo' },
        { materia: 'Raciocínio Lógico', acertos: 16, erros: 6, taxa: '72.7%', tendencia: 'descendo' },
      ],
      pontosFracos: [
        'Responsabilidade Civil do Estado',
        'Regência Verbal',
        'Análise Combinatória',
      ],
      pontosFortes: [
        'Direitos Fundamentais',
        'Interpretação de Texto',
        'Proposições e Conectivos',
      ],
      recomendacoes: [
        'Refocar em Responsabilidade Civil do Estado - sua taxa de acerto é 45%',
        'Manter o ritmo em Direitos Fundamentais - performance acima da média',
        'Praticar mais Análise Combinatória - tendencia de queda detectada',
      ],
    };

    res.json({
      sucesso: true,
      mensagem: 'Análise de desempenho',
      dados: performance,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar análise de desempenho',
      codigo: 'ERRO_PERFORMANCE',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/ai-tutor/next/:userId
 * Recomendação do que estudar a seguir.
 */
router.get('/next/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    // Em produção: algoritmo real baseado em desempenho, prazos e bancas alvo
    const recomendacao = {
      userId,
      estudoAtual: {
        materia: 'Direito Administrativo',
        topico: 'Contratos Administrativos',
        razao: 'Alta probabilidade na próxima prova + sua taxa de acerto pode melhorar',
        prioridade: 'alta',
      },
      proximosPassos: [
        { ordem: 1, materia: 'Dir. Administrativo', topico: 'Contratos', tempo: '2h', motivo: 'Probabilidade 85% na próxima prova' },
        { ordem: 2, materia: 'Dir. Constitucional', topico: 'Controle de Constitucionalidade', tempo: '1.5h', motivo: 'Revisão necessária - taxa em queda' },
        { ordem: 3, materia: 'Português', topico: 'Regência Verbal', tempo: '1h', motivo: 'Ponto fraco identificado' },
      ],
      metaSemanal: {
        topicos: 8,
        questoes: 150,
        horasEstimadas: 18,
      },
      motivacao: '💡 Foco nos tópicos de alta probabilidade primeiro! Você está a 15% da meta semanal.',
    };

    res.json({
      sucesso: true,
      mensagem: 'Recomendação de estudo',
      dados: recomendacao,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao gerar recomendação',
      codigo: 'ERRO_NEXT_STUDY',
      detalhes: err.message,
    });
  }
});

// ─── Funções auxiliares ──────────────────────────────────────────────

function gerarPlanoEstudo(banca, cargo, horasDiarias) {
  const semanas = 8;
  const diasPorSemana = Math.min(6, Math.ceil(horasDiarias * 2));

  const materias = [
    { nome: 'Direito Constitucional', peso: 0.25, horasSemana: Math.ceil(horasDiarias * diasPorSemana * 0.25) },
    { nome: 'Direito Administrativo', peso: 0.25, horasSemana: Math.ceil(horasDiarias * diasPorSemana * 0.25) },
    { nome: 'Português', peso: 0.20, horasSemana: Math.ceil(horasDiarias * diasPorSemana * 0.20) },
    { nome: 'Raciocínio Lógico', peso: 0.15, horasSemana: Math.ceil(horasDiarias * diasPorSemana * 0.15) },
    { nome: 'Direito Penal', peso: 0.15, horasSemana: Math.ceil(horasDiarias * diasPorSemana * 0.15) },
  ];

  const cronograma = [];
  for (let s = 1; s <= semanas; s++) {
    const semana = {
      semana: s,
      foco: s <= 3 ? 'Revisão de Base' : s <= 6 ? 'Aprofundamento' : 'Simulados e Revisão Final',
      materias: materias.map((m) => ({
        materia: m.nome,
        horas: m.horasSemana,
        topicos: getTopicosSemana(m.nome, s),
      })),
    };
    cronograma.push(semana);
  }

  return {
    banca,
    cargo,
    horasDiarias,
    diasPorSemana,
    duracaoTotal: `${semanas} semanas`,
    horasTotal: horasDiarias * diasPorSemana * semanas,
    materias: materias.map((m) => ({
      nome: m.nome,
      peso: `${(m.peso * 100).toFixed(0)}%`,
      horasSemana: m.horasSemana,
    })),
    cronograma,
    meta: `Aprovação em ${cargo} - ${banca}`,
  };
}

function getTopicosSemana(materia, semana) {
  const topicosPorMateriaSemana = {
    'Direito Constitucional': {
      1: ['Direitos Fundamentais', 'Nacionalidade'],
      2: ['Direitos Políticos', 'Organização do Estado'],
      3: ['Poder Legislativo', 'Processo Legislativo'],
      4: ['Controle de Constitucionalidade', 'Remédios Constitucionais'],
      5: ['Administração Pública', 'Servidores'],
      6: ['Poder Judiciário', 'Funções Essenciais'],
      7: ['Simulado Dir. Constitucional'],
      8: ['Revisão Geral Dir. Constitucional'],
    },
    'Direito Administrativo': {
      1: ['Princípios', 'Atos Administrativos'],
      2: ['Licitações', 'Contratos'],
      3: ['Servidores', 'Responsabilidade Civil'],
      4: ['Poderes Administrativos', 'Intervenção do Estado'],
      5: ['Serviços Públicos', 'Concessões'],
      6: ['Improbidade Administrativa', 'Processo Administrativo'],
      7: ['Simulado Dir. Administrativo'],
      8: ['Revisão Geral Dir. Administrativo'],
    },
  };

  const base = topicosPorMateriaSemana[materia] || {};
  return base[semana] || [`Estudo ${materia} - Semana ${semana}`];
}

function gerarSimuladoAdaptativo(banca, materia, quantidade) {
  const questoes = [];
  const dificuldades = ['facil', 'medio', 'dificil'];
  const topicos = getTopicosMateria(materia);

  for (let i = 0; i < quantidade; i++) {
    const dificuldade = dificuldades[Math.floor(Math.random() * dificuldades.length)];
    const topico = topicos[Math.floor(Math.random() * topicos.length)];

    questoes.push({
      numero: i + 1,
      enunciado: `(Q${i + 1}) Sobre ${topico}, assinale a alternativa correta conforme a jurisprudência atual do ${banca}:`,
      alternativas: {
        A: `Alternativa A sobre ${topico} - assertiva verdadeira ou falsa`,
        B: `Alternativa B sobre ${topico} - assertiva verdadeira ou falsa`,
        C: `Alternativa C sobre ${topico} - assertiva verdadeira ou falsa`,
        D: `Alternativa D sobre ${topico} - assertiva verdadeira ou falsa`,
        E: `Alternativa E sobre ${topico} - assertiva verdadeira ou falsa`,
      },
      gabarito: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)],
      dificuldade,
      topico,
      explicacao: `Explicação detalhada sobre ${topico} na perspectiva do ${banca}. A alternativa correta é fundamentada na legislação vigente e na jurisprudência mais recente.`,
    });
  }

  return {
    id: `sim-${Date.now()}`,
    banca,
    materia,
    questoes,
    adaptativo: true,
    estrategia: 'Questões adaptadas ao nível do usuário com foco nos pontos de maior probabilidade na prova.',
  };
}

function getTopicosMateria(materia) {
  const topicosMap = {
    'Direito Constitucional': ['Direitos Fundamentais', 'Controle de Constitucionalidade', 'Poder Legislativo', 'Organização do Estado', 'Remédios Constitucionais'],
    'Direito Administrativo': ['Licitações', 'Contratos', 'Atos Administrativos', 'Poderes Administrativos', 'Servidores'],
    'Português': ['Interpretação de Texto', 'Concordância', 'Crase', 'Regência', 'Pontuação'],
    'Raciocínio Lógico': ['Proposições', 'Tabela-Verdade', 'Equivalências', 'Probabilidade', 'Análise Combinatória'],
  };
  return topicosMap[materia] || ['Tópico 1', 'Tópico 2', 'Tópico 3'];
}

export default router;
