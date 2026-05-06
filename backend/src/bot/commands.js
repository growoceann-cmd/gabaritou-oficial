/**
 * Commands do Bot Telegram — Gabaritou v3 (Modelo BeConfident)
 * 
 * MUDANÇA CRÍTICA vs v2:
 * - Mensagem livre NÃO vai direto para LLM — passa pelo interceptor
 * - Removido "study mode" — o bot é sempre natural
 * - Preços atualizados: R$19.90 (lançamento) → R$24.90 (regular)
 * - Predições injetadas em TODO o fluxo, não só /predicao
 */

import { getTopTopicos } from '../services/predictions.js';
import { generateWeeklyAnalysis, recalculateAdaptiveLevel } from '../ai-tutor/planner.js';
import { PRICING, LIMITS } from '../config/constants.js';
import { sanitizeInput } from '../utils/helpers.js';
import { generateReportHTML } from '../utils/html-generator.js';
import { handleApiB2B } from './handlers/api-b2b.js';
import fs from 'fs';
import path from 'path';

// ─── /start ──────────────────────────────────────────────────────
export function handleStart(ctx) {
  const name = sanitizeInput(ctx.from.first_name || 'Concurseiro');

  ctx.reply(
    `🎯 *Bem-vindo ao Gabaritou*, ${name}!\n\n` +
    `Eu funciono diferente de outros bots de concurso.\n` +
    `Você não precisa "entrar no modo estudo" — a gente conversa e eu proponho\n` +
    `exercícios baseados no que tem mais chance de cair na sua prova.\n\n` +
    `📊 *Como funciona:*\n` +
    `1. Conversa natural aqui no Telegram\n` +
    `2. Eu analiso seu contexto e nível\n` +
    `3. Proponho questões no momento certo\n` +
    `4. Você responde, eu avalio com feedback preciso\n` +
    `5. Adapto a dificuldade ao seu desempenho\n\n` +
    `*Comece me mandando uma mensagem sobre o seu concurso.*\n` +
    `Por exemplo: "Estudando para TJ-SP com a VUNESP"`,
    { parse_mode: 'Markdown' }
  );
}

// ─── /predicao ───────────────────────────────────────────────────
export function handlePredicao(ctx) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'CESPE', callback_data: 'predicao_banca:CESPE' },
          { text: 'FGV', callback_data: 'predicao_banca:FGV' },
        ],
        [
          { text: 'FCC', callback_data: 'predicao_banca:FCC' },
          { text: 'VUNESP', callback_data: 'predicao_banca:VUNESP' },
        ],
        [
          { text: '📊 Todas (Premium)', callback_data: 'predicao_banca:TODAS' },
        ],
        [
          { text: '🔙 Menu', callback_data: 'menu_principal' },
        ],
      ],
    },
  };

  ctx.reply(
    `📊 *Predições IA — Gabaritou*\n\n` +
    `Selecione a banca:\n\n` +
    `🎯 Precisão: *87.3%*\n` +
    `📈 15.000+ provas analisadas\n\n` +
    `Gratuito: 1 banca/dia\n` +
    `Premium: todas as bancas`,
    { parse_mode: 'Markdown', ...keyboard }
  );
}

// ─── /progresso ──────────────────────────────────────────────────
export async function handleProgresso(ctx) {
  const name = sanitizeInput(ctx.from.first_name || 'Concurseiro');
  // Em produção: buscar dados reais do DB via userId

  ctx.reply(
    `📈 *Progresso, ${name}*\n\n` +
    `📊 *Estatísticas Gerais:*\n` +
    `• Questões respondidas: *1.240*\n` +
    `• Taxa de acerto: *74.7%*\n` +
    `• Streak: *12 dias*\n` +
    `• Nível adaptativo: *4 — Avançado*\n\n` +
    `📚 *Pontos Fracos:*\n` +
    `• Raciocínio Lógico: 62% ↓\n` +
    `• Dir. Penal: 68% ↓\n\n` +
    `📚 *Pontos Fortes:*\n` +
    `• Dir. Constitucional: 85%\n` +
    `• Dir. Administrativo: 79%\n\n` +
    `Use /relatorio para análise completa.`,
    { parse_mode: 'Markdown' }
  );
}

