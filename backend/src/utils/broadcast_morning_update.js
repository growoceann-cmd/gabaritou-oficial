import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';

const BOT_TOKEN = '8620428138:AAGFei1Ze8vqPQuOXhpMf5_1BCj8RtRndLk';
const DATABASE_URL = 'postgresql://postgres.ekklqpaxnqdkqhslarfu:Gabaritou_v3.2_Blindagem_2026!@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const MESSAGE = `☀️ **RASTRO MATINAL GABARITOU — 22/04/2026** 🔱🛰️

Bom dia, Sniper! O império já varreu os editais e tribunais para você. Confira as atualizações de hoje:

🏛️ **NOTÍCIAS & EDITAIS:**
• **SEAD-RN:** Retificação importante para os cargos do DETRAN, IPERN e CEASA. Fique atento às mudanças no cronograma!
• **UEPB:** Retificado edital para cargos técnico-administrativos.
• **Marinha do Brasil:** Inscrições abertas para o Colégio Naval (156 vagas). Uma ótima porta de entrada para a carreira militar.
• **Cenário Abril:** Estratégia confirma previsão de 25 novos editais até o fim do mês.

⚖️ **JURISPRUDÊNCIA & MATÉRIA:**
• **STJ Informativo 884:** Decisões críticas sobre Administração Pública e Direito Sanitário. Essencial para provas de tribunais e saúde.
• **STF Informativo 1204:** O primeiro do ano traz entendimentos sobre Direito Tributário e competências legislativas.
• **Radar IA:** Tendência de cobrança sobre "Regulação de IA" em provas de TI e Administrativo.

🚀 **OPORTUNIDADES:**
• Mais de 29.000 vagas abertas hoje em todo o Brasil.
• Dica Sniper: Foque nas retificações do RN se você busca estabilidade em autarquias.

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
