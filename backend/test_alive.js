import { Telegraf } from 'telegraf';
import 'dotenv/config';

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => ctx.reply('Bot Gabaritou Online! 🎯'));
bot.on('text', (ctx) => {
  console.log('Recebi mensagem:', ctx.message.text);
  return ctx.reply('Você disse: ' + ctx.message.text);
});

console.log('🤖 Tentando ligar o bot...');
bot.launch().then(() => {
  console.log('✅ Bot ligado!');
  setInterval(() => console.log('Bot ainda vivo...'), 10000);
}).catch(err => {
  console.error('❌ Erro:', err.message);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
