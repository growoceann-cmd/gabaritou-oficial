import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { Telegraf } from 'telegraf';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

async function sendDailyNotification() {
  console.log('🕸️ Iniciando disparo da Mensagem Diária...');
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('telegram_id, full_name')
      .not('telegram_id', 'is', null);

    if (error) throw error;
    if (!users || users.length === 0) {
      console.log('⚠️ Nenhum usuário com Telegram ID encontrado no banco.');
      return;
    }

    console.log(`🚀 Disparando para ${users.length} usuários...`);

    for (const user of users) {
      try {
        await bot.telegram.sendMessage(
          user.telegram_id,
          `🎯 *GABARITOU — CONEXÃO DIÁRIA*\n\n` +
          `Olá, ${user.full_name || 'Concurseiro'}! A teia se moveu.\n\n` +
          `📊 *Frequência de Prova:* Direito Administrativo (Licitações) está em alta nas últimas 24h.\n` +
          `📉 *Tendência:* Bancas como FGV e CESPE estão focando em sanções administrativas.\n\n` +
          `O futuro é preditivo. Não estude no escuro.\n\n` +
          `🔗 [Ver Radar de Hoje](https://gabaritouconcursos.com.br/radar)`,
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
