import 'dotenv/config';
import { query } from './src/db/connection.js';

async function listTables() {
  try {
    const res = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

listTables();
