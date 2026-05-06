/**
 * Schema PostgreSQL — Gabaritou v3
 * 
 * Adições vs v2:
 * - study_progress: adaptive_level, fatigue_score, last_question_time
 * - conversations: tabela para rastrear contexto de conversa
 * - micro_sessions: sessões ativas de micro-aprendizado
 * - payments: integração MercadoPago
 * - prediction_feedbacks: feedback de acerto/erro das predições
 */

-- ─── Extensão pgvector (para embeddings RAG) ─────────────────────
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Usuários ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id     BIGINT UNIQUE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  username        VARCHAR(255),
  
  -- Plano
  plan            VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'trial')),
  premium_until   TIMESTAMPTZ,
  trial_started   TIMESTAMPTZ,
  
  -- Perfil do concurseiro
  banca_principal VARCHAR(50),
  cargo_alvo      VARCHAR(255),
  estado          VARCHAR(2),
  horas_diarias   INT DEFAULT 2,
  
  -- Gamificação
  pontos          INT DEFAULT 0,
  sequencia       INT DEFAULT 0,        -- streak de dias
  nivel           INT DEFAULT 1,
  referral_code   VARCHAR(20) UNIQUE,
  referred_by     VARCHAR(20),
  
  -- BeConfident: Nível adaptativo
  adaptive_level  INT DEFAULT 1,
  
  -- Preferências
  preferencias    JSONB DEFAULT '{"notificacoes": true, "resumo_semanal": true}',
  
  -- Estatísticas
  total_predicoes INT DEFAULT 0,
  acertos_reportados INT DEFAULT 0,
  total_questoes  INT DEFAULT 0,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_plan ON users(plan);
CREATE INDEX idx_users_referral ON users(referral_code);

-- ─── Progresso de Estudo (BeConfident) ───────────────────────────
CREATE TABLE IF NOT EXISTS study_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Tópico
  banca           VARCHAR(50) NOT NULL,
  materia         VARCHAR(100) NOT NULL,
  topico          VARCHAR(255) NOT NULL,
  
  -- Performance
  questoes        INT DEFAULT 0,
  acertos         INT DEFAULT 0,
  taxa_acerto     DECIMAL(5,2) DEFAULT 0,
  
  -- BeConfident: Nível adaptativo por tópico
  adaptive_level  INT DEFAULT 1,
  
  -- Fadiga
  fatigue_score   DECIMAL(5,2) DEFAULT 0,      -- 0 a 100
  last_question_time TIMESTAMPTZ,
  
  -- Tendência
  tendencia       VARCHAR(20) DEFAULT 'estavel', -- 'melhorando', 'estavel', 'precisa_atencao'
  streak_topico   INT DEFAULT 0,
  
  -- Histórico para análise
  historico       JSONB DEFAULT '[]',
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, banca, materia, topico)
);

CREATE INDEX idx_progress_user ON study_progress(user_id);
CREATE INDEX idx_progress_banca_materia ON study_progress(banca, materia);
CREATE INDEX idx_progress_fatigue ON study_progress(user_id, fatigue_score);

-- ─── Micro-Sessões (BeConfident: Learning by Inertia) ────────────
-- NOTE: Must be created BEFORE conversations (conversations.micro_session_id FK references this table)
CREATE TABLE IF NOT EXISTS micro_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Configuração da sessão
  banca           VARCHAR(50),
  materia         VARCHAR(100),
  topico          VARCHAR(255),
  dificuldade     INT DEFAULT 1,               -- 1-6 (adaptive level)
  
  -- Estado
  status          VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'completed', 'abandoned'
  
  -- Questões
  total_questions INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  
  -- Feedback
  user_sentiment  VARCHAR(20),                  -- 'engaged', 'neutral', 'fatigued'
  
  -- Timing
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  duration_seconds INT DEFAULT 0,
  
  -- Resultado
  result          JSONB,                        -- análise final da sessão
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_microsessions_user ON micro_sessions(user_id);
CREATE INDEX idx_microsessions_status ON micro_sessions(status);

-- ─── Conversas (BeConfident: Contextual Interception) ───────────
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Estado
  is_active       BOOLEAN DEFAULT true,
  mode            VARCHAR(30) DEFAULT 'natural', -- 'natural', 'quiz', 'scenario', 'review'
  current_topic   VARCHAR(255),
  current_banca   VARCHAR(50),
  
  -- Micro-sessão ativa
  micro_session_id UUID REFERENCES micro_sessions(id),
  
  -- Mensagens do contexto (últimas N)
  context         JSONB DEFAULT '[]',           -- [{role, text, timestamp}]
  
  -- Contadores
  message_count   INT DEFAULT 0,
  questions_asked INT DEFAULT 0,
  
  -- Timing
  last_message_at TIMESTAMPTZ,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_active ON conversations(user_id, is_active);

