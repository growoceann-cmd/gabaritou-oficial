/**
 * Commands do Bot Telegram — GABARITOU (Modelo BeConfident)
 */

import { getTopTopicos } from '../services/predictions.js';
import { PRICING, LIMITS, SOCIAL, BETA_ACCESS_CODE } from '../config/constants.js';
import { queryOne, query } from '../db/connection.js';

// ─── /start ──────────────────────────────────────────────────────
export async function handleStart(ctx) {
  const code = ctx.message.text.split(' ')[1];
  const name = ctx.from.first_name || 'Concurseiro';
  const telegram_id = ctx.from.id;
  const username = ctx.from.username || null;
  const full_name = ((ctx.from.first_name || '') + ' ' + (ctx.from.last_name || '')).trim();

  // Se não houver código no link e o usuário não for autenticado
  if (!code || code !== BETA_ACCESS_CODE) {
    const existingUser = await queryOne('SELECT id FROM users WHERE telegram_id = $1', [telegram_id]);
    if (!existingUser) {
      return ctx.reply(
        `🔒 *ACESSO RESTRITO — GABARITOU*\n\n` +
        `Estamos em fase de validação fechada para apenas 100 usuários de elite.\n\n` +
        `Para entrar, utilize o link de convite oficial ou digite o código de acesso.\n\n` +
        `🔑 *Acesso negado.*`,
        { parse_mode: 'Markdown' }
      );
    }
  }

  // Garantir usuário no banco
  try {
    const user = await queryOne('SELECT id FROM users WHERE telegram_id = $1', [telegram_id]);
    if (!user) {
      await query(
        `INSERT INTO users (telegram_id, username, full_name, plan, is_premium, premium_until, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days', NOW())`,
        [telegram_id, username, full_name, 'trial', true]
      );
      console.log(`✅ Novo usuário registrado: ${full_name} (${telegram_id})`);
    }
  } catch (err) {
    console.error('❌ Erro ao registrar usuário no banco:', err.message);
  }

  ctx.reply(
    `🎯 *Bem-vindo ao GABARITOU*, ${name}!\n\n` +
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
  
  showMenu(ctx);
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
          { text: '🔍 Outra Banca (Premium)', callback_data: 'predicao_banca:OUTRA' },
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
    `📊 *Predições IA — GABARITOU*\n\n` +
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
  const name = ctx.from.first_name || 'Concurseiro';

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

// ─── /relatorio ──────────────────────────────────────────────────
export async function handleRelatorio(ctx) {
  const name = ctx.from.first_name || 'Concurseiro';

  ctx.reply(
    `📋 *Relatório Semanal — ${name}*\n\n` +
    `📊 *Período:* Últimos 7 dias\n\n` +
    `✅ *Acertos:* 87 | ❌ *Erros:* 43\n` +
    `📈 *Taxa geral:* 66.9%\n` +
    `🔥 *Micro-sessões:* 14\n\n` +
    `⚠️ *Precisa de atenção:*\n` +
    `• Raciocínio Lógico — taxa caindo (de 72% para 62%)`,
    { parse_mode: 'Markdown' }
  );
}

// ─── /premium ────────────────────────────────────────────────────
export function handlePremium(ctx) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🆓 Trial 3 Dias Grátis', callback_data: 'trial_start' },
        ],
        [
          { text: `🏆 Vitorioso (Anual) - R$ 7,90/mês`, callback_data: 'premium_checkout:vitorioso' },
        ],
        [
          { text: `⚔️ Combatente (Semestral) - R$ 11,90/mês`, callback_data: 'premium_checkout:combatente' },
        ],
        [
          { text: `🎯 Sniper (Mensal) - R$ 19,90/mês`, callback_data: 'premium_checkout:sniper' },
        ],
        [
          { text: '🔙 Menu', callback_data: 'menu_principal' },
        ],
      ],
    },
  };

  ctx.reply(
    `⭐ *GABARITOU Premium*\n\n` +
    `🔓 *Desbloqueie:* \n` +
    `• ✅ Micro-sessões ilimitadas\n` +
    `• ✅ Todas as bancas & Predições\n` +
    `• ✅ Prova Day ao vivo\n` +
    `• ✅ Relatórios semanais\n\n` +
    `💰 *Estratégia Tubarão (Shark Strategy):*\n\n` +
    `🏆 *Vitorioso (Anual):* R$ 7,90/mês (Anual R$ 94,80)\n` +
    `⚔️ *Combatente (Semestral):* R$ 11,90/mês (Semestral R$ 71,40)\n` +
    `🎯 *Sniper (Mensal):* R$ 19,90/mês\n\n` +
    `🆓 Comece com 3 dias grátis!`,
    { parse_mode: 'Markdown', ...keyboard }
  );
}

