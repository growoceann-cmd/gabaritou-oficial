import pg from 'pg';
import 'dotenv/config';

async function setup() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao Supabase para SETUP');

    const sql = `
      -- Habilitar pgvector
      CREATE EXTENSION IF NOT EXISTS vector;

      -- Atualizar users (preservando o que já existe)
      ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS banca_principal TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS cargo_alvo TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pontos INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS sequencia INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS adaptive_level INTEGER DEFAULT 1;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS bancas_favoritas TEXT[];
      ALTER TABLE users ADD COLUMN IF NOT EXISTS total_predicoes INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS acertos_reportados INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS preferencias JSONB DEFAULT '{"notificacoes": true, "resumo_semanal": true}';

      -- Criar índices se não existirem
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_referral') THEN
          CREATE UNIQUE INDEX idx_users_referral ON users(referral_code) WHERE referral_code IS NOT NULL;
        END IF;
      END $$;

      -- study_progress
      CREATE TABLE IF NOT EXISTS study_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        banca TEXT,
        materia TEXT,
        topico TEXT,
        questoes INTEGER DEFAULT 0,
        acertos INTEGER DEFAULT 0,
        taxa_acerto NUMERIC DEFAULT 0,
        adaptive_level INTEGER DEFAULT 1,
        fatigue_score INTEGER DEFAULT 0,
        last_question_time TIMESTAMP WITH TIME ZONE,
        streak_topico INTEGER DEFAULT 0,
        tendencia TEXT,
        historico JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- micro_sessions
      CREATE TABLE IF NOT EXISTS micro_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        banca TEXT,
        materia TEXT,
        topico TEXT,
        dificuldade INTEGER DEFAULT 1,
        status TEXT DEFAULT 'active',
        correct_answers INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        duration_seconds INTEGER DEFAULT 0,
        result JSONB,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ended_at TIMESTAMP WITH TIME ZONE
      );

      -- conversations
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        context JSONB DEFAULT '[]',
        message_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- prediction_feedbacks
      CREATE TABLE IF NOT EXISTS prediction_feedbacks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        predicao_id UUID,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        acertou BOOLEAN,
        concurso TEXT,
        observacao TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- embeddings (pgvector)
      CREATE TABLE IF NOT EXISTS embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT,
        metadata JSONB,
        embedding VECTOR(1536),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- accuracy_reports
      CREATE TABLE IF NOT EXISTS accuracy_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        concurso TEXT,
        banca TEXT,
        data_prova TIMESTAMP WITH TIME ZONE,
        total_questoes INTEGER,
        acertos INTEGER,
        porcentagem NUMERIC,
        temas_mapeados TEXT[],
        temas_acertados TEXT[],
        temas_nao_previstos TEXT[],
        temas_previstos_nao_cairam TEXT[],
        publicado BOOLEAN DEFAULT FALSE,
        share_image_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- community_events
      CREATE TABLE IF NOT EXISTS community_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tipo TEXT,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        concurso_id UUID,
        pontos INTEGER,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- challenges
      CREATE TABLE IF NOT EXISTS challenges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        concurso TEXT,
        banca TEXT,
        criador_id UUID REFERENCES users(id) ON DELETE CASCADE,
        participantes JSONB DEFAULT '[]',
        materia TEXT,
        topicos_escolhidos TEXT[],
        pontos_acerto INTEGER DEFAULT 100,
        status TEXT DEFAULT 'aberto',
        resultado JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        finalized_at TIMESTAMP WITH TIME ZONE
      );

      -- privacy_consents
      CREATE TABLE IF NOT EXISTS privacy_consents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        consent_type TEXT,
        granted BOOLEAN DEFAULT TRUE,
        granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- privacy_audit_log
      CREATE TABLE IF NOT EXISTS privacy_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action TEXT,
        performed_by UUID,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- privacy_deletion_requests
      CREATE TABLE IF NOT EXISTS privacy_deletion_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'pending',
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- referrals
      CREATE TABLE IF NOT EXISTS referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
        referee_id UUID REFERENCES users(id) ON DELETE CASCADE,
        reward_days INTEGER DEFAULT 7,
        claimed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- b2b_partners
      CREATE TABLE IF NOT EXISTS b2b_partners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT,
        api_key TEXT UNIQUE,
        plano TEXT DEFAULT 'basic',
        alunos_count INTEGER DEFAULT 0,
        cnpj TEXT,
        contato_email TEXT,
        contato_nome TEXT,
        mes_atual_uso INTEGER DEFAULT 0,
        limite_mensal INTEGER DEFAULT 1000,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- data_licenses
      CREATE TABLE IF NOT EXISTS data_licenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        comprador TEXT,
        tipo TEXT,
        periodo TEXT,
        preco NUMERIC,
        dados_acessados TEXT[],
        active BOOLEAN DEFAULT TRUE,
        acessos_mes INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE
      );

      -- study_plans
      CREATE TABLE IF NOT EXISTS study_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        banca TEXT,
        cargo TEXT,
        topicos JSONB DEFAULT '[]',
        horas_estimadas INTEGER,
        dias_estimados INTEGER,
        horas_diarias INTEGER,
        status TEXT DEFAULT 'ativo',
        progresso INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- provaday_sessions
      CREATE TABLE IF NOT EXISTS provaday_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        concurso_id UUID,
        banca TEXT,
        relatos JSONB DEFAULT '[]',
        status TEXT DEFAULT 'aguardando',
        relatorio_final JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        finalized_at TIMESTAMP WITH TIME ZONE
      );
    `;

    await client.query(sql);
    console.log('✅ Todas as tabelas e extensões foram configuradas com sucesso!');

  } catch (err) {
    console.error('❌ Erro no setup:', err.message);
  } finally {
    await client.end();
  }
}

setup();