-- ─── Predições ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS predictions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  banca           VARCHAR(50) NOT NULL,
  materia         VARCHAR(100) NOT NULL,
  topico          VARCHAR(255) NOT NULL,
  subtopicos      JSONB DEFAULT '[]',
  
  -- Score
  probabilidade   DECIMAL(5,2) NOT NULL,        -- 0-100
  score_composto  DECIMAL(5,2),
  recencia        INT DEFAULT 365,
  peso_historico  INT DEFAULT 5,
  
  -- Metadados
  nivel_dificuldade VARCHAR(20),
  estilo_cobranca VARCHAR(30),
  armadilhas      JSONB DEFAULT '[]',
  dicas           JSONB DEFAULT '[]',
  referencias_legais JSONB DEFAULT '[]',
  provas_onde_caiu JSONB DEFAULT '[]',
  
  -- Feedback (Data Flywheel)
  total_feedbacks INT DEFAULT 0,
  acertos_feedbacks INT DEFAULT 0,
  
  -- Controle
  active          BOOLEAN DEFAULT true,
  ultima_cobranca DATE,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_banca_materia ON predictions(banca, materia);
CREATE INDEX idx_predictions_score ON predictions(probabilidade DESC);

-- ─── Feedbacks de Predições ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS prediction_feedbacks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  predicao_id     UUID REFERENCES predictions(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  acertou         BOOLEAN NOT NULL,
  concurso        VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedbacks_predicao ON prediction_feedbacks(predicao_id);
CREATE INDEX idx_feedbacks_user ON prediction_feedbacks(user_id);

-- ─── Embeddings (RAG) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS embeddings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_id   UUID REFERENCES predictions(id) ON DELETE CASCADE,
  
  -- Texto e embedding
  content         TEXT NOT NULL,
  embedding       vector(1536),
  
  -- Metadados
  source_type     VARCHAR(50),                  -- 'edital', 'jurisprudencia', 'doutrina', 'questao'
  source_ref      VARCHAR(255),
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_embeddings_prediction ON embeddings(prediction_id);

-- ─── Pagamentos (MercadoPago) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- MercadoPago
  mercadopago_payment_id      VARCHAR(100) UNIQUE,
  mercadopago_external_reference VARCHAR(100),
  method         VARCHAR(50),           -- 'pix', 'credit_card'
  amount         DECIMAL(10,2) NOT NULL,
  status         VARCHAR(20) DEFAULT 'pending',
  pricing_tier   VARCHAR(20),           -- 'launch', 'regular'
  
  -- Pix
  pix_code       TEXT,
  pix_qr_code    TEXT,
  
  -- Timestamps
  approved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_mp_id ON payments(mercadopago_payment_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ─── Relatórios de Acurácia ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS accuracy_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concurso        VARCHAR(255) NOT NULL,
  banca           VARCHAR(50) NOT NULL,
  data_prova      DATE NOT NULL,
  
  total_questoes  INT DEFAULT 0,
  acertos         INT DEFAULT 0,
  porcentagem     DECIMAL(5,2) DEFAULT 0,
  
  temas_mapeados       JSONB DEFAULT '[]',
  temas_acertados      JSONB DEFAULT '[]',
  temas_nao_previstos  JSONB DEFAULT '[]',
  temas_previstos_nao_cairam JSONB DEFAULT '[]',
  
  publicado       BOOLEAN DEFAULT false,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Eventos da Comunidade ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  tipo            VARCHAR(50) NOT NULL,
  pontos          INT DEFAULT 0,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_user ON community_events(user_id);
CREATE INDEX idx_events_tipo ON community_events(tipo);

-- ─── Desafios ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo          VARCHAR(255) NOT NULL,
  descricao       TEXT,
  concurso        VARCHAR(255),
  banca           VARCHAR(50),
  materia         VARCHAR(100),
  
  recompensa_pontos INT DEFAULT 0,
  recompensa_premium_days INT DEFAULT 0,
  
  status          VARCHAR(20) DEFAULT 'aberto',
  
  participantes   JSONB DEFAULT '[]',
  
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Função de atualização automática ────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas as tabelas com updated_at
CREATE TRIGGER tr_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_progress_updated BEFORE UPDATE ON study_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_conversations_updated BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_microsessions_updated BEFORE UPDATE ON micro_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_predictions_updated BEFORE UPDATE ON predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_payments_updated BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
