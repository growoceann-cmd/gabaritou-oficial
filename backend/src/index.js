/**
 * Gabaritou v3.1 — BeConfident + Groq-Engine
 * Atualizado: 12/04/2026
 * Express API + Telegram Bot
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// ─── API Routes ───────────────────────────────────────────────────────
import predictionsRoutes from './api/routes/predictions.js';
import accuracyRoutes from './api/routes/accuracy.js';
import viralRoutes from './api/routes/viral.js';
import freemiumRoutes from './api/routes/freemium.js';
import b2bRoutes from './api/routes/b2b.js';
import communityRoutes from './api/routes/community.js';
import aiTutorRoutes from './api/routes/ai-tutor.js';
import dataLicensingRoutes from './api/routes/data-licensing.js';
import realtimeRoutes from './api/routes/realtime.js';
import concursosRoutes from './api/routes/concursos.js';

// ─── Middleware ────────────────────────────────────────────────────────
import { rateLimit } from './middleware/auth.js';

// ─── Bot ──────────────────────────────────────────────────────────────
import { Telegraf } from 'telegraf';
import { getCommandHandlers, showMenu } from './bot/commands.js';
import { handleCallbackQuery } from './bot/callbacks.js';
import { interceptMessage } from './bot/interceptor.js';

// ─── Configuração ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── Express App ──────────────────────────────────────────────────────
const app = express();

// Middlewares globais
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'admin_secret', 'x-admin-secret', 'api_key', 'x-api-key'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting global
app.use('/api/', rateLimit(120));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    versao: '3.1.0',
    ambiente: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)}s`,
  });
});

// ─── Montar Rotas ─────────────────────────────────────────────────────
const apiRoutes = [
  { path: '/predictions', handler: predictionsRoutes, descricao: 'Predições e Data Flywheel' },
  { path: '/accuracy', handler: accuracyRoutes, descricao: 'Relatórios de Acurácia' },
  { path: '/viral', handler: viralRoutes, descricao: 'Score, Ranking e Referrals' },
  { path: '/freemium', handler: freemiumRoutes, descricao: 'Planos, Trial e Upgrade' },
  { path: '/b2b', handler: b2bRoutes, descricao: 'Parceiros B2B' },
  { path: '/community', handler: communityRoutes, descricao: 'Comunidade e Desafios' },
  { path: '/ai-tutor', handler: aiTutorRoutes, descricao: 'Tutor IA e Simulados' },
  { path: '/data-licensing', handler: dataLicensingRoutes, descricao: 'Licenciamento de Dados' },
  { path: '/realtime', handler: realtimeRoutes, descricao: 'Prova Day em Tempo Real' },
  { path: '/concursos', handler: concursosRoutes, descricao: 'Concursos por Estado' },
];

for (const route of apiRoutes) {
  app.use(`/api${route.path}`, route.handler);
  console.log(`  📌 MOUNTED /api${route.path} - ${route.descricao}`);
}

// API index - lista todas as rotas
app.get('/api', (req, res) => {
  res.json({
    nome: 'Gabaritou API v3.1',
    versao: '3.1.0',
    descricao: 'API de predições para concursos públicos com IA',
    rotas: apiRoutes.map((r) => ({
      path: `/api${r.path}`,
      descricao: r.descricao,
      docs: `/api${r.path}`,
    })),
    links: {
      health: '/health',
      telegram: 'https://t.me/gabaritou_bot',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    sucesso: false,
    erro: 'Rota não encontrada',
    codigo: 'ROTA_NAO_ENCONTRADA',
    dica: 'Acesse /api para ver as rotas disponíveis',
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  res.status(500).json({
    sucesso: false,
    erro: 'Erro interno do servidor',
    codigo: 'ERRO_INTERNO',
    ...(NODE_ENV === 'development' ? { detalhes: err.message, stack: err.stack } : {}),
  });
});

// ─── Telegram Bot ─────────────────────────────────────────────────────
let bot = null;
process.env.DEBUG = 'telegraf:*';

function setupBot() {
  if (!BOT_TOKEN) {
    console.log('\n  ⚠️  BOT_TOKEN não configurado. Bot Telegram não será iniciado.');
    console.log('  💡 Defina BOT_TOKEN no .env para ativar o bot.\n');
    return null;
  }

  try {
    console.log('  🤖 Iniciando instância do Telegraf...');
    bot = new Telegraf(BOT_TOKEN);

    // Registrar comandos
    console.log('  🤖 Registrando comandos...');
    const commandHandlers = getCommandHandlers();
    for (const [command, handler] of Object.entries(commandHandlers)) {
      bot.command(command, handler);
    }

    // Registrar handler de callbacks
    console.log('  🤖 Registrando callbacks...');
    bot.on('callback_query', handleCallbackQuery);

    // Interceptor - Gabaritou v3.1 (BeConfident)
    bot.on('message', async (ctx) => {
      if (ctx.message?.text?.startsWith('/')) return;

      try {
        const interception = await interceptMessage(ctx);
        if (interception.action === 'intercept' && interception.response) {
          return ctx.reply(interception.response, { parse_mode: 'Markdown' });
        }
        showMenu(ctx);
      } catch (err) {
        console.error('  ❌ Erro no interceptor:', err.message);
        showMenu(ctx);
      }
    });

    // Iniciar polling
    console.log('  🤖 Executando bot.launch()...');
    bot.launch().then(() => {
      console.log('  🤖 Telegram Bot iniciado com sucesso!');
    }).catch((err) => {
      console.error('  ❌ Erro ao iniciar Telegram Bot:', err.message);
    });

    // Graceful shutdown do bot
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    return bot;
  } catch (err) {
    console.error('  ❌ Erro ao configurar Telegram Bot:', err.message);
    return null;
  }
}

// Iniciar o Bot antes do servidor
console.log(`  🔍 BOT_TOKEN: ${BOT_TOKEN ? 'Carregado (Inicia com ' + BOT_TOKEN.substring(0, 5) + '...)' : 'Não encontrado'}`);
setupBot();

// ─── Server Start ─────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          🎯 GABARITOU v3.1 - BACKEND                 ║');
  console.log('║            API + Telegram Bot                          ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Ambiente: ${NODE_ENV.padEnd(45)}║`);
  console.log(`║  Porta:     ${String(PORT).padEnd(45)}║`);
  console.log(`║  URL:       http://localhost:${String(PORT).padEnd(27)}║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  Rotas montadas:                                       ║');
  for (const route of apiRoutes) {
    const pathStr = `/api${route.path}`;
    console.log(`║  📌 ${pathStr.padEnd(53)}║`);
  }
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Health:    http://localhost:${String(PORT)}/health${' '.repeat(16)}║`);
  console.log(`║  API Docs:  http://localhost:${String(PORT)}/api${' '.repeat(19)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
});

// ─── Graceful Shutdown ────────────────────────────────────────────────
function gracefulShutdown(signal) {
  console.log(`\n  🛑 Recebido ${signal}. Encerrando servidor...`);

  server.close(() => {
    console.log('  ✅ Servidor HTTP encerrado.');

    if (bot) {
      bot.stop(signal).then(() => {
        console.log('  ✅ Telegram Bot encerrado.');
        process.exit(0);
      }).catch(() => {
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  // Forçar encerramento após 10 segundos
  setTimeout(() => {
    console.error('  ⏰ Timeout: forçando encerramento...');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Export para testes
export { app, server };
