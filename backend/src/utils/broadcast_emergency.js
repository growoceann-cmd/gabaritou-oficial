import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';

const BOT_TOKEN = '8620428138:AAGFei1Ze8vqPQuOXhpMf5_1BCj8RtRndLk';
const DATABASE_URL = 'postgresql://postgres.ekklqpaxnqdkqhslarfu:Gabaritou_v3.2_Blindagem_2026!@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const MESSAGE = `🚀 ATUALIZAÇÃO AEGIS v3.2 — O WAR ROOM ESTÁ ONLINE!

O GABARITOU acaba de receber o maior upgrade de inteligência da sua história.

🎯 NOVO COMANDO: /warroom
Agora você não apenas estuda, você SIMULA A GUERRA. Ativamos o motor MiroFish para prever a Nota de Corte e o mapeamento de 'sangria' da banca antes da prova.

📋 RELATÓRIOS TÁTICOS
Suas análises semanais agora são enviadas em arquivos HTML de alta fidelidade com seu branding oficial.

O futuro não se estuda, se preve. Digite /start e entre no War Room. 🦈⚖️`;

async function runBroadcast() {
  try {
    const result = await pool.query("SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL");
    const users = result.rows;
    console.log(`Iniciando envio para ${users.length} usuários...`);

    for (const user of users) {
      try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_id,
            text: MESSAGE,
            parse_mode: 'Markdown'
          })
        });
        const data = await response.json();
        if (data.ok) {
          console.log(`✅ Enviado para ${user.telegram_id}`);
        } else {
          console.log(`❌ Falha para ${user.telegram_id}: ${data.description}`);
        }
      } catch (err) {
        console.log(`⚠️ Erro ao enviar para ${user.telegram_id}: ${err.message}`);
      }
      // Pequeno delay para evitar rate limit
      await new Promise(r => setTimeout(r, 100));
    }
    console.log("Broadcast concluído.");
  } catch (err) {
    console.error("Erro crítico:", err.message);
  } finally {
    await pool.end();
  }
}

runBroadcast();
