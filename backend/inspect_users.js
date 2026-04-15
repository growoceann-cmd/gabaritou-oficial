import pg from 'pg';
import 'dotenv/config';

async function inspect() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
inspect();
