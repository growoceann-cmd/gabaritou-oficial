import 'dotenv/config';
import { query } from './src/db/connection.js';

async function listAllTables() {
  try {
    const res = await query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog')");
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

listAllTables();
