import { Telegraf } from 'telegraf';
const token = '8620428138:AAGFei1Ze8vqPQuOXhpMf5_1BCj8RtRndLk';
const bot = new Telegraf(token);
bot.telegram.deleteWebhook().then(() => {
  console.log('Webhook deletado');
  process.exit(0);
}).catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
