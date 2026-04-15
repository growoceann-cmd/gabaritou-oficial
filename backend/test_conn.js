import https from 'https';
import 'dotenv/config';

const token = process.env.BOT_TOKEN;
const url = `https://api.telegram.org/bot${token}/getMe`;

console.log('Testando conexão com Telegram API via https...');
https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Resposta:', data);
    process.exit(0);
  });
}).on('error', (err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