// ─── /concursos ──────────────────────────────────────────────────
export function handleConcursos(ctx) {
  const estados = [
    { uf: 'SP', nome: 'São Paulo' },
    { uf: 'RJ', nome: 'Rio de Janeiro' },
    { uf: 'MG', nome: 'Minas Gerais' },
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

// ─── /plano ──────────────────────────────────────────────────────
export function handlePlano(ctx) {
  ctx.reply(
    `📋 *Seu Plano de Estudos Personalizado*\n\n` +
    `Foco: *Analista Judiciário — VUNESP*\n\n` +
    `🔥 *Prioridade de Hoje:* Atos Administrativos\n` +
    `⏳ *Meta:* 3 horas de estudo\n` +
    `📈 *Progresso:* 35% do edital batido\n\n` +
    `Você pode ajustar seu plano nas /configuracoes.`,
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '📅 Ver Calendário Completo', callback_data: 'cmd_plano_full' }], [{ text: '🔙 Menu', callback_data: 'menu_principal' }]] } }
  );
}

// ─── /tutor ──────────────────────────────────────────────────────
export async function handleTutor(ctx) {
  const { activeSessions } = await import('./interceptor.js');
  activeSessions.set(ctx.from.id, { type: 'waiting_for_tutor', status: 'active' });

  ctx.reply(
    `🧠 *AI Tutor — GABARITOU*\n\n` +
    `Eu sou seu mentor pessoal. O que você quer fazer agora?\n\n` +
    `1. Tirar uma dúvida de matéria\n` +
    `2. Pedir um resumo acelerado\n` +
    `3. Criar um mapa mental (Texto)\n\n` +
    `*Apenas mande sua dúvida aqui no chat!*`,
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔙 Menu', callback_data: 'menu_principal' }]] } }
  );
}

// ─── /provaday ───────────────────────────────────────────────────
export function handleProvaDay(ctx) {
  ctx.reply(
    `⚡ *Prova Day — Cobertura em Tempo Real*\n\n` +
    `O Prova Day é o nosso evento exclusivo de revisão e acompanhamento pós-prova.\n\n` +
    `📅 *Próximo Evento:* TJ-SP (VUNESP)\n` +
    `🔔 *Status:* Monitoramento Ativo\n\n` +
    `Assinantes Premium recebem alertas de gabarito extraoficial primeiro!`,
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔔 Me Avisar', callback_data: 'notify_provaday' }], [{ text: '🔙 Menu', callback_data: 'menu_principal' }]] } }
  );
}

// ─── /armadilhas ─────────────────────────────────────────────────
export function handleArmadilhas(ctx) {
  ctx.reply(
    `⚠️ *Armadilhas da Banca (Alertas IA)*\n\n` +
    `Nossa IA identificou as "pegadinhas" mais frequentes da *VUNESP*:\n\n` +
    `1. Uso de termos absolutos (Sempre/Nunca) em Dir. Administrativo.\n` +
    `2. Confusão entre Prazos Prescricionais.\n` +
    `3. Inversão de conceitos em Raciocínio Lógico.\n\n` +
    `*Fique atento!* No simulado, eu vou tentar te pegar nessas armadilhas para você não errar na prova.`,
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🎯 Treinar com Simulado', callback_data: 'cmd_simulado' }], [{ text: '🔙 Menu', callback_data: 'menu_principal' }]] } }
  );
}

