/**
 * Modelos/Schemas do Gabaritou v2.
 *
 * Definição de todas as estruturas de dados da aplicação via JSDoc.
 * Não utiliza ORM — serve como documentação e referência para
 * validação manual e estrutura dos dados em JSON/Supabase.
 *
 * Todas as datas são armazenadas em formato ISO 8601 (string).
 * Todos os IDs são strings UUID v4 (ou auto-incremento numérico em JSON).
 */

// ============================================================
// User (Usuário)
// ============================================================

/**
 * Representa um usuário da plataforma Gabaritou.
 *
 * @typedef {Object} User
 * @property {string} id - Identificador único (UUID)
 * @property {number} telegram_id - ID do Telegram do usuário
 * @property {string} name - Nome do usuário
 * @property {'free'|'premium'|'trial'} plan - Plano atual do usuário
 * @property {string|null} banca - Banca de concurso principal (ex: 'CESPE', 'FGV', 'VUNESP')
 * @property {string|null} estado - UF do estado do usuário (ex: 'SP', 'RJ', 'DF')
 * @property {number} pontos - Pontuação acumulada na comunidade/gamificação
 * @property {number} sequencia - Sequência atual de dias consecutivos de estudo (streak)
 * @property {number} nivel - Nível do usuário na comunidade (calculado por pontos)
 * @property {string} referral_code - Código único de referral do usuário para convidar amigos
 * @property {string|null} referred_by - Código de referral de quem indicou o usuário
 * @property {string} created_at - Data de criação da conta (ISO 8601)
 * @property {string|null} premium_until - Data de expiração do plano premium (ISO 8601), null se free
 * @property {string[]} bancas_favoritas - Lista de bancas favoritas do usuário
 * @property {number} total_predicoes - Total de predições consultadas
 * @property {number} acertos_reportados - Total de acertos reportados pelo usuário
 * @property {Object} preferencias - Preferências do usuário
 * @property {boolean} preferencias.notificacoes - Receber notificações de novas predições
 * @property {boolean} preferencias.resumo_semanal - Receber resumo semanal por Telegram
 * @property {string|null} cargo - Cargo alvo do concurso (ex: 'Analista Judiciário', 'Auditor Fiscal')
 */

// ============================================================
// Prediction (Predição de Tópico)
// ============================================================

/**
 * Representa uma predição de tópico que pode cair em uma prova.
 *
 * @typedef {Object} Prediction
 * @property {string} id - Identificador único da predição
 * @property {string} banca - Banca examinadora (ex: 'CESPE', 'FGV', 'VUNESP', 'FCC')
 * @property {string} materia - Matéria principal (ex: 'Direito Administrativo', 'Raciocínio Lógico')
 * @property {string} topico - Tópico específico (ex: 'Atos Administrativos', 'Licitações')
 * @property {string[]} subtopicos - Subtópicos relacionados
 * @property {number} probabilidade - Probabilidade de cair na próxima prova (0 a 100)
 * @property {number} recencia - Recência da última cobrança em dias (0 = cobrado recentemente)
 * @property {number} peso_historico - Peso baseado no histórico de cobranças (0 a 10)
 * @property {string} nivel_dificuldade - Nível de dificuldade ('facil', 'medio', 'dificil', 'muito_dificil')
 * @property {string} estilo_cobranca - Como a banca costuma cobrar ('conceitual', 'situacional', 'jurisprudencia', 'legislacao_seca')
 * @property {string[]} armadilhas - Lista de armadilhas comuns da banca sobre o tema
 * @property {string[]} dicas - Dicas de estudo para o tema
 * @property {string[]} provas_onde_caiu - Lista de provas onde o tema já foi cobrado
 * @property {string[]} referencias_legais - Referências legislativas (Leis, Artigos, Súmulas)
 * @property {string|null} ultima_cobranca - Data da última vez que foi cobrado (ISO 8601)
 * @property {number} total_feedbacks - Total de feedbacks recebidos sobre esta predição
 * @property {number} acertos_feedbacks - Total de feedbacks confirmando que a predição acertou
 */

// ============================================================
// AccuracyReport (Relatório de Acurácia)
// ============================================================

