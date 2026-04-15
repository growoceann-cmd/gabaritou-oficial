import { Telegraf } from 'telegraf';
import 'dotenv/config';

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error('❌ BOT_TOKEN não encontrado no .env');
  process.exit(1);
}

const bot = new Telegraf(token);

console.log('--- Testando Bot Telegram ---');
console.log(`Token: ${token.substring(0, 10)}...`);

bot.start((ctx) => {
  console.log('✅ Recebido /start de:', ctx.from.username);
  ctx.reply('Gabaritou Ativo!');
});

bot.on('text', (ctx) => {
  console.log('💬 Mensagem recebida:', ctx.message.text);
  ctx.reply(`Você disse: ${ctx.message.text}`);
});

console.log('🚀 Iniciando bot.launch()...');
bot.launch().then(() => {
  console.log('✅ Bot em polling!');
}).catch((err) => {
  console.error('❌ Erro no launch:', err.message);
});

// Parar após 30 segundos
setTimeout(() => {
  console.log('⏱️ Fim do teste.');
  bot.stop();
  process.exit(0);
}, 30000);
