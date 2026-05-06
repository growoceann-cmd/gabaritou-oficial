import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { query } from '../db/connection.js';
import logger from './logger.js';

const log = logger.child('Broadcast');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('ERRO: BOT_TOKEN não definido no .env');
  process.exit(1);
}
log.info(`Token carregado: ${BOT_TOKEN.substring(0, 10)}...`);

const bot = new Telegraf(BOT_TOKEN);

async function runBroadcast(message) {
  log.info('Iniciando broadcast matinal...');
  
  try {
    // 1. Buscar todos os usuários
    const users = await query('SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL');
    log.info(`Total de usuários encontrados: ${users.length}`);

    let success = 0;
    let failed = 0;
    let blocked = 0;

    // 2. Enviar mensagem para cada um
    for (const user of users) {
      try {
        await bot.telegram.sendMessage(user.telegram_id, message, { parse_mode: 'Markdown' });
        success++;
        // Small delay to avoid hitting Telegram limits (30 reqs/sec)
        await new Promise(resolve => setTimeout(resolve, 50)); 
      } catch (err) {
        if (err.description?.includes('bot was blocked by the user')) {
          blocked++;
        } else {
          log.error(`Erro ao enviar para ${user.telegram_id}:`, err.message);
          failed++;
        }
      }
    }

    log.info('Broadcast finalizado', {
      total: users.length,
      sucesso: success,
      bloqueado: blocked,
      falha: failed
    });

    console.log(`\n✅ Broadcast Concluído!\n- Sucesso: ${success}\n- Bloqueados: ${blocked}\n- Falhas: ${failed}`);
  } catch (err) {
    log.error('Erro fatal no broadcast:', err);
    process.exit(1);
  }
}

// Se executado diretamente
if (process.argv[2]) {
  runBroadcast(process.argv.slice(2).join(' '));
} else {
  console.log('Uso: node broadcast.js "Sua mensagem aqui"');
}