// ─── /radar ──────────────────────────────────────────────────────
export function handleRadar(ctx) {
  ctx.reply(
    `📡 *Radar — Notificações Estratégicas*\n\n` +
    `Fique 10 passos à frente dos outros candidatos com nosso algoritmo de monitoramento nacional.\n\n` +
    `🔥 *O que você recebe:* \n` +
    `1. 📰 *Atualidades em Tempo Real:* Tudo o que é relevante para provas hoje.\n` +
    `2. 🚀 *Alertas de Editais:* Editais novos no Brasil inteiro, direto no seu chat.\n` +
    `3. 🎯 *Previsões de Elite:* Insights sobre o que deve cair (sem horário fixo, para quem quer sair na frente).\n\n` +
    `✅ *Frequência:* Máximo de 2 a 3 mensagens pontuais por dia (Sem SPAM, apenas conteúdo de alto valor).\n\n` +
    `💰 *Assinatura:* Apenas *R$ 3,00 por mês*.\n\n` +
    `Escolha sua ação:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💎 Ativar Radar Elite (R$ 3,00)', callback_data: 'radar_activate' }],
          [{ text: '🔙 Menu', callback_data: 'menu_principal' }],
        ],
      },
    }
  );
}

// ─── /revisar ────────────────────────────────────────────────────
export function handleRevisar(ctx) {
  ctx.reply(
    `🔄 *Revisão Ativa IA — Spaced Repetition*\n\n` +
    `Aqui estão os pontos que você errou recentemente. A IA preparou cards para fixação:\n\n` +
    `📦 *Cards Pendentes:* 12\n` +
    `🔥 *Foco:* Direito Administrativo e Português\n\n` +
    `Vamos limpar esses erros da sua memória?`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Iniciar Sessão de Flashcards', callback_data: 'flash_run' }],
          [{ text: '🔙 Menu', callback_data: 'menu_principal' }],
        ],
      },
    }
  );
}

// ─── /gps ────────────────────────────────────────────────────────
export function handleGPS(ctx) {
  ctx.reply(
    `🛰️ *GPS de Aprovação — Auditoria Preditiva*\n\n` +
    `Não estude no escuro. Nossa IA audita seu progresso vs. o Edital Oficial:\n\n` +
    `📍 *Seu Status Atual:* 42% do Edital Coberto\n` +
    `⚠️ *Zona de Perigo:* Você ainda não estudou "Licitações", que tem 88% de chance de cair.\n\n` +
    `🎁 *O que você recebe nesta Auditoria:* \n` +
    `1. Mapa de Calor (O que focar agora).\n` +
    `2. Checklist de tópicos pendentes.\n` +
    `3. Aposta Final da IA para sua prova.\n\n` +
    `💰 *Valor:* Apenas *R$ 2,00* por auditoria completa.`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛰️ Gerar Minha Auditoria (R$ 2,00)', callback_data: 'gps_generate' }],
          [{ text: '🔙 Menu', callback_data: 'menu_principal' }],
        ],
      },
    }
  );
}

// ─── /mapa ────────────────────────────────────────────────────────
export function handleMapa(ctx) {
  ctx.reply(
    `🧠 *Mapa Mental IA — Visualização Estratégica*\n\n` +
    `Transforme conteúdos complexos em mapas visuais fáceis de memorizar.\n\n` +
    `🎯 *O que você recebe:* \n` +
    `1. Fluxograma lógico do tema solicitado.\n` +
    `2. Conexões entre conceitos chave.\n` +
    `3. PDF pronto para imprimir ou salvar.\n\n` +
    `💰 *Valor:* Apenas *R$ 2,00* por mapa gerado.`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🧠 Gerar Meu Mapa Mental (R$ 2,00)', callback_data: 'mapa_generate' }],
          [{ text: '🔙 Menu', callback_data: 'menu_principal' }],
        ],
      },
    }
  );
}

// ─── Menu Principal ──────────────────────────────────────────────
export function showMenu(ctx) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📋 Plano', callback_data: 'cmd_plano' },
          { text: '🧠 Tutor IA', callback_data: 'cmd_tutor' },
          { text: '🔄 Revisão Ativa', callback_data: 'cmd_revisar' },
        ],
        [
          { text: '🎯 Simulado', callback_data: 'cmd_simulado' },
          { text: '📊 Predições', callback_data: 'cmd_predicao' },
          { text: '🛰️ GPS Aprovação', callback_data: 'cmd_gps' },
        ],
        [
          { text: '🧠 Mapa Mental', callback_data: 'cmd_mapa' },
          { text: '⚠️ Armadilhas', callback_data: 'cmd_armadilhas' },
          { text: '📡 Radar', callback_data: 'cmd_radar' },
        ],
        [
          { text: '📈 Progresso', callback_data: 'cmd_progresso' },
          { text: '🏆 Score', callback_data: 'cmd_ranking' },
          { text: '⚡ Prova Day', callback_data: 'cmd_provaday' },
        ],
        [
          { text: '📢 Canal', url: SOCIAL.channel },
          { text: '👥 Grupo', url: SOCIAL.group },
        ],
        [
          { text: '💎 Premium', callback_data: 'cmd_premium' },
          { text: '⚙️ Configurar', callback_data: 'cmd_configurar' },
          { text: '🔒 Privacidade', callback_data: 'cmd_privacidade' },
        ],
      ],
    },
  };

  ctx.reply(
    `🎯 *GABARITOU*\n\n` +
    `A plataforma definitiva para sua aprovação. Estude agora:\n\n` +
    `💻 *Dica:* Use o menu para baixar arquivos HTML para estudo no PC!`,
    { parse_mode: 'Markdown', ...keyboard }
  );
}

// ─── /simulado ───────────────────────────────────────────────────
export function handleSimulado(ctx) {
  ctx.reply(
    `🎯 *Simulado Adaptativo IA — Exercícios Infinitos*\n\n` +
    `Nossa IA gera questões inéditas e infinitas baseadas no seu nível. ` +
    `Quanto mais você resolve, mais o *Aprendizado de Máquina* calibra sua dificuldade.\n\n` +
    `*Todas as Bancas Disponíveis:* VUNESP, FGV, FCC, CEBRASPE, e mais!\n\n` +
    `Selecione a matéria para começar:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏛️ Dir. Administrativo', callback_data: 'simulado_start:dir_administrativo' }],
          [{ text: '⚖️ Dir. Constitucional', callback_data: 'simulado_start:dir_constitucional' }],
          [{ text: '📝 Português', callback_data: 'simulado_start:portugues' }],
          [{ text: '🧠 Raciocínio Lógico', callback_data: 'simulado_start:raciocinio_logico' }],
          [{ text: '🔄 Mudar Banca (Todas Disponíveis)', callback_data: 'config_banca' }],
          [{ text: '🔙 Menu', callback_data: 'menu_principal' }],
        ],
      },
    }
  );
}

