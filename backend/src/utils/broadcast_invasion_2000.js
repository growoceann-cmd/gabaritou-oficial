import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';

const BOT_TOKEN = '8620428138:AAGFei1Ze8vqPQuOXhpMf5_1BCj8RtRndLk';
const DATABASE_URL = 'postgresql://postgres.ekklqpaxnqdkqhslarfu:Gabaritou_v3.2_Blindagem_2026!@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const MESSAGE = `🚨 *O PLANO QUE OS CURSINHOS ODEIAM* 🚨

O jogo virou. A inteligência que era exclusividade de elites agora é sua por um preço simbólico.

🔱 **CAMPANHA PORTA DE ENTRADA — PLANO VITORIOSO** 🔱

Por apenas **R$ 5,90**, você tem acesso ao núcleo do Aether Engine:
- ✅ Questões Infinitas (IA)
- ✅ Simulados Preditivos
- ✅ Radar de Editais em Tempo Real

🔥 **GATILHO VIRAL**: Traga 2 amigos para o bot e seu primeiro mês sai por **R$ 0,00**! 💸

🔗 Assine agora: https://gabaritou.com.br/checkout/vitorioso

Não é sorte. É tecnologia. É a Teia.

#Gabaritou #PlanoVitorioso #Invasao`;

async function runInvasion() {
  try {
    const result = await pool.query("SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL");
    const users = result.rows;
    console.log(`🚀 HORA DA INVASÃO: Disparando para ${users.length} usuários...`);

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
          console.log(`✅ Invasão concluída para ${user.telegram_id}`);
        } else {
          console.log(`❌ Falha na invasão para ${user.telegram_id}: ${data.description}`);
        }
      } catch (err) {
        console.log(`⚠️ Erro no disparo para ${user.telegram_id}: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 200));
    }
    console.log("Invasão concluída. Teia expandida.");
  } catch (err) {
    console.error("Erro crítico na invasão:", err.message);
  } finally {
    await pool.end();
  }
}

runInvasion();
