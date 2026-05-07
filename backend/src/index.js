import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import os from 'os';

// ─── Config Validation (must happen early) ──────────────────────
import { validateEnvVars } from './config/constants.js';
validateEnvVars();

// ─── API Routes ─────────────────────────────────────────────────
import predictionsRoutes from './api/routes/predictions.js';
import aiTutorRoutes from './api/routes/ai-tutor.js';
import paymentsRoutes from './api/routes/payments.js';
import concursosRoutes from './api/routes/concursos.js';
import adminRoutes from './api/routes/admin.js';

// ─── Bot ────────────────────────────────────────────────────────
import { Telegraf } from 'telegraf';
import { getCommandHandlers, showMenu } from './bot/commands.js';
import { handleCallbackQuery } from './bot/callbacks.js';
import { interceptMessage, getOrCreateUser, cleanupStaleSessions } from './bot/interceptor.js';
import { getContextForAI, addMessageToContext } from './bot/conversation.js';
import { respondNaturally } from './ai-tutor/coach.js';
import { getTopTopicos } from './services/predictions.js';

// ─── Config ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── Telegram Bot Initialization ────────────────────────────────
let bot = null;

function setupBot() {
  if (!BOT_TOKEN) {
    console.log('\n  ⚠️  BOT_TOKEN não configurado. Bot não será iniciado.');
    return null;
  }

  try {
    bot = new Telegraf(BOT_TOKEN);

    // Comandos
    const handlers = getCommandHandlers();
    for (const [cmd, handler] of Object.entries(handlers)) {
      bot.command(cmd, handler);
    }

    // Callbacks
    bot.on('callback_query', handleCallbackQuery);

    // ★★★ PONTO CENTRAL DO BECONFIDENT ★★★
    bot.on('message', async (ctx) => {
      if (ctx.message?.text?.startsWith('/')) return;
      const text = ctx.message?.text || '';
      const name = ctx.from.first_name || 'Concurseiro';

      try {
        const user = await getOrCreateUser(ctx.from.id, name, ctx.from.username);
        const result = await interceptMessage(ctx);

        if (result.action === 'intercept' && result.response) {
          ctx.reply(result.response, { parse_mode: 'Markdown' });
          const conversation = await import('./bot/conversation.js');
          const conv = await conversation.getOrCreateConversation(user.id);
          await conversation.addMessageToContext(conv.id, 'bot', result.response);
        } else {
          const conversation = await import('./bot/conversation.js');
          const conv = await conversation.getOrCreateConversation(user.id);
          const context = await conversation.getContextForAI(conv.id);

          log.info('🛡️ LETHUS: Processando resposta natural...', { userId: user.id });
          
          let aiResponse = null;
          try {
            aiResponse = await respondNaturally(text, context, user);
          } catch (e) {
            log.error('Erro no motor primário, tentando GOLIATH...', { error: e.message });
          }

          if (!aiResponse) {
            log.info('🛡️ LETHUS: Motor primário falhou ou colapsou. Convocando GOLIATH MASTER...');
            const goliath = await import('./services/goliath.js');
            aiResponse = await goliath.default.processSovereign(text, { userId: user.id });
          }

          if (!aiResponse) {
            log.info('🛡️ LETHUS: GOLIATH em recalibração. Convocando Oráculo HERMES...');
            const hermes = await import('./services/hermes_ai.js');
            aiResponse = await hermes.default.ask(text);
          }

          if (aiResponse) {
            ctx.reply(aiResponse, { parse_mode: 'Markdown' });
            await conversation.addMessageToContext(conv.id, 'bot', aiResponse);
          } else {
            ctx.reply('🛡️ *SISTEMA LETHUS:* Instabilidade crítica na malha quântica. Por favor, tente novamente em instantes.');
          }
        }
      } catch (err) {
        console.error('[Bot Message Error]:', err.message);
        ctx.reply('Erro ao processar. Tente novamente.');
      }
    });

    if (process.env.TELEGRAM_WEBHOOK_URL) {
      console.log('  🌐 Configurando Webhook...');
      const webhookUrl = `${process.env.TELEGRAM_WEBHOOK_URL}/api/bot/webhook`;
      bot.telegram.setWebhook(webhookUrl, { drop_pending_updates: true }).then(() => {
        console.log(`  🤖 Telegram Bot em modo WEBHOOK: ${webhookUrl}`);
      });
    } else {
      console.log('  📡 Deletando webhook anterior e iniciando Polling...');
      bot.telegram.deleteWebhook({ drop_pending_updates: true }).then(() => {
        return bot.launch();
      }).then(() => {
        console.log('  🤖 Telegram Bot iniciado (Polling)!');
      }).catch(err => {
        console.error('  ❌ Erro no launch do Bot:', err.message);
      });
    }

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
    return bot;
  } catch (err) {
    console.error('  ❌ Erro ao configurar bot:', err.message);
    return null;
  }
}

// ─── Express ────────────────────────────────────────────────────
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', versao: '3.0.0', modelo: 'BeConfident', ambiente: NODE_ENV, timestamp: new Date().toISOString() });
});

// Rotas
app.use('/api/predictions', predictionsRoutes);
app.use('/api/ai-tutor', aiTutorRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/concursos', concursosRoutes);
app.use('/api/admin', adminRoutes);

// Telegram Webhook Route
if (process.env.TELEGRAM_WEBHOOK_URL) {
  app.post('/api/bot/webhook', (req, res) => {
    if (bot) {
      bot.handleUpdate(req.body, res).catch((err) => {
        console.error('[Bot Webhook Error]:', err.message);
        res.sendStatus(500);
      });
    } else {
      res.sendStatus(503);
    }
  });
}

// ─── Server Start ───────────────────────────────────────────────
const hostname = os.hostname();
console.log(`  🚀 Iniciando bot no host: ${hostname} (Soberania LETHUS)`);
setupBot();

const server = app.listen(PORT, () => {
  console.log(`  ✓ Gabaritou v3 ativo na porta ${PORT} [Host: ${hostname}]`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
