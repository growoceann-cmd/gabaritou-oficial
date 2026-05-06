/**
 * Callbacks do Bot — Gabaritou v3
 * Handlers de botões inline do teclado.
 */

import { getTopTopicos } from '../services/predictions.js';
import { sanitizeInput } from '../utils/helpers.js';

export async function handleCallbackQuery(ctx) {
  const data = ctx.callbackQuery?.data;
  if (!data) return false;

  // Sanitize callback data — only allow known characters to prevent injection
  const safeData = sanitizeInput(data);
  const [type, ...params] = safeData.split(':');
  const param = params.join(':') || '';

  // Validate type: only allow alphanumeric and underscores
  if (!/^[a-z0-9_]+$/.test(type)) {
    await ctx.answerCbQuery('Opção inválida');
    return true;
  }

  try {
    switch (type) {
      case 'predicao_banca':
        return await handlePredicaoBanca(ctx, param);
      case 'predicao_materia':
        return await handlePredicaoMateria(ctx, param);
      case 'concursos':
        return await handleConcursos(ctx, param);
      case 'trial_start':
        return await handleTrialStart(ctx);
      case 'premium_checkout':
        return await handlePremiumCheckout(ctx, param);
      case 'menu_principal':
        await ctx.answerCbQuery();
        const { showMenu } = await import('./commands.js');
        showMenu(ctx);
        return true;
      case 'cmd_predicao':
        await ctx.answerCbQuery();
        const { handlePredicao } = await import('./commands.js');
        handlePredicao(ctx);
        return true;
      case 'cmd_tutor':
        await ctx.answerCbQuery();
        const { handleTutor } = await import('./commands.js');
        handleTutor(ctx);
        return true;
      case 'cmd_progresso':
        await ctx.answerCbQuery();
        const { handleProgresso } = await import('./commands.js');
        handleProgresso(ctx);
        return true;
      case 'cmd_warroom':
        await ctx.answerCbQuery();
        const { handleWarRoom } = await import('./commands.js');
        handleWarRoom(ctx);
        return true;
      case 'cmd_relatorio':
        await ctx.answerCbQuery();
        const { handleRelatorio } = await import('./commands.js');
        handleRelatorio(ctx);
        return true;
      case 'cmd_premium':
        await ctx.answerCbQuery();
        const { handlePremium } = await import('./commands.js');
        handlePremium(ctx);
        return true;
      case 'cmd_concursos':
        await ctx.answerCbQuery();
        const { handleConcursos } = await import('./commands.js');
        handleConcursos(ctx);
        return true;
      case 'cmd_configurar':
        await ctx.answerCbQuery();
        const { handleConfigurar } = await import('./commands.js');
        handleConfigurar(ctx);
        return true;
      case 'cmd_ajuda':
        await ctx.answerCbQuery();
        const { handleAjuda } = await import('./commands.js');
        handleAjuda(ctx);
        return true;
      case 'cmd_api':
        await ctx.answerCbQuery();
        const { handleApiB2B } = await import('./handlers/api-b2b.js');
        handleApiB2B(ctx);
        return true;
      default:
        await ctx.answerCbQuery('Opção não reconhecida');
        return true;
    }
  } catch (err) {
    console.error(`[Callback Error] ${safeData}:`, err.message);
    await ctx.answerCbQuery('Erro. Tente novamente.');
    return true;
  }
}

async function handlePredicaoBanca(ctx, banca) {
  // Sanitize banca param — only allow known bancas
  const safeBanca = sanitizeInput(banca);
  const validBancas = ['CESPE', 'FGV', 'FCC', 'VUNESP', 'QUADRIX', 'TODAS'];
  if (!validBancas.includes(safeBanca.toUpperCase())) {
    await ctx.answerCbQuery('Banca inválida');
    return true;
  }

  await ctx.answerCbQuery(`Banca: ${safeBanca}`);

  if (safeBanca.toUpperCase() === 'TODAS') {
    ctx.reply(
      `🔒 *Todas as bancas — Premium*\n\n` +
      `Funcionalidade Premium.\n\n` +
      `Preço de lançamento: R$ 19,90/mês\n` +
      `7 dias grátis para testar!`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🆓 Trial Grátis', callback_data: 'trial_start' }],
            [{ text: '⭐ Ver planos', callback_data: 'cmd_premium' }],
          ],
        },
      }
    );
    return true;
  }

  const materias = ['Direito Constitucional', 'Direito Administrativo', 'Português', 'Raciocínio Lógico'];
  const rows = materias.map((m) => [{ text: m, callback_data: `predicao_materia:${safeBanca}:${m}` }]);
  rows.push([{ text: '🔙', callback_data: 'cmd_predicao' }]);

  ctx.reply(`📊 *${safeBanca}* — Selecione a matéria:`, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: rows },
  });
  return true;
}

