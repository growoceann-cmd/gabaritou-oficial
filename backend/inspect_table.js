import 'dotenv/config';
import { query } from './src/db/connection.js';

async function inspectTable(tableName) {
  try {
    const res = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}'`);
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

inspectTable('embeddings');
