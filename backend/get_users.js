import 'dotenv/config';
import { query } from './src/db/connection.js';

async function getUsers() {
  const users = await query("SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL");
  console.log(users.map(u => u.telegram_id));
  process.exit(0);
}

getUsers();
