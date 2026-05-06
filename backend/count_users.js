import 'dotenv/config';
import { query } from './src/db/connection.js';

async function countUsers() {
  const result = await query("SELECT COUNT(*) FROM users WHERE telegram_id IS NOT NULL");
  console.log('Total users:', result[0].count);
  process.exit(0);
}

countUsers();
