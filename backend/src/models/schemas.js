/**
 * Modelos/Schemas do Gabaritou v3 — BeConfident Model.
 *
 * Definição de todas as estruturas de dados da aplicação via JSDoc.
 * Inclui campos do modelo BeConfident: adaptive_level, fatigue_score,
 * last_question_time, intercepted, micro-sessions.
 *
 * Todas as datas são armazenadas em formato ISO 8601 (string).
 * Todos os IDs são strings UUID v4.
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
 * @property {string|null} banca_principal - Banca de concurso principal (ex: 'CESPE', 'FGV')
 * @property {string|null} estado - UF do estado do usuário (ex: 'SP', 'RJ', 'DF')
 * @property {number} pontos - Pontuação acumulada na comunidade/gamificação
 * @property {number} sequencia - Sequência atual de dias consecutivos de estudo (streak)
 * @property {number} nivel - Nível do usuário na comunidade (calculado por pontos)
 * @property {string} referral_code - Código único de referral do usuário
 * @property {string|null} referred_by - Código de referral de quem indicou o usuário
 * @property {string} created_at - Data de criação da conta (ISO 8601)
 * @property {string|null} premium_until - Data de expiração do plano premium (ISO 8601)
 * @property {string[]} bancas_favoritas - Lista de bancas favoritas do usuário
 * @property {number} total_predicoes - Total de predições consultadas
 * @property {number} acertos_reportados - Total de acertos reportados pelo usuário
 * @property {Object} preferencias - Preferências do usuário
 * @property {boolean} preferencias.notificacoes - Receber notificações de novas predições
 * @property {boolean} preferencias.resumo_semanal - Receber resumo semanal por Telegram
 * @property {string|null} cargo - Cargo alvo do concurso
 * @property {number} adaptive_level - Nível adaptativo do BeConfident (1 a 6)
 * @property {number} total_micro_sessions - Total de micro-sessões completadas
 * @property {number} total_interceptions - Total de interceptações pelo bot
 */

// ============================================================
// StudyProgress (Progresso de Estudo — BeConfident)
// ============================================================

/**
 * Registro de progresso de estudo do usuário com campos BeConfident.
 *
 * @typedef {Object} StudyProgress
 * @property {string} id - Identificador único (UUID)
 * @property {string} user_id - ID do usuário
 * @property {string} banca - Banca de concurso alvo
 * @property {string} materia - Matéria estudada
 * @property {string} topico - Tópico específico
 * @property {number} acertos - Quantidade de acertos
 * @property {number} erros - Quantidade de erros
 * @property {number} taxa_acerto - Taxa de acerto (0 a 100)
 * @property {number} adaptive_level - Nível adaptativo no momento (1 a 6)
 * @property {number} fatigue_score - Score de fadiga do usuário (0 a 100)
 * @property {string|null} last_question_time - Timestamp da última questão respondida (ISO 8601)
 * @property {string} status - Status do progresso ('em_andamento', 'concluido', 'pausado')
 * @property {string} created_at - Data de criação (ISO 8601)
 * @property {string|null} updated_at - Data da última atualização (ISO 8601)
 */

// ============================================================
// Conversation (Conversa — BeConfident)
// ============================================================

/**
 * Conversa entre o usuário e o bot no Telegram.
 * Mantém o contexto para interceptação contextual.
 *
 * @typedef {Object} Conversation
 * @property {string} id - Identificador único (UUID)
 * @property {string} user_id - ID do usuário dono da conversa
 * @property {string} status - Status da conversa ('ativa', 'fechada', 'arquivada')
 * @property {number} message_count - Total de mensagens na conversa
 * @property {string|null} last_topic - Último tópico discutido
 * @property {number} last_bot_action - Última ação do bot:
 *   0 = resposta natural, 1 = interceptação, 2 = micro-sessão
 * @property {string|null} last_interception_time - Timestamp da última interceptação (ISO 8601)
 * @property {string} created_at - Data de criação (ISO 8601)
 * @property {string|null} updated_at - Data da última atualização (ISO 8601)
 */

// ============================================================
// MicroSession (Micro-Sessão — BeConfident)
// ============================================================

