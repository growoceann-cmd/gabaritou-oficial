import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const token = '8620428138:AAET01fRGFBDv6DJGEYUun3GvrWGvLgxFps';
const photoPath = path.resolve('logo.png');

async function setBotAvatar() {
  try {
    if (!fs.existsSync(photoPath)) {
      console.error('❌ Arquivo logo.png não encontrado no diretório atual.');
      return;
    }

    console.log('--- Atualizando Avatar do Bot ---');
    
    const form = new FormData();
    form.append('photo', fs.createReadStream(photoPath));

    const response = await axios.post(`https://api.telegram.org/bot${token}/setChatPhoto`, form, {
      params: { chat_id: '@gabaritou_oficial_bot' }, // Note: For bots, setChatPhoto on a group works, but setChatPhoto on the bot itself is not standard via this endpoint.
      headers: form.getHeaders(),
    });
    
    // For personal bot avatar, it's usually done via BotFather or specific API if available (though official bot API is limited for avatar changes directly).
    // Actually, Telegram Bot API doesn't have a direct method to set the BOT's profile photo. 
    // It must be done via @BotFather. I will try to use the browser for BotFather again.
    
    console.log('Bot API response:', response.data);
  } catch (e) {
    console.error('❌ Erro:', e.response?.data || e.message);
    console.log('⚠️ Aviso: O avatar de bots geralmente requer interação com @BotFather via interface (Telegram Web/App).');
  }
}

setBotAvatar();