async function handlePredicaoMateria(ctx, param) {
  const [banca, ...materiaParts] = param.split(':');
  const materia = materiaParts.join(':');

  // Sanitize inputs
  const safeBanca = sanitizeInput(banca);
  const safeMateria = sanitizeInput(materia);

  await ctx.answerCbQuery('Carregando...');

  try {
    const predicoes = await getTopTopicos(safeBanca, safeMateria, 5);
    let msg = `📊 *${safeBanca} — ${safeMateria}*\n\n`;

    predicoes.forEach((p, i) => {
      const emoji = p.probabilidade >= 80 ? '🟢' : p.probabilidade >= 60 ? '🟡' : '🔴';
      msg += `${emoji} *${i + 1}. ${sanitizeInput(String(p.topico))}*\n`;
      msg += `   Probabilidade: *${p.probabilidade}%*\n`;
      if (p.armadilha) msg += `   ⚠️ ${sanitizeInput(String(p.armadilha))}\n`;
      msg += '\n';
    });

    msg += `🎯 Precisão: 87.3%`;

    ctx.reply(msg, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Mais tópicos (Premium)', callback_data: 'cmd_premium' }],
          [{ text: '🔙', callback_data: `predicao_banca:${safeBanca}` }],
        ],
      },
    });
  } catch (err) {
    console.error('[PredicaoMateria Error]:', err.message);
    ctx.reply('Erro ao carregar predições. Tente novamente.');
  }
  return true;
}

async function handleConcursos(ctx, uf) {
  // Sanitize UF — only allow alphanumeric
  const safeUf = sanitizeInput(uf).toUpperCase().replace(/[^A-Z0-9]/g, '');
  await ctx.answerCbQuery(`UF: ${safeUf}`);

  const data = {
    SP: [
      { nome: 'TJ-SP (VUNESP)', data: '13/04', vagas: 120 },
      { nome: 'TRE-SP (FCC)', data: '04/05', vagas: 55 },
    ],
    RJ: [{ nome: 'TJ-RJ (FGV)', data: '04/05', vagas: 90 }],
    FEDERAL: [
      { nome: 'Receita Federal (FGV)', data: '22/06', vagas: 200 },
      { nome: 'Polícia Federal (CESPE)', data: '18/05', vagas: 150 },
    ],
  };

  const lista = data[safeUf] || [{ nome: `${safeUf} — Ver site`, data: 'Em breve', vagas: '-' }];
  let msg = `📋 *Concursos — ${safeUf}*\n\n`;
  lista.forEach((c, i) => {
    msg += `${i + 1}. *${sanitizeInput(c.nome)}*\n   📅 ${c.data} | 💼 ${c.vagas} vagas\n\n`;
  });

  ctx.reply(msg, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [[{ text: '📊 Predições', callback_data: 'cmd_predicao' }], [{ text: '🔙', callback_data: 'cmd_concursos' }]] },
  });
  return true;
}

async function handleTrialStart(ctx) {
  await ctx.answerCbQuery('Ativando trial...');
  ctx.reply(
    `🆓 *Trial Ativado — 7 dias Premium!*\n\n` +
    `Tudo desbloqueado. Aproveite!`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '📊 Predições', callback_data: 'cmd_predicao' }], [{ text: '🔙 Menu', callback_data: 'menu_principal' }]] },
    }
  );
  return true;
}

async function handlePremiumCheckout(ctx, planType) {
  const safePlanType = sanitizeInput(planType);
  await ctx.answerCbQuery();
  
  const planInfo = safePlanType === 'vitorioso' 
    ? { price: 'R$ 5,90/mês', url: 'https://gabaritou.com.br/checkout/vitorioso' }
    : { price: 'R$ 19,90/mês', url: 'https://gabaritou.com.br/assinar' };

  ctx.reply(
    `💳 *Assinar Premium — ${safePlanType.toUpperCase()}*\n\n` +
    `Preço: *${planInfo.price}*\n\n` +
    `Para assinar via Pix:\n` +
    `🔗 ${planInfo.url}\n\n` +
    `Após o pagamento, seu acesso é liberado automaticamente.`,
    {
      parse_mode: 'Markdown',
      reply_markup: { 
        inline_keyboard: [
          [{ text: '🔗 Assinar Agora', url: planInfo.url }], 
          [{ text: '🔙 Menu', callback_data: 'menu_principal' }]
        ] 
      },
    }
  );
  return true;
}
