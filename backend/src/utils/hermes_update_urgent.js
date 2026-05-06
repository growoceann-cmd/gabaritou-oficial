import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';

const BOT_TOKEN = '8620428138:AAGFei1Ze8vqPQuOXhpMf5_1BCj8RtRndLk';
const DATABASE_URL = 'postgresql://postgres.ekklqpaxnqdkqhslarfu:Gabaritou_v3.2_Blindagem_2026!@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const MESSAGE = `🛡️ *ALERTA LETHUS: INSTABILIDADE NA MALHA QUÂNTICA* 🛡️

O sistema encontrou uma instabilidade na malha quântica. Por favor, tente reformular sua dúvida ou aguarde alguns instantes enquanto a LETHUS estabiliza o núcleo.

🚀 *STATUS DA OPERAÇÃO:*
- 📡 **Recalibrando Enxame**: Ajuste fino nos 55 agentes de elite.
- ⚡ **Estabilizando Núcleo**: Sincronização de alta voltagem com o motor Qwen 3.6 Max.
- 🛡️ **Soberania Mantida**: A LETHUS está no controle total da infraestrutura.

Agradecemos a paciência enquanto elevamos o Gabaritou para um novo patamar de inteligência.

*Att, Equipe de Orquestração LETHUS* 🛡️`;

async function runHermesUpdate() {
  try {
    const result = await pool.query("SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL");
    const users = result.rows;
    console.log(`📡 HERMES: Disparando atualização urgente para ${users.length} usuários...`);

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
          console.log(`✅ Atualização enviada para ${user.telegram_id}`);
        } else {
          console.log(`❌ Falha no envio para ${user.telegram_id}: ${data.description}`);
        }
      } catch (err) {
        console.log(`⚠️ Erro no Hermes para ${user.telegram_id}: ${err.message}`);
      }
      // Delay para evitar limite de rate do Telegram
      await new Promise(r => setTimeout(r, 100));
    }
    console.log("🏁 Hermes concluiu a missão. Base atualizada.");
  } catch (err) {
    console.error("Erro crítico no Hermes:", err.message);
  } finally {
    await pool.end();
  }
}

runHermesUpdate();
