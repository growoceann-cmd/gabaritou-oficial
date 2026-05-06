import 'dotenv/config';
import { query } from './src/db/connection.js';

async function listSchemas() {
  try {
    const res = await query("SELECT schema_name FROM information_schema.schemata");
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

listSchemas();
