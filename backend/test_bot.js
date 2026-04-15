import { Telegraf } from 'telegraf';
import 'dotenv/config';

const bot = new Telegraf(process.env.BOT_TOKEN);
console.log('Testando bot...');
bot.launch().then(() => {
  console.log('Bot conectado com sucesso!');
  process.exit(0);
}).catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
