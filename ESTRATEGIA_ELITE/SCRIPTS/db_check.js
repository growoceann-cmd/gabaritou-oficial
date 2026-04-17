import 'dotenv/config';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('--- TABLES ---');
    res.rows.forEach(r => console.log(r.table_name));
    
    // List all users
    console.log('\n--- ALL USERS ---');
    const usersRes = await pool.query("SELECT telegram_id, full_name, plan FROM users");
    usersRes.rows.forEach(r => console.log(`${r.telegram_id}: ${r.full_name} - ${r.plan}`));
    console.log('\n--- USERS BY PLAN ---');
    const plansRes = await pool.query("SELECT plan, count(*) FROM users GROUP BY plan");
    plansRes.rows.forEach(r => console.log(`${r.plan}: ${r.count}`));
    const tables = res.rows.map(r => r.table_name);
    for (const table of tables) {
      const countRes = await pool.query(`SELECT count(*) FROM ${table}`);
      console.log(`${table}: ${countRes.rows[0].count} rows`);
    }
    if (tables.includes('predictions')) {
      console.log('\n--- SCHEMA: predictions ---');
      const schema = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'predictions'");
      schema.rows.forEach(c => console.log(`${c.column_name}: ${c.data_type}`));
    }
    if (tables.includes('embeddings')) {
      console.log('\n--- SCHEMA: embeddings ---');
      const schema = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'embeddings'");
      schema.rows.forEach(c => console.log(`${c.column_name}: ${c.data_type}`));
    }
    if (tables.includes('questions')) {
      console.log('\n--- SCHEMA: questions ---');
      const schema = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'questions'");
      schema.rows.forEach(c => console.log(`${c.column_name}: ${c.data_type}`));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
