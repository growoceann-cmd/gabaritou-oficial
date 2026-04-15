import 'dotenv/config';
import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

async function sendTestNotification(chatId) {
  try {
    await bot.telegram.sendMessage(
      chatId,
      `🕸️ *CONEXÃO ESTABELECIDA — GABARITOU*\n\n` +
      `A teia de eventos detectou uma nova anomalia nos editais.\n\n` +
      `📊 *Foco do Dia:* Direito Constitucional (Controle de Constitucionalidade)\n` +
      `🎯 *Chance de cair:* 92%\n\n` +
      `O inconsciente coletivo da banca está se movendo. Você está pronto?\n\n` +
      `[ACESSAR GPS](https://gabaritouconcursos.com.br/gps)`,
      { parse_mode: 'Markdown' }
    );
    console.log('✅ Notificação de teste enviada!');
  } catch (err) {
    console.error('❌ Erro ao enviar notificação:', err.message);
  }
}

// Se você tiver o seu Chat ID do Telegram, substitua abaixo. 
// Para descobrir, mande /start para o bot e veja os logs ou use @userinfobot no Telegram.
const userChatId = process.argv[2]; 

if (!userChatId) {
  console.log('⚠️ Por favor, informe o Chat ID como argumento: node test-notification.js <chat_id>');
} else {
  sendTestNotification(userChatId);
}
