import pg from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

async function testDB() {
  console.log('--- Testando Conexão com Supabase ---');
  console.log(`URI: ${connectionString.split('@')[1]}`); // Masking password
  
  const pool = new pg.Pool({ connectionString });
  
  try {
    const res = await pool.query('SELECT current_database(), current_user, version();');
    console.log('✅ Conexão bem-sucedida!');
    console.log('DB Info:', res.rows[0]);
    
    // Check tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📂 Tabelas encontradas:', tables.rows.map(t => t.table_name).join(', '));
    
    await pool.end();
  } catch (e) {
    console.error('❌ Erro de conexão:', e.message);
    process.exit(1);
  }
}

testDB();