/**
 * Relatório comparando predições com o que realmente caiu na prova.
 *
 * @typedef {Object} AccuracyReport
 * @property {string} id - Identificador único do relatório
 * @property {string} concurso - Nome do concurso (ex: 'TRF-5 2024', 'STJ 2024')
 * @property {string} banca - Banca examinadora
 * @property {string} data_prova - Data da realização da prova (ISO 8601)
 * @property {number} total_questoes - Total de questões da prova (geralmente na matéria foco)
 * @property {number} acertos - Quantidade de questões que foram previstas corretamente
 * @property {number} porcentagem - Porcentagem de acerto (0 a 100)
 * @property {string[]} temas_mapeados - Lista de temas que a Gabaritou previu
 * @property {string[]} temas_acertados - Lista de temas que realmente caíram e foram previstos
 * @property {string[]} temas_nao_previstos - Temas que caíram mas não foram previstos
 * @property {string[]} temas_previstos_nao_cairam - Temas previstos que não caíram
 * @property {boolean} publicado - Se o relatório está visível publicamente
 * @property {string} created_at - Data de criação do relatório (ISO 8601)
 * @property {Object|null} share_image_data - Dados para gerar imagem compartilhável
 * @property {string} share_image_data.titulo - Título do gráfico
 * @property {number} share_image_data.acertos - Número de acertos
 * @property {number} share_image_data.erros - Número de erros
 * @property {number} share_image_data.porcentagem - Porcentagem de acerto
 */

// ============================================================
// CommunityEvent (Evento da Comunidade)
// ============================================================

/**
 * Registro de ações do usuário na comunidade/gamificação.
 *
 * @typedef {Object} CommunityEvent
 * @property {string} id - Identificador único do evento
 * @property {string} tipo - Tipo do evento:
 *   'prediction_hit' - Acertou uma predição
 *   'study_streak' - Manteve sequência de estudo
 *   'referral' - Indicou um amigo
 *   'challenge_win' - Venceu um desafio
 *   'login' - Login diário
 *   'premium_upgrade' - Assinou premium
 *   'trial_start' - Iniciou período de teste
 *   'feedback_submitted' - Enviou feedback de predição
 * @property {string} user_id - ID do usuário que realizou a ação
 * @property {string|null} concurso_id - ID do concurso relacionado (se aplicável)
 * @property {number} pontos - Pontos ganhos com esta ação
 * @property {Object|null} metadata - Dados adicionais do evento
 * @property {string} created_at - Data do evento (ISO 8601)
 */

// ============================================================
// B2BPartner (Parceiro B2B)
// ============================================================

/**
 * Empresa/instituição parceira que utiliza a API Gabaritou.
 *
 * @typedef {Object} B2BPartner
 * @property {string} id - Identificador único do parceiro
 * @property {string} nome - Nome da empresa/instituição
 * @property {string} api_key - Chave de API para autenticação
 * @property {'basic'|'pro'|'enterprise'} plano - Plano B2B do parceiro
 * @property {number} alunos_count - Número de alunos/alunos ativos
 * @property {string} created_at - Data de criação do cadastro (ISO 8601)
 * @property {boolean} active - Se o parceiro está ativo
 * @property {string|null} contato_email - E-mail de contato
 * @property {string|null} contato_nome - Nome do contato principal
 * @property {string|null} cnpj - CNPJ da empresa
 * @property {number} mes_atual_uso - Total de chamadas API no mês atual
 * @property {number} limite_mensal - Limite de chamadas mensais (-1 = ilimitado no enterprise)
 */

// ============================================================
// DataLicense (Licença de Dados)
// ============================================================

/**
 * Licença para uso dos dados/predições da Gabaritou.
 *
 * @typedef {Object} DataLicense
 * @property {string} id - Identificador único da licença
 * @property {string} comprador - Nome do comprador da licença
 * @property {string} tipo - Tipo de dado licenciado:
 *   'predictions' - Dados de predições
 *   'accuracy_reports' - Relatórios de acurácia
 *   'topic_trends' - Tendências de temas
 *   'full_dataset' - Dataset completo
 * @property {'mensal'|'trimestral'|'semestral'|'anual'} periodo - Período da licença
 * @property {number} preco - Valor pago pela licença
 * @property {string[]} dados_acessados - Lista de tipos de dados que podem ser acessados
 * @property {string} created_at - Data de criação (ISO 8601)
 * @property {string|null} expires_at - Data de expiração (ISO 8601)
 * @property {boolean} active - Se a licença está ativa
 * @property {number} acessos_mes - Total de acessos no mês atual
 */

// ============================================================
// StudyPlan (Plano de Estudos)
// ============================================================

/**
 * Plano de estudos personalizado gerado para o usuário.
 *
 * @typedef {Object} StudyPlan
 * @property {string} id - Identificador único do plano
 * @property {string} user_id - ID do usuário dono do plano
 * @property {string} banca - Banca de concurso alvo
 * @property {string} cargo - Cargo alvo
 * @property {StudyTopic[]} topicos - Lista de tópicos do plano de estudos
 * @property {number} horas_estimadas - Horas totais estimadas de estudo
 * @property {number} dias_estimados - Dias estimados para completar o plano
 * @property {number} horas_diarias - Horas diárias recomendadas
 * @property {string} created_at - Data de criação do plano (ISO 8601)
 * @property {'ativo'|'concluido'|'abandonado'} status - Status atual do plano
 * @property {number} progresso - Progresso do plano em porcentagem (0 a 100)
 */

