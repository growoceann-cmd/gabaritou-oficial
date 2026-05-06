import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';

const BOT_TOKEN = '8620428138:AAGFei1Ze8vqPQuOXhpMf5_1BCj8RtRndLk';
const DATABASE_URL = 'postgresql://postgres.ekklqpaxnqdkqhslarfu:Gabaritou_v3.2_Blindagem_2026!@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const MESSAGE = `☀️ **RASTRO MATINAL GABARITOU — 01/05/2026** 🔱🛰️

Bom dia, Sniper! O império já varreu os editais e tribunais para você. Confira as atualizações de hoje:

🏛️ **NOTÍCIAS & EDITAIS:**
• **IFAM:** Inscrições abertas a partir de hoje (01/05) para diversos cargos! Salários até R$ 6,4k.
• **NAV Brasil:** Edital publicado com 351 vagas imediatas. Urgência para técnicos!
• **Sefaz CE:** Confirmado edital para 300 vagas de Auditor Fiscal (Iniciais de R$ 16k).
• **PM BA / PC BA:** Movimentação intensa para 2.750 novas vagas na segurança pública da Bahia.

⚖️ **JURISPRUDÊNCIA & MATÉRIA:**
• **STJ Informativo 886:** Decisões críticas sobre Direito Civil e competências que caem em provas de Tribunais.
• **STF Radar:** Validade de exames psicotécnicos em pauta. Essencial para carreiras policiais.
• **CNU:** Nomeação de 3.147 aprovados autorizada ontem! O fluxo não para.

🚀 **OPORTUNIDADES:**
• **Ibiraçu/ES:** 200 vagas abertas com inscrições até 24/05.
• **TJ SC:** Novos simulados gratuitos liberados pelo Estratégia hoje.

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
