import 'dotenv/config';
import { query } from './src/db/connection.js';

async function checkData() {
  try {
    const res = await query("SELECT * FROM users LIMIT 5");
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkData();