// ─── /score & /ranking ────────────────────────────────────────────
export function handleRanking(ctx) {
  ctx.reply(
    `🏆 *Ranking da Comunidade — GABARITOU*\n\n` +
    `1. 🥇 João Silva — 12.450 pts (Mestre)\n` +
    `2. 🥈 Maria Oliveira — 11.200 pts (Expert)\n` +
    `3. 🥉 Carlos Santos — 9.850 pts (Expert)\n` +
    `...\n` +
    `142. *Você* — 1.240 pts (Avançado)\n\n` +
    `🔥 Continue estudando para subir de nível!`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '📊 Ver Leaderboard Completo', callback_data: 'cmd_ranking_full' }], [{ text: '🔙 Menu', callback_data: 'menu_principal' }]],
      },
    }
  );
}

// ─── /referral ────────────────────────────────────────────────────
export function handleReferral(ctx) {
  const referralCode = `GAB-${ctx.from.id.toString(36).toUpperCase()}`;
  const link = `https://t.me/gabaritou_oficial_bot?start=${BETA_ACCESS_CODE}`; // Durante o beta, o link já vem com o código

  ctx.reply(
    `🤝 *Viral Strategy — Ganhe Descontos Reais*\n\n` +
    `No GABARITOU, você é sócio da nossa escala.\n\n` +
    `*Regra de Ouro:* A cada amigo que você convida e assina:\n` +
    `✅ Você ganha *R$ 1,00 de desconto recorrente* na sua mensalidade.\n` +
    `✅ O desconto é acumulativo (máximo de R$ 17,90).\n\n` +
    `💰 *Sua Mensalidade (Sniper):*\n` +
    `De R$ 19,90 por até *R$ 2,00* (Lucro Mínimo Operacional).\n\n` +
    `Seu link único de convite:\n` +
    `\`${link}\`\n\n` +
    `Indicações ativas: *0*\n` +
    `Desconto atual: *R$ 0,00*`,
    { parse_mode: 'Markdown' }
  );
}

