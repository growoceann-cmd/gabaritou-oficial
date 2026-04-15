import pg from 'pg';
import 'dotenv/config';

// Try direct host instead of pooler
const hosts = [
  'db.ekklqpaxnqdkqhslarfu.supabase.co',
  'aws-0-sa-east-1.pooler.supabase.com',
  'ekklqpaxnqdkqhslarfu.supabase.co'
];

async function testHosts() {
  for (const host of hosts) {
    const connectionString = `postgres://postgres.ekklqpaxnqdkqhslarfu:Gabaritou_2026_Alfaia@${host}:5432/postgres`;
    console.log(`--- Testando Host: ${host} ---`);
    const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 5000 });
    try {
      const res = await pool.query('SELECT NOW();');
      console.log(`✅ Conectado com sucesso ao host ${host}!`);
      await pool.end();
      process.exit(0);
    } catch (err) {
      console.error(`❌ Erro no host ${host}: ${err.message}`);
    }
  }
}

testHosts();