/**
 * Tópico dentro de um plano de estudos.
 * @typedef {Object} StudyTopic
 * @property {string} nome - Nome do tópico
 * @property {number} prioridade - Prioridade (1 = mais importante, 5 = menos)
 * @property {number} horas - Horas estimadas para este tópico
 * @property {'nao_iniciado'|'em_andamento'|'revisao'|'concluido'} status - Status do tópico
 * @property {string[]} materiais - Materiais recomendados para estudo
 * @property {number} ordem - Ordem recomendada de estudo
 */

// ============================================================
// Feedback (Feedback de Predição)
// ============================================================

/**
 * Feedback do usuário sobre uma predição após a prova.
 *
 * @typedef {Object} PredictionFeedback
 * @property {string} id - Identificador único
 * @property {string} predicao_id - ID da predição referenciada
 * @property {string} user_id - ID do usuário que deu o feedback
 * @property {boolean} acertou - Se a predição estava correta (o tema caiu na prova)
 * @property {string|null} concurso - Nome do concurso/prova
 * @property {string|null} observacao - Observação adicional do usuário
 * @property {string} created_at - Data do feedback (ISO 8601)
 */

// ============================================================
// Challenge (Desafio/Batalha de Predições)
// ============================================================

/**
 * Desafio entre usuários para ver quem acerta mais predições.
 *
 * @typedef {Object} Challenge
 * @property {string} id - Identificador único do desafio
 * @property {string} concurso - Concurso alvo do desafio
 * @property {string} banca - Banca do desafio
 * @property {string} criador_id - ID do usuário criador
 * @property {ChallengeParticipant[]} participantes - Lista de participantes
 * @property {string} materia - Matéria foco do desafio
 * @property {string[]} topicos_escolhidos - Tópicos que os participantes devem palpitar
 * @property {number} pontos_acerto - Pontos por acerto (padrão: 100)
 * @property {'aberto'|'em_andamento'|'finalizado'|'cancelado'} status - Status do desafio
 * @property {string} created_at - Data de criação (ISO 8601)
 * @property {string|null} finalized_at - Data de finalização (ISO 8601)
 * @property {Object|null} resultado - Resultado final quando finalizado
 */

/**
 * Participante de um desafio.
 * @typedef {Object} ChallengeParticipant
 * @property {string} user_id - ID do usuário
 * @property {string} user_name - Nome do usuário
 * @property {string[]} palpites - Tópicos que o participante apostou
 * @property {number} acertos - Número de acertos (calculado ao finalizar)
 * @property {number} pontuacao - Pontuação total (calculado ao finalizar)
 */

// ============================================================
// ProvaDay (Acompanhamento em Tempo Real)
// ============================================================

/**
 * Sessão de acompanhamento em tempo real durante o dia da prova.
 *
 * @typedef {Object} ProvaDaySession
 * @property {string} id - Identificador único da sessão
 * @property {string} concurso_id - ID do concurso
 * @property {string} banca - Banca examinadora
 * @property {ProvaDayReport[]} relatos - Relatos dos usuários durante a prova
 * @property {'aguardando'|'em_andamento'|'finalizada'} status - Status da sessão
 * @property {string} created_at - Data de início (ISO 8601)
 * @property {string|null} finalized_at - Data de finalização (ISO 8601)
 * @property {Object|null} relatorio_final - Relatório final gerado
 * @property {number} relatorio_final.predicoes_acertadas
 * @property {number} relatorio_final.predicoes_total
 * @property {number} relatorio_final.porcentagem_acerto
 */

/**
 * Relato individual de um usuário durante a prova.
 * @typedef {Object} ProvaDayReport
 * @property {string} user_id - ID do usuário
 * @property {number} questao_index - Número da questão relatada
 * @property {string} topico_relato - Tema relatado pelo usuário
 * @property {string} created_at - Data do relato (ISO 8601)
 */

// ============================================================
// Ranking Entry
// ============================================================

/**
 * Entrada individual no ranking da comunidade.
 * @typedef {Object} RankingEntry
 * @property {string} user_id - ID do usuário
 * @property {string} user_name - Nome do usuário
 * @property {number} pontos - Total de pontos
 * @property {number} posicao - Posição no ranking
 * @property {number} sequencia - Sequência de dias de estudo
 * @property {string} nivel - Nível do usuário
 * @property {string[]} badges - Lista de conquistas/badges
 */

export default {
  // Este arquivo serve como documentação dos schemas.
  // Importe as typedefs via JSDoc em outros arquivos.
};