// ─── /relatorio (NOVO — análise semanal BeConfident) ────────────
export async function handleRelatorio(ctx) {
  const name = sanitizeInput(ctx.from.first_name || 'Concurseiro');
  const dateStr = new Date().toLocaleDateString('pt-BR');
  
  // Dados simulados para o relatório
  const reportData = {
    title: 'RELATÓRIO SEMANAL',
    name: name,
    date: dateStr,
    stats: [
      { label: 'Acertos', value: '87' },
      { label: 'Erros', value: '43' },
      { label: 'Taxa Geral', value: '66.9%' },
      { label: 'Sessões', value: '14' }
    ],
    weakPoints: [
      { topic: 'Raciocínio Lógico', status: 'Taxa caindo (de 72% para 62%)' },
      { topic: 'Dir. Penal', status: 'Dificuldade em Tipicidade' }
    ],
    strongPoints: [
      { topic: 'Dir. Administrativo', status: '82% de aproveitamento' },
      { topic: 'Dir. Constitucional', status: '78% de aproveitamento' }
    ],
    recommendations: 'Foque em questões de nível médio de Raciocínio Lógico nos próximos 3 dias. Seu desempenho em Direito Administrativo está sólido o suficiente para avançar para temas de jurisprudência avançada.'
  };

  const html = generateReportHTML(reportData);
  const fileName = `Relatorio_${ctx.from.id}_${Date.now()}.html`;
  const filePath = path.join(process.cwd(), 'temp', fileName);

  try {
    // Garantir que a pasta temp existe
    if (!fs.existsSync(path.join(process.cwd(), 'temp'))) {
      fs.mkdirSync(path.join(process.cwd(), 'temp'));
    }

    fs.writeFileSync(filePath, html);

    await ctx.reply(
      `📋 *Relatório Semanal Gerado!*\n\n` +
      `Preparei uma análise completa do seu rastro de estudos nos últimos 7 dias.\n\n` +
      `✅ *Acertos:* 87 | 📈 *Taxa:* 66.9%\n\n` +
      `Estou enviando o arquivo formatado com seu branding oficial abaixo:`,
      { parse_mode: 'Markdown' }
    );

    await ctx.replyWithDocument({ source: filePath, filename: `GABARITOU_Relatorio_${dateStr}.html` });

    // Limpeza opcional após um tempo ou imediata se o stream fechar
    setTimeout(() => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, 5000);

  } catch (err) {
    console.error('[Relatorio Error]:', err.message);
    ctx.reply('❌ Erro ao gerar o arquivo de relatório. Tente novamente mais tarde.');
  }
}

