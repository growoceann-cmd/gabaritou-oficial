import 'dotenv/config';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query(
      `UPDATE users SET plan = 'elite', is_premium = true, premium_until = NOW() + INTERVAL '99 years' 
       WHERE telegram_id = '8206934939'`
    );
    console.log(`✅ Glawber (8206934939) promovido a ELITE. Linhas afetadas: ${res.rowCount}`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
