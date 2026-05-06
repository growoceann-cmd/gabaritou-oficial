import 'dotenv/config';
import { query } from './src/db/connection.js';

async function findUser() {
  const users = await query("SELECT telegram_id, full_name FROM users WHERE full_name ILIKE '%Glawber%' OR full_name ILIKE '%BENTO%'");
  console.log(users);
  process.exit(0);
}

findUser();
