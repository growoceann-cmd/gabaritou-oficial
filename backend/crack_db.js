import pg from 'pg';
import 'dotenv/config';

const passwords = [
  'Gabaritou_2026_Alfaia',
  'gabaritou_2026_alfaia',
  'Gabaritou2026!',
  'Gabaritou_2026',
  'password'
];

const host = 'aws-0-sa-east-1.pooler.supabase.com'; // São Paulo
const user = 'postgres.ekklqpaxnqdkqhslarfu';

async function crack() {
  for (const pass of passwords) {
    const connectionString = `postgresql://${user}:${pass}@${host}:6543/postgres?pgbouncer=true`;
    console.log(`--- Tentando Senha: ${pass} ---`);
    const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 5000 });
    try {
      const res = await pool.query('SELECT NOW();');
      console.log(`✅ SUCESSO! Senha correta: ${pass}`);
      console.log('URI:', connectionString);
      process.exit(0);
    } catch (e) {
      console.log(`❌ Falha: ${e.message}`);
    }
    await pool.end();
  }
}

crack();
