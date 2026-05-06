import 'dotenv/config';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
try {
  const res = await pool.query('SELECT NOW()');
  console.log('DB OK:', res.rows[0]);
} catch (err) {
  console.error('DB FAIL:', err.message);
} finally {
  await pool.end();
}
