import { Telegraf } from 'telegraf';
import 'dotenv/config';

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => ctx.reply('Bot Gabaritou Ativo! 🎯'));
bot.on('text', (ctx) => ctx.reply('Você disse: ' + ctx.message.text));

console.log('🤖 Ligando Bot de Teste...');
bot.launch().then(() => {
  console.log('✅ Bot de Teste Online!');
}).catch(err => {
  console.error('❌ Erro:', err.message);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
