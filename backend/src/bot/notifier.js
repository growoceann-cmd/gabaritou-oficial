import 'dotenv/config';
import { query } from '../db/connection.js';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

async function sendDailyNotification() {
  console.log('🕸️ Iniciando disparo da Mensagem Diária (Notícias + Predição)...');
  
  try {
    const users = await query(
      `SELECT telegram_id, full_name FROM users WHERE telegram_id IS NOT NULL`
    );

    if (!users || users.length === 0) {
      console.log('⚠️ Nenhum usuário com Telegram ID encontrado no banco.');
      return;
    }

    // Conteúdo Dinâmico (Simulando IA Preditiva + Notícias)
    const news = [
      "📌 *ATUALIDADES:* O governo federal discute hoje a nova meta fiscal para 2026. Fique de olho em 'Economia e Orçamento' para provas de Tribunais.",
      "🚀 *PREDIÇÃO:* Edital da Polícia Federal (Agente) ganha força nos bastidores. Nossa teia indica 84% de chance de publicação no próximo trimestre."
    ].join('\n\n');

    console.log(`🚀 Disparando para ${users.length} usuários...`);

    for (const user of users) {
      try {
        await bot.telegram.sendMessage(
          user.telegram_id,
          `🕸️ *CONEXÃO DIÁRIA — GABARITOU*\n\n` +
          `${news}\n\n` +
          `📊 *Radar da Teia:* Direito Constitucional (Direitos Individuais) está sendo cobrado em 7 de cada 10 provas recentes.\n\n` +
          `O futuro não é sorte, é predição. 🦈\n\n` +
          `🔗 [Ver Mapa Mental de Hoje](https://gabaritouconcursos.com.br/mapa-mental)`,
          { parse_mode: 'Markdown' }
        );
        console.log(`✅ Enviado para ${user.telegram_id}`);
      } catch (err) {
        console.error(`❌ Falha ao enviar para ${user.telegram_id}:`, err.message);
      }
    }
    
    console.log('🏁 Disparo concluído!');
  } catch (err) {
    console.error('💥 Erro fatal no disparo:', err.message);
  }
}

sendDailyNotification();
