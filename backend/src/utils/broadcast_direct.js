import 'dotenv/config';
import fetch from 'node-fetch';
import { query } from '../db/connection.js';

const BOT_TOKEN = '8620428138:AAET01fRGFBDv6DJGEYUun3GvrWGvLgxFps';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

async function runBroadcast(message) {
  console.log('Iniciando broadcast matinal (Direct API)...');
  
  try {
    const users = await query('SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL');
    console.log(`Total de usuários encontrados: ${users.length}`);

    let success = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegram_id,
            text: message,
            parse_mode: 'Markdown'
          })
        });
        
        const data = await res.json();
        
        if (data.ok) {
          success++;
        } else {
          console.error(`Erro ao enviar para ${user.telegram_id}:`, data.description);
          failed++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 50)); 
      } catch (err) {
        console.error(`Erro fatal para ${user.telegram_id}:`, err.message);
        failed++;
      }
    }

    console.log(`\n✅ Broadcast Concluído!\n- Sucesso: ${success}\n- Falhas: ${failed}`);
  } catch (err) {
    console.error('Erro no broadcast:', err);
    process.exit(1);
  }
}

const msg = `**RELATÓRIO DE INTELIGÊNCIA MATINAL — HERMES EM VIGÍLIA** 🔱🌅🤖

SÃOBENTO, o rastro de hoje (21/04/2026) foi varrido com precisão cirúrgica. Aqui estão as atualizações de impacto:

### 📄 Novos Editais e Oportunidades:
* **Bombeiros MG & Oficiais Médicos SP:** Inscrições abertas e rastro de questões já mapeado.
* **Correios:** Prorrogação para 548 vagas de Jovem Aprendiz.
* **INSS & Banco do Brasil:** Movimentação massiva para 7 mil novos servidores federais em 2026.

### ⚖️ Rastro de Jurisprudência (O "DNA" da Aprovação):
* **STF Tema 1.164:** Mudança crítica sobre direito subjetivo à nomeação. Foco em Dir. Administrativo.
* **Lei 14.751/2023:** STJ confirmou não-retroatividade em editais vigentes.

### 🎯 Oportunidades "Ocultas":
* **Conselhos Regionais (CRM/CREA):** Editais para TI/Dados com salários até **R$ 8.500**.
* **Data Flywheel:** Simulados inéditos capturados e sendo processados pelo Tutor Sniper.

**Não estude o que já caiu. Preveja o que VAI cair.** 🦈⚖️🕸️🚀`;

runBroadcast(msg);