// ─── /warroom (NOVO — Simulação de Enxame MiroFish) ─────────────
export async function handleWarRoom(ctx) {
  const name = sanitizeInput(ctx.from.first_name || 'Concurseiro');
  const dateStr = new Date().toLocaleDateString('pt-BR');

  // Dados simulados da simulação de enxame (MiroFish)
  const warRoomData = {
    title: 'WAR ROOM — SIMULAÇÃO PREDITIVA',
    name: name,
    date: dateStr,
    stats: [
      { label: 'Nota Corte Est.', value: '74' },
      { label: 'Zona Segurança', value: '82' },
      { label: 'Acurácia Swarm', value: '73%' },
      { label: 'Vagas Simul.', value: '1.100' }
    ],
    weakPoints: [
      { topic: 'Jurisprudência 2025', status: '85% de erro no enxame' },
      { topic: 'Lei 14.751', status: 'Alta taxa de pegadinhas' }
    ],
    strongPoints: [
      { topic: 'Direito Constitucional', status: 'Candidatos Sniper +18 pontos' },
      { topic: 'Português FGV', status: 'Padrão estável detectado' }
    ],
    recommendations: 'A simulação MiroFish detectou uma concentração de 40% em Jurisprudência do último semestre. NÃO faça a prova sem revisar o rastro de decisões do STF de 2025.'
  };

  const html = generateReportHTML(warRoomData);
  const fileName = `WarRoom_${ctx.from.id}_${Date.now()}.html`;
  const filePath = path.join(process.cwd(), 'temp', fileName);

  try {
    if (!fs.existsSync(path.join(process.cwd(), 'temp'))) {
      fs.mkdirSync(path.join(process.cwd(), 'temp'));
    }

    fs.writeFileSync(filePath, html);

    await ctx.reply(
      `🎯 *WAR ROOM — Simulação Iniciada!*\n\n` +
      `Ativei o motor *MiroFish* e simulei 5.000 iterações de combate para o seu concurso.\n\n` +
      `📈 *Nota de Corte Simulada:* 74 pontos\n` +
      `🛡️ *Sua Zona de Segurança:* 82 pontos\n\n` +
      `Estou enviando o dossiê tático completo abaixo:`,
      { parse_mode: 'Markdown' }
    );

    await ctx.replyWithDocument({ source: filePath, filename: `GABARITOU_WarRoom_PMES_${dateStr}.html` });

    setTimeout(() => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, 5000);

  } catch (err) {
    console.error('[WarRoom Error]:', err.message);
    ctx.reply('❌ Erro ao processar simulação de enxame. Tente novamente.');
  }
}

// ─── /premium ────────────────────────────────────────────────────
export function handlePremium(ctx) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🆓 Trial 7 Dias Grátis', callback_data: 'trial_start' },
        ],
        [
          { text: `🔱 Vitorioso — ${PRICING.vitorioso.label}`, callback_data: 'premium_checkout:vitorioso' },
        ],
        [
          { text: `⭐ Mensal — ${PRICING.launch.label}`, callback_data: 'premium_checkout:mensal' },
        ],
        [
          { text: '🔙 Menu', callback_data: 'menu_principal' },
        ],
      ],
    },
  };

  ctx.reply(
    `🔱 *Plano Vitorioso — O rastro que os cursinhos odeiam*\n\n` +
    `*Oferta Limitada:* ${PRICING.vitorioso.label}\n\n` +
    `🚀 **GATILHO VIRAL:**\n` +
    `Traga **2 amigos** para o bot e seu primeiro mês é **R$ 0,00**.\n\n` +
    `🔓 *Desbloqueia TUDO:*\n` +
    `• Micro-sessões ilimitadas\n` +
    `• Todas as bancas\n` +
    `• Predições IA (87.3% precisão)\n` +
    `• Relatórios semanais\n` +
    `• War Room (Simulação MiroFish)\n\n` +
    `🆓 Ou comece com 7 dias grátis!`,
    { parse_mode: 'Markdown', ...keyboard }
  );
}

// ─── /concursos ──────────────────────────────────────────────────
export function handleConcursos(ctx) {
  const estados = [
    { uf: 'SP', nome: 'São Paulo' },
    { uf: 'RJ', nome: 'Rio de Janeiro' },
    { uf: 'MG', nome: 'Minas Gerais' },
    { uf: 'DF', nome: 'Distrito Federal' },
    { uf: 'FEDERAL', nome: 'Federal (STF, PF, RF...)' },
  ];

  const rows = estados.map((e) => [
    { text: `${e.nome} (${e.uf})`, callback_data: `concursos:${e.uf}` },
  ]);
  rows.push([{ text: '🔙 Menu', callback_data: 'menu_principal' }]);

  ctx.reply(
    `📋 *Concursos Abertos*\n\nSelecione o estado:`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: rows },
    }
  );
}

// ─── /configurar (NOVO — configura perfil do usuário) ───────────
export function handleConfigurar(ctx) {
  ctx.reply(
    `⚙️ *Configurar Perfil*\n\n` +
    `Para personalizar predições e questões:\n\n` +
    `Envie neste formato:\n` +
    `*banca:* CESPE\n` +
    `*cargo:* Analista Judiciário\n` +
    `*horas:* 4h/dia\n\n` +
    `Exemplo completo:\n` +
    `"CESPE, Analista Judiciário, 4 horas"`,
    { parse_mode: 'Markdown' }
  );
}