// ─── /configurar ──────────────────────────────────────────────────
export function handleConfigurar(ctx) {
  ctx.reply(
    `⚙️ *Configurações de Estudo IA*\n\n` +
    `Ative o *Aprendizado de Máquina* para calibrar sua evolução.\n\n` +
    `*Status IA:* Monitorando interações... 🧠\n` +
    `*Bancas Ativas:* TODAS (Acesso Total)`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏦 Mudar Banca (Todas)', callback_data: 'config_banca' }],
          [{ text: '💼 Mudar Cargo', callback_data: 'config_cargo' }],
          [{ text: '🧠 Resetar Aprendizado IA', callback_data: 'config_reset_ml' }],
          [{ text: '🔙 Menu', callback_data: 'menu_principal' }],
        ],
      },
    }
  );
}

// ─── /privacidade ─────────────────────────────────────────────────
export function handlePrivacidade(ctx) {
  ctx.reply(
    `🔒 *Privacidade e Dados (LGPD)*\n\n` +
    `Seus dados estão seguros conosco. Escolha uma opção abaixo:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📥 Exportar Meus Dados (JSON)', callback_data: 'privacy_export' }],
          [{ text: '❌ Excluir Minha Conta', callback_data: 'privacy_delete' }],
          [{ text: '📜 Termos de Uso', url: 'https://gabaritouconcursos.com.br/termos' }],
          [{ text: '🔙 Menu', callback_data: 'menu_principal' }],
        ],
      },
    }
  );
}

export function handleAjuda(ctx) {
    ctx.reply(
      `📖 *Como o GABARITOU funciona*\n\n` +
      `O bot funciona por *conversa natural*. Você não precisa de comandos.\n\n` +
      `O bot identifica o contexto e propõe questões no momento certo.\n\n` +
      `/predicao — Ver predições\n` +
      `/progresso — Suas estatísticas\n` +
      `/simulado — Iniciar simulado IA\n` +
      `/ranking — Ranking da comunidade\n` +
      `/premium — Ativar assinatura\n` +
      `/referral — Programa de indicação\n` +
      `/privacidade — Gerenciar seus dados`,
      { parse_mode: 'Markdown' }
    );
}

// ─── Command Handlers Map ────────────────────────────────────────
export function getCommandHandlers() {
  return {
    start: handleStart,
    plano: handlePlano,
    tutor: handleTutor,
    provaday: handleProvaDay,
    armadilhas: handleArmadilhas,
    predicao: handlePredicao,
    progresso: handleProgresso,
    relatorio: handleRelatorio,
    premium: handlePremium,
    concursos: handleConcursos,
    simulado: handleSimulado,
    score: handleRanking,
    ranking: handleRanking,
    referral: handleReferral,
    configurar: handleConfigurar,
    privacidade: handlePrivacidade,
    menu: showMenu,
    ajuda: handleAjuda,
    help: handleAjuda,
  };
}