/**
 * Micro-sessão de estudo gerada por interceptação contextual.
 * Uma micro-sessão é uma questão ou exercício rápido que o bot
 * propõe durante uma conversa natural.
 *
 * @typedef {Object} MicroSession
 * @property {string} id - Identificador único (UUID)
 * @property {string} user_id - ID do usuário
 * @property {string} conversation_id - ID da conversa onde foi gerada
 * @property {string} topico - Tópico da micro-sessão
 * @property {string} banca - Banca de referência
 * @property {string} questao - Questão proposta (texto completo)
 * @property {string} alternativas - Alternativas da questão (JSON string)
 * @property {string} gabarito - Gabarito da questão
 * @property {string} explicacao - Explicação da resposta correta
 * @property {'facil'|'medio'|'dificil'} dificuldade - Nível de dificuldade
 * @property {'pendente'|'respondida'|'expirada'} status - Status da micro-sessão
 * @property {string|null} resposta_usuario - Resposta dada pelo usuário
 * @property {boolean|null} acertou - Se o usuário acertou (null se ainda não respondeu)
 * @property {number} tempo_resposta - Tempo de resposta do usuário em segundos
 * @property {string} created_at - Data de criação (ISO 8601)
 * @property {string|null} answered_at - Data da resposta (ISO 8601)
 */

// ============================================================
// Prediction (Predição de Tópico)
// ============================================================

/**
 * Representa uma predição de tópico que pode cair em uma prova.
 *
 * @typedef {Object} Prediction
 * @property {string} id - Identificador único da predição
 * @property {string} banca - Banca examinadora (ex: 'CESPE', 'FGV')
 * @property {string} materia - Matéria principal
 * @property {string} topico - Tópico específico
 * @property {string[]} subtopicos - Subtópicos relacionados
 * @property {number} probabilidade - Probabilidade de cair na próxima prova (0 a 100)
 * @property {number} recencia - Recência da última cobrança em dias (0 = cobrado recentemente)
 * @property {number} peso_historico - Peso baseado no histórico de cobranças (0 a 10)
 * @property {string} nivel_dificuldade - Nível de dificuldade
 * @property {string} estilo_cobranca - Como a banca costuma cobrar
 * @property {string[]} armadilhas - Lista de armadilhas comuns
 * @property {string[]} dicas - Dicas de estudo para o tema
 * @property {string[]} provas_onde_caiu - Lista de provas onde o tema já foi cobrado
 * @property {string[]} referencias_legais - Referências legislativas
 * @property {string|null} ultima_cobranca - Data da última vez que foi cobrado (ISO 8601)
 * @property {number} total_feedbacks - Total de feedbacks recebidos
 * @property {number} acertos_feedbacks - Total de feedbacks confirmando acerto
 */

// ============================================================
// Payment (Pagamento)
// ============================================================

/**
 * Registro de pagamento via MercadoPago.
 *
 * @typedef {Object} Payment
 * @property {string} id - Identificador único (UUID)
 * @property {string} user_id - ID do usuário que realizou o pagamento
 * @property {string} mercadopago_payment_id - ID do pagamento no MercadoPago
 * @property {string} mercadopago_external_reference - Referência externa (UUID do pagamento local)
 * @property {'pix'|'credit_card'} method - Método de pagamento
 * @property {number} amount - Valor pago em reais
 * @property {'pending'|'approved'|'rejected'|'cancelled'|'refunded'} status - Status do pagamento
 * @property {'launch'|'regular'} pricing_tier - Tipo de preço aplicado
 * @property {string|null} pix_code - Código Pix copia-e-cola (se método pix)
 * @property {string|null} pix_qr_code - URL do QR Code Pix (base64)
 * @property {string|null} approved_at - Data da aprovação (ISO 8601)
 * @property {string} created_at - Data de criação (ISO 8601)
 * @property {string|null} updated_at - Data da última atualização (ISO 8601)
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
 * @property {string} user_id - ID do usuário
 * @property {boolean} acertou - Se a predição estava correta
 * @property {string|null} concurso - Nome do concurso/prova
 * @property {string|null} observacao - Observação adicional
 * @property {string} created_at - Data do feedback (ISO 8601)
 */

// ============================================================
// AccuracyReport (Relatório de Acurácia)
// ============================================================

/**
 * Relatório comparando predições com o que realmente caiu na prova.
 *
 * @typedef {Object} AccuracyReport
 * @property {string} id - Identificador único
 * @property {string} concurso - Nome do concurso
 * @property {string} banca - Banca examinadora
 * @property {string} data_prova - Data da prova (ISO 8601)
 * @property {number} total_questoes - Total de questões
 * @property {number} acertos - Questões previstas corretamente
 * @property {number} porcentagem - Porcentagem de acerto (0 a 100)
 * @property {string[]} temas_mapeados - Temas previstos
 * @property {string[]} temas_acertados - Temas que caíram e foram previstos
 * @property {string[]} temas_nao_previstos - Temas que caíram mas não foram previstos
 * @property {string[]} temas_previstos_nao_cairam - Temas previstos que não caíram
 * @property {boolean} publicado - Se está visível publicamente
 * @property {string} created_at - Data de criação (ISO 8601)
 */

export default {
  // Este arquivo serve como documentação dos schemas.
  // Importe as typedefs via JSDoc em outros arquivos.
};
