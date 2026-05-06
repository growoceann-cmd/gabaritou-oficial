import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';

const BOT_TOKEN = '8620428138:AAGFei1Ze8vqPQuOXhpMf5_1BCj8RtRndLk';
const DATABASE_URL = 'postgresql://postgres.ekklqpaxnqdkqhslarfu:Gabaritou_v3.2_Blindagem_2026!@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const MESSAGE = `🔱 **GABARITOU WAR ROOM — A MAIOR ATUALIZAÇÃO DA HISTÓRIA** 🔱

A Teia evoluiu. Ontem, ativamos oficialmente o **GABARITOU WAR ROOM**, integrando a tecnologia de Inteligência de Enxame (**MiroFish**) ao nosso ecossistema.

🚀 **O QUE MUDOU?**
Agora você não apenas estuda, você **SIMULA A GUERRA**. Nossa IA cria milhares de agentes virtuais para prever:
1. **Nota de Corte Preditiva:** Saiba o mínimo para passar antes da prova.
2. **Pontos de Sangria:** Onde a banca FGV/CESPE vai tentar te eliminar.
3. **Dossiês HTML:** Relatórios táticos completos enviados direto no seu chat.

Não estude no escuro. Use o rastro da inteligência.
Digite **/warroom** e entre no campo de batalha. 🦈⚖️🔝`;

async function runBroadcast() {
  try {
    const result = await pool.query("SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL");
    const users = result.rows;
    console.log(`Iniciando envio para ${users.length} usuários...`);

    for (const user of users) {
      try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_id,
            text: MESSAGE,
            parse_mode: 'Markdown'
          })
        });
        console.log(`✅ Enviado para ${user.telegram_id}`);
      } catch (err) {
        console.log(`⚠️ Erro para ${user.telegram_id}: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 200));
    }
  } catch (err) {
    console.error("Erro crítico:", err.message);
  } finally {
    await pool.end();
  }
}

runBroadcast();
