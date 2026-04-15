import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

async function checkTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao Supabase');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📊 Tabelas encontradas no banco:');
    res.rows.forEach(row => console.log(`- ${row.table_name}`));

    const requiredTables = [
      'users', 'study_progress', 'micro_sessions', 'conversations', 
      'predictions', 'prediction_feedbacks', 'embeddings', 'payments', 
      'accuracy_reports', 'community_events', 'challenges', 
      'privacy_consents', 'privacy_audit_log', 'privacy_deletion_requests', 'referrals'
    ];

    console.log('\n🔍 Verificando lacunas:');
    const missing = requiredTables.filter(t => !res.rows.find(r => r.table_name === t));
    
    if (missing.length === 0) {
      console.log('✅ Todas as 15 tabelas estão presentes!');
    } else {
      console.log(`❌ Faltando ${missing.length} tabelas:`);
      missing.forEach(t => console.log(`- ${t}`));
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

checkTables();
