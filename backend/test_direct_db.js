import pg from 'pg';
import 'dotenv/config';

const connectionString = 'postgresql://postgres:Gabaritou_2026_Alfaia@db.ekklqpaxnqdkqhslarfu.supabase.co:5432/postgres';

async function testConnection() {
  console.log('--- Testando Conexão Direta Supabase ---');
  const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 10000 });
  try {
    const res = await pool.query('SELECT NOW(), version();');
    console.log('✅ Conectado com sucesso!');
    console.log('Data/Versão:', res.rows[0]);
    await pool.end();
  } catch (err) {
    console.error('❌ Erro de conexão:', err.message);
    process.exit(1);
  }
}

testConnection();
