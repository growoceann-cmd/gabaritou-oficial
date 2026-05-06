import 'dotenv/config';
import { query } from './src/db/connection.js';

async function listColumns() {
  try {
    const result = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    console.log(JSON.stringify(result.map(r => r.column_name)));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listColumns();