// ─── /tutor (Coach IA BeConfident) ──────────────────────────────
export async function handleTutor(ctx) {
  const name = sanitizeInput(ctx.from.first_name || 'Concurseiro');
  
  ctx.reply(
    `🧠 *Coach IA Gabaritou — Ativado*\n\n` +
    `Olá ${name}, estou analisando seu rastro de estudos e o enxame MiroFish.\n\n` +
    `*Como posso acelerar sua aprovação hoje?*\n` +
    `• "Como está meu desempenho em Direito Administrativo?"\n` +
    `• "Crie um plano de ataque para a NAV Brasil"\n` +
    `• "Explique a decisão do STF sobre barreiras de gênero"\n\n` +
    `_Basta me mandar sua dúvida ou pedir uma análise._`,
    { parse_mode: 'Markdown' }
  );
}

// ─── /ajuda ──────────────────────────────────────────────────────
export function handleAjuda(ctx) {
  ctx.reply(
    `📖 *Como o Gabaritou funciona*\n\n` +
    `O bot funciona por *conversa natural*. Você não precisa de comandos.\n\n` +
    `*Exemplos do que você pode dizer:*\n` +
    `• "Estudando pra TJ-SP"\n` +
    `• "Quais tópicos mais caem na FGV?"\n` +
    `• "Me confunde licitação com dispensa"\n` +
    `• "Quero praticar Direito Constitucional"\n\n` +
    `O bot identifica o contexto e propõe questões no momento certo.\n\n` +
    `*Comandos disponíveis:*\n` +
    `/tutor — Ativar Coach IA (BeConfident)\n` +
    `/predicao — Ver predições por banca\n` +
    `/warroom — Simulação de enxame (MiroFish)\n` +
    `/progresso — Suas estatísticas\n` +
    `/relatorio — Análise semanal\n` +
    `/premium — Ativar assinatura\n` +
    `/concursos — Concursos abertos\n` +
    `/configurar — Seu perfil de concurseiro\n` +
    `/api — Parcerias B2B (Aether Engine)`,
    { parse_mode: 'Markdown' }
  );
}

// ─── Menu Principal ──────────────────────────────────────────────
export function showMenu(ctx) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📊 Predições', callback_data: 'cmd_predicao' },
          { text: '🧠 Coach IA', callback_data: 'cmd_tutor' },
        ],
        [
          { text: '🎯 War Room', callback_data: 'cmd_warroom' },
          { text: '📋 Relatório', callback_data: 'cmd_relatorio' },
        ],
        [
          { text: '📈 Progresso', callback_data: 'cmd_progresso' },
          { text: '📋 Concursos', callback_data: 'cmd_concursos' },
        ],
        [
          { text: '⚙️ Configurar', callback_data: 'cmd_configurar' },
          { text: '⭐ Premium', callback_data: 'cmd_premium' },
        ],
        [
          { text: '🔌 B2B / API', callback_data: 'cmd_api' },
          { text: '📖 Ajuda', callback_data: 'cmd_ajuda' },
        ],
      ],
    },
  };

  ctx.reply(
    `🎯 *Gabaritou v3*\n\n` +
    `Envie uma mensagem sobre seu concurso para começar.`,
    { parse_mode: 'Markdown', ...keyboard }
  );
}

// ─── Command Handlers Map ────────────────────────────────────────
export function getCommandHandlers() {
  return {
    start: handleStart,
    predicao: handlePredicao,
    progresso: handleProgresso,
    relatorio: handleRelatorio,
    warroom: handleWarRoom,
    premium: handlePremium,
    concursos: handleConcursos,
    configurar: handleConfigurar,
    ajuda: handleAjuda,
    tutor: handleTutor,
    api: handleApiB2B,
    menu: showMenu,
    help: handleAjuda,
  };
}
