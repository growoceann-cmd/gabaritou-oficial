import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';

const BOT_TOKEN = '8620428138:AAGFei1Ze8vqPQuOXhpMf5_1BCj8RtRndLk';
const DATABASE_URL = 'postgresql://postgres.ekklqpaxnqdkqhslarfu:Gabaritou_v3.2_Blindagem_2026!@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const MESSAGE = `☀️ **RASTRO MATINAL GABARITOU — 05/05/2026** 🔱🛰️

Bom dia, Sniper! O império já varreu os editais e tribunais para você. Confira as bombas de hoje:

🏛️ **NOTÍCIAS & EDITAIS:**
• **ALE-RR:** Edital publicado com salários astronômicos de até **R$ 39.589,56**! 💰
• **PC PR:** FGV confirmada para Delegado. Inicial de R$ 24,2k. O rastro policial está quente!
• **Sefaz CE:** Inscrições abertas para Auditor-Fiscal (R$ 16k). O prazo está correndo.
• **Sesau RO:** Confirmada previsão de 2.395 vagas. Volume massivo chegando.

⚖️ **JURISPRUDÊNCIA & MATÉRIA:**
• **STF Informativo 1210:** Simetria entre Magistratura e MP. Foco em Constitucional.
• **STJ Informativo 886:** Novas teses sobre provas e trânsito. Essencial para PC PR e PCDF.
• **Jurisprudência:** Precedente do TRF3 sobre autonomia de bancas em provas orais.

🚀 **OPORTUNIDADES:**
• **E-book Grátis:** "Calendário de Maio: 22 Editais Previstos" já disponível no nosso radar.

Digite **/warroom** para simular seu desempenho com esses novos dados! 🦈⚖️🕸️`;

async function runMorningUpdate() {
  try {
    const result = await pool.query("SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL");
    const users = result.rows;
    console.log(`Iniciando Rastro Matinal para ${users.length} usuários...`);

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
      await new Promise(r => setTimeout(r, 200));
    }
    console.log("Rastro Matinal concluído.");
  } catch (err) {
    console.error("Erro crítico:", err.message);
  } finally {
    await pool.end();
  }
}

runMorningUpdate();
