import pg from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

async function testConnection() {
  console.log('--- Testando Conexão Supabase ---');
  const pool = new pg.Pool({ connectionString });
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
