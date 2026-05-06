import 'dotenv/config';
import { query } from './src/db/connection.js';

async function listAllColumns() {
  try {
    const res = await query("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name");
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

listAllColumns();
