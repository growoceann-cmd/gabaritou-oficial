import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';

const BOT_TOKEN = '8620428138:AAGFei1Ze8vqPQuOXhpMf5_1BCj8RtRndLk';
const DATABASE_URL = 'postgresql://postgres.ekklqpaxnqdkqhslarfu:Gabaritou_v3.2_Blindagem_2026!@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const MESSAGE = `🔱 GABARITOU WAR ROOM — COMO FUNCIONA A NOSSA IA DE ENXAME? 🔱

Você não está apenas recebendo dicas. Você está acessando uma SIMULAÇÃO DE COMBATE.

🧠 O QUE É O ENXAME (Swarm Intelligence)?
Nossa nova tecnologia (Aether Swarm) cria milhares de 'Agentes Candidatos' virtuais e 'Agentes Banca' (FGV, CESPE, etc.). Eles realizam 5.000 iterações da sua prova antes mesmo dela acontecer.

🎯 O QUE RESOLVEMOS PARA VOCÊ:
1. NOTA DE CORTE PREDITIVA: Descubra qual será o mínimo para passar antes de sair de casa.
2. MAPEAMENTO DE SANGRIA: Nossa IA detecta exatamente onde os candidatos de elite estão errando (as pegadinhas fatais).
3. ESTRATÉGIA ANTI-ELIMINAÇÃO: Foque nos 20% do edital que representam 80% da sua nota real.

A era do estudo analógico acabou. O GABARITOU agora é o seu Oráculo de Guerra.

O rastro da aprovação não é sorte, é ciência de dados. Digite /warroom e veja o rastro da sua aprovação. 🦈⚖️🔝`;

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
      await new Promise(r => setTimeout(r, 200));
    }
    console.log("Broadcast de explicação concluído.");
  } catch (err) {
    console.error("Erro crítico:", err.message);
  } finally {
    await pool.end();
  }
}

runBroadcast();
