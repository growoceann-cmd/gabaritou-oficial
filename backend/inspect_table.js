
import pg from 'pg';
import 'dotenv/config';

async function inspectTable(tableName) {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
    `, [tableName]);
    console.log(`Columns for ${tableName}:`, res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

inspectTable('predictions');
