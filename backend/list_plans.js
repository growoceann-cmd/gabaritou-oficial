import 'dotenv/config';
import { query } from './src/db/connection.js';

async function listPlans() {
  try {
    const result = await query("SELECT plan, COUNT(*) FROM users GROUP BY plan");
    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listPlans();
