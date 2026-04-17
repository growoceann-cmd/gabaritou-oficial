import { queryOne } from './src/db/connection.js';
async function check() {
  try {
    const user = await queryOne('SELECT * FROM users WHERE telegram_id = $1', [8206934939]);
    console.log('👤 Usuário SÃOBENTO:', user);
  } catch (err) {
    console.error(err);
  }
}
check();
