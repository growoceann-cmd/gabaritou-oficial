import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';

const BOT_TOKEN = '8620428138:AAGFei1Ze8vqPQuOXhpMf5_1BCj8RtRndLk';
const DATABASE_URL = 'postgresql://postgres.ekklqpaxnqdkqhslarfu:Gabaritou_v3.2_Blindagem_2026!@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const MESSAGE = `🚀 **GABARITOU — ATUALIZAÇÃO EM TEMPO REAL** 🔱🌅🤖

A Teia nunca dorme. Acabamos de varrer o rastro das últimas notícias para garantir que você esteja sempre um passo à frente da concorrência.

### 📄 ÚLTIMAS NOTÍCIAS DE CONCURSOS:
* **INSS & Banco do Brasil:** Movimentação confirmada para novas vagas federais em 2026.
* **Editais Locais:** Mapeamos novas oportunidades em Conselhos Regionais e Prefeituras com salários até **R$ 8.500**.

### 🌍 DISCIPLINA ATUALIDADES:
* **Foco Preditivo:** Nossa IA detectou padrões de cobrança sobre 'Geopolítica do Clima' e 'Regulação de IA'.
* **Radar Sniper:** O rastro de temas que cairão nos próximos editais de 2026 já está sendo processado pelo motor Aether.

### 🎁 PROMOÇÕES DE IMPACTO:
* **PLANO VITORIOSO:** Apenas **R$ 5,90/mês** (Assinatura Anual). A porta de entrada para a aprovação preditiva.
* **WAR ROOM:** Simulação de Nota de Corte MiroFish liberada para concursos de elite.

**Não estude o que já caiu. Preveja o que VAI cair.** 🦈⚖️🕸️🚀`;

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
      await new Promise(r => setTimeout(r, 200));
    }
    console.log("Broadcast de notícias/promo concluído.");
  } catch (err) {
    console.error("Erro crítico:", err.message);
  } finally {
    await pool.end();
  }
}

runBroadcast();
