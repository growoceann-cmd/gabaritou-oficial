import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';

const BOT_TOKEN = '8620428138:AAGFei1Ze8vqPQuOXhpMf5_1BCj8RtRndLk';
const DATABASE_URL = 'postgresql://postgres.ekklqpaxnqdkqhslarfu:Gabaritou_v3.2_Blindagem_2026!@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const MESSAGE = `🔱 *CAMPANHA PORTA DE ENTRADA: O PLANO QUE OS CURSINHOS ODEIAM* 🔱

Cansado de pagar fortunas por materiais que não te aprovam? A LETHUS liberou o acesso ao **PLANO VITORIOSO** pelo menor rastro de entrada da história.

🚀 *OFERTA EXCLUSIVA:*
- ✅ Acesso total ao Gabaritou v9.8 (Qwen 3.6 Max + GraphRAG).
- ✅ Simulados infinitos e Tutor IA 24h.
- 💰 Por apenas **R$ 5,90/mês**.

🎁 *GATILHO VIRAL:*
- Traga **2 AMIGOS** para o bot através do seu link de indicação e seu primeiro mês sai por **R$ 0,00**!

Não deixe a vaga escapar por falta de tecnologia. Entre na Teia agora.

👉 [Clique aqui para ativar seu Plano Vitorioso]

*Att, Equipe de Orquestração LETHUS* 🛡️`;

async function runPortaDeEntrada() {
  try {
    // 1. Buscar base massiva (filtrando por quem não tem plano vitorioso ainda ou todos conforme ordem de volume)
    const result = await pool.query("SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL");
    const users = result.rows;
    console.log(`📡 HERMES: Iniciando INVASÃO 'Porta de Entrada' para ${users.length} alvos...`);

    let successCount = 0;

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
        if (data.ok) successCount++;
      } catch (err) {
        // Silencioso para manter performance de massa
      }
      await new Promise(r => setTimeout(r, 50)); // Velocidade de Invasão
    }

    // 2. Resumo da operação
    console.log(`🏁 INVASÃO CONCLUÍDA. Alcance: ${successCount} usuários impactados.`);
    
    // 3. Simulação de conversão inicial (Marketing Metrics)
    const conversionEst = Math.floor(successCount * 0.15); // Estimativa de 15% de interesse inicial
    console.log(`📈 RESUMO EXECUTIVO: Previsão de ${conversionEst} novos usuários no rastro de R$ 5,90.`);

  } catch (err) {
    console.error("Erro crítico na Invasão Hermes:", err.message);
  } finally {
    await pool.end();
  }
}

runPortaDeEntrada();
