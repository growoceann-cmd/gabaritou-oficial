import 'dotenv/config';
import fetch from 'node-fetch';
import { query } from './src/db/connection.js';

const token = process.env.BOT_TOKEN;
const message = `**O PLANO QUE OS CURSINHOS ODEIAM — INVASÃO GABARITOU** 🔱🦈💥

SÃOBENTO liberou a "Porta de Entrada" para quem quer parar de ser apenas um "aluno pagante" e se tornar um **Sniper da Aprovação**.

### 🚪 Plano Vitorioso: APENAS R$ 5,90/mês (Anual)
O menor preço do rastro digital para você ter acesso à inteligência que previu 73% da última prova.

### 🎁 GATILHO VIRAL: MÊS GRÁTIS!
Traga **2 amigos** para o @gabaritou_oficial_bot através do seu link de indicação e seu primeiro mês no Plano Vitorioso sai por **R$ 0,00**. 

Isso mesmo: Custo ZERO para começar a prever o futuro.

**A teia está crescendo. Não fique de fora do rastro.** 🕸️🚀🔝`;

async function broadcast() {
  const users = await query("SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL");
  console.log(`Iniciando broadcast para ${users.length} usuários...`);

  for (const user of users) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: user.telegram_id,
          text: message,
          parse_mode: 'Markdown'
        })
      });
      const data = await response.json();
      if (data.ok) {
        console.log(`[OK] Enviado para ${user.telegram_id}`);
      } else {
        console.error(`[ERRO] Falha ao enviar para ${user.telegram_id}: ${data.description}`);
      }
    } catch (error) {
      console.error(`[ERRO] Exceção ao enviar para ${user.telegram_id}:`, error.message);
    }
  }
  process.exit(0);
}

broadcast();
