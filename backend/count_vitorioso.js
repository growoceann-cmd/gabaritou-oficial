import 'dotenv/config';
import { query } from './src/db/connection.js';

async function countVitorioso() {
  try {
    const result = await query("SELECT COUNT(*) as count FROM users WHERE plan = 'vitorioso'");
    console.log(JSON.stringify(result[0]));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

countVitorioso();
