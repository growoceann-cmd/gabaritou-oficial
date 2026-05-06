import { Telegraf } from 'telegraf';
import 'dotenv/config';

const token = '8620428138:AAGFei1Ze8vqPQuOXhpMf5_1BCj8RtRndLk';
const bot = new Telegraf(token);

console.log('Testando deleteWebhook...');
bot.telegram.deleteWebhook({ drop_pending_updates: true })
  .then(() => {
    console.log('Webhook deletado.');
    return bot.launch();
  })
  .then(() => {
    console.log('Bot lançado com sucesso!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro:', err.message);
    process.exit(1);
  });
