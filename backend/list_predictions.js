import 'dotenv/config';
import { query } from './src/db/connection.js';

async function listPredictions() {
  try {
    const res = await query("SELECT DISTINCT banca, materia FROM predictions");
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

listPredictions();
