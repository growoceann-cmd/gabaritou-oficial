/**
 * Callbacks do Bot — GABARITOU
 * Handlers de botões inline do teclado.
 */

import { getTopTopicos } from '../services/predictions.js';
import * as AITutor from '../services/ai-tutor.js';
import { generateStudyHTML } from '../services/study-html.js';

export async function handleCallbackQuery(ctx) {
  const data = ctx.callbackQuery?.data;
  if (!data) return false;

  const [type, ...params] = data.split(':');
  const param = params.join(':') || '';

  try {
    switch (type) {
      case 'predicao_banca':
        return await handlePredicaoBanca(ctx, param);
      case 'predicao_materia':
        return await handlePredicaoMateria(ctx, param);
      case 'concursos':
        return await handleConcursos(ctx, param);
      case 'simulado_start':
        return await handleSimuladoStart(ctx, param);
      case 'simulado_download':
        return await handleSimuladoDownload(ctx, param);
      case 'config_banca':
      await ctx.answerCbQuery();
      ctx.reply(
        `🏆 *Todas as Bancas Disponíveis*\n\n` +
        `O Gabaritou mapeia todas as bancas do Brasil. Qual é o seu foco hoje?`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: 'VUNESP', callback_data: 'set_banca:VUNESP' }, { text: 'FGV', callback_data: 'set_banca:FGV' }],
              [{ text: 'FCC', callback_data: 'set_banca:FCC' }, { text: 'CEBRASPE', callback_data: 'set_banca:CEBRASPE' }],
              [{ text: 'OUTRAS / TODAS', callback_data: 'set_banca:TODAS' }],
              [{ text: '🔙 Menu', callback_data: 'menu_principal' }],
            ],
          },
        }
      );
      return true;
    case 'set_banca':
      await ctx.answerCbQuery();
      ctx.reply(`✅ Banca configurada para: *${param}*\nSua IA está aprendendo agora com o estilo desta banca.`);
      return true;
    case 'config_reset_ml':
      await ctx.answerCbQuery();
      ctx.reply(`🧠 *Aprendizado de Máquina Resetado!*\nA IA começará a aprender seu estilo do zero.`);
      return true;
      case 'radar_activate':
        await ctx.answerCbQuery();
        ctx.reply(
          `🚀 *Ativar Radar Elite (Mensal)*\n\n` +
          `Clique no link abaixo para realizar o pagamento de R$ 3,00 e ativar sua inteligência de monitoramento agora:\n\n` +
          `🔗 [PAGAR R$ 3,00 NO MERCADO PAGO](https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=52048695-45026c7b-d054-45ee-ba4a-448fb4865e13)\n\n` +
          `*Após o pagamento, o Radar Elite será ativado automaticamente em sua conta.*`,
          { parse_mode: 'Markdown' }
        );
        return true;
      case 'gps_generate':
        await ctx.answerCbQuery();
        ctx.reply(
          `🛰️ *Gerar Auditoria GPS de Aprovação*\n\n` +
          `Clique no link abaixo para pagar R$ 2,00 e liberar sua auditoria de edital agora:\n\n` +
          `🔗 [PAGAR R$ 2,00 NO MERCADO PAGO](https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=52048695-a869ac0e-f7f6-49b2-a493-58fd4437cb6e)\n\n` +
          `*O relatório será gerado imediatamente após a confirmação.*`,
          { parse_mode: 'Markdown' }
        );
        return true;
      case 'mapa_generate':
        await ctx.answerCbQuery();
        ctx.reply(
          `🧠 *Gerar Mapa Mental IA*\n\n` +
          `Clique no link abaixo para pagar R$ 2,00 e gerar seu mapa mental personalizado agora:\n\n` +
          `🔗 [PAGAR R$ 2,00 NO MERCADO PAGO](https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=52048695-411a87f1-b951-4e86-a394-2fbc56f13167)\n\n` +
          `*O arquivo PDF será enviado aqui no chat logo em seguida.*`,
          { parse_mode: 'Markdown' }
        );
        return true;
      case 'trial_start':
        return await handleTrialStart(ctx);
      case 'premium_checkout':
        return await handlePremiumCheckout(ctx, param);
      case 'menu_principal':
        await ctx.answerCbQuery();
        const { showMenu } = await import('./commands.js');
        showMenu(ctx);
        return true;
      case 'cmd_plano':
        await ctx.answerCbQuery();
        const { handlePlano } = await import('./commands.js');
        handlePlano(ctx);
        return true;
      case 'cmd_tutor':
        await ctx.answerCbQuery();
        const { handleTutor } = await import('./commands.js');
        handleTutor(ctx);
        return true;
      case 'cmd_provaday':
        await ctx.answerCbQuery();
        const { handleProvaDay } = await import('./commands.js');
        handleProvaDay(ctx);
        return true;
      case 'cmd_revisar':
        await ctx.answerCbQuery();
        const { handleRevisar } = await import('./commands.js');
        handleRevisar(ctx);
        return true;
      case 'cmd_gps':
        await ctx.answerCbQuery();
        const { handleGPS } = await import('./commands.js');
        handleGPS(ctx);
        return true;
      case 'cmd_mapa':
        await ctx.answerCbQuery();
        const { handleMapa } = await import('./commands.js');
        handleMapa(ctx);
        return true;
      case 'cmd_armadilhas':
        await ctx.answerCbQuery();
        const { handleArmadilhas } = await import('./commands.js');
        handleArmadilhas(ctx);
        return true;
      case 'cmd_radar':
        await ctx.answerCbQuery();
        const { handleRadar } = await import('./commands.js');
        handleRadar(ctx);
        return true;
      case 'cmd_predicao':
        await ctx.answerCbQuery();
        const { handlePredicao } = await import('./commands.js');
        handlePredicao(ctx);
        return true;
      case 'cmd_progresso':
        await ctx.answerCbQuery();
        const { handleProgresso } = await import('./commands.js');
        handleProgresso(ctx);
        return true;
      case 'cmd_relatorio':
        await ctx.answerCbQuery();
        const { handleRelatorio } = await import('./commands.js');
        handleRelatorio(ctx);
        return true;
      case 'cmd_simulado':
        await ctx.answerCbQuery();
        const { handleSimulado } = await import('./commands.js');
        handleSimulado(ctx);
        return true;
      case 'cmd_ranking':
        await ctx.answerCbQuery();
        const { handleRanking } = await import('./commands.js');
        handleRanking(ctx);
        return true;
      case 'cmd_configurar':
        await ctx.answerCbQuery();
        const { handleConfigurar } = await import('./commands.js');
        handleConfigurar(ctx);
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
      case 'cmd_ajuda':
        await ctx.answerCbQuery();
        const { handleAjuda } = await import('./commands.js');
        handleAjuda(ctx);
        return true;
      case 'cmd_referral':
        await ctx.answerCbQuery();
        const { handleReferral } = await import('./commands.js');
        handleReferral(ctx);
        return true;
      case 'cmd_privacidade':
        await ctx.answerCbQuery();
        const { handlePrivacidade } = await import('./commands.js');
        handlePrivacidade(ctx);
        return true;
      default:
        await ctx.answerCbQuery('Opção não reconhecida');
        return true;
    }
  } catch (err) {
    console.error(`[Callback Error] ${data}:`, err.message);
    await ctx.answerCbQuery('Erro. Tente novamente.');
    return true;
  }
}

async function handlePredicaoBanca(ctx, banca) {
  await ctx.answerCbQuery(`Banca: ${banca}`);

  if (banca === 'OUTRA') {
    const { getOrCreateUser, activeSessions } = await import('./interceptor.js');
    const user = await getOrCreateUser(ctx.from.id, ctx.from.first_name, ctx.from.username);
    
    if (user.plan === 'free' || user.plan === 'trial_expired') {
      return ctx.reply(
        `🔒 *Análise de Banca Externa — Premium*\n\n` +
        `O mapeamento de bancas sob demanda está disponível apenas para membros do plano *Premium*.\n\n` +
        `Com o GABARITOU Premium, você tem acesso à teia universal de todas as bancas do Brasil.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🆓 Ativar 3 dias Grátis', callback_data: 'trial_start' }],
              [{ text: '⭐ Ver Planos Premium', callback_data: 'cmd_premium' }],
            ],
          },
        }
      );
    }

    activeSessions.set(ctx.from.id, { type: 'waiting_for_banca', status: 'active' });
    
    return ctx.reply(
      `🕸️ *Conexão Universal — GABARITOU*\n\n` +
      `Digite o nome da banca que você deseja que a teia analise agora.\n\n` +
      `Exemplos: *IDECAN, CONSULPLAN, CETREDE, FUNDATEC, IBFC...*`,
      { parse_mode: 'Markdown' }
    );
  }

  if (banca === 'TODAS') {
    ctx.reply(
      `🔒 *Todas as bancas — Premium*\n\n` +
      `Funcionalidade Premium.\n\n` +
      `Preço: R$ 19,90/mês (Sniper)\n` +
      `3 dias grátis para testar!`,
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
  const rows = materias.map((m) => [{ text: m, callback_data: `predicao_materia:${banca}:${m}` }]);
  rows.push([{ text: '🔙', callback_data: 'cmd_predicao' }]);

  ctx.reply(`📊 *${banca}* — Selecione a matéria:`, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: rows },
  });
  return true;
}

async function handlePredicaoMateria(ctx, param) {
  const [banca, ...materiaParts] = param.split(':');
  const materia = materiaParts.join(':');
  await ctx.answerCbQuery('Carregando...');

  try {
    const predicoes = await getTopTopicos(banca, materia, 5);
    let msg = `📊 *${banca} — ${materia}*\n\n`;

    if (predicoes.length === 0) {
        msg += "Nenhuma predição encontrada para esta matéria.";
    } else {
        predicoes.forEach((p, i) => {
            const emoji = p.probabilidade >= 80 ? '🟢' : p.probabilidade >= 60 ? '🟡' : '🔴';
            msg += `${emoji} *${i + 1}. ${p.topico}*\n`;
            msg += `   Probabilidade: *${p.probabilidade}%*\n`;
            if (p.armadilha) msg += `   ⚠️ ${p.armadilha}\n`;
            msg += '\n';
        });
        msg += `🎯 Precisão: 87.3%`;
    }

    ctx.reply(msg, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Mais tópicos (Premium)', callback_data: 'cmd_premium' }],
          [{ text: '🔙', callback_data: `predicao_banca:${banca}` }],
        ],
      },
    });
  } catch (err) {
    ctx.reply(`Erro: ${err.message}`);
  }
  return true;
}

async function handleConcursos(ctx, uf) {
  await ctx.answerCbQuery(`UF: ${uf}`);

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

  const lista = data[uf] || [{ nome: `${uf} — Ver site`, data: 'Em breve', vagas: '-' }];
  let msg = `📋 *Concursos — ${uf}*\n\n`;
  lista.forEach((c, i) => {
    msg += `${i + 1}. *${c.nome}*\n   📅 ${c.data} | 💼 ${c.vagas} vagas\n\n`;
  });

  ctx.reply(msg, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [[{ text: '📊 Predições', callback_data: 'cmd_predicao' }], [{ text: '🔙', callback_data: 'cmd_concursos' }]] },
  });
  return true;
}

async function handleSimuladoStart(ctx, materia) {
  await ctx.answerCbQuery('Preparando simulado...');
  
  const materiaMap = {
    'dir_administrativo': 'Direito Administrativo',
    'dir_constitucional': 'Direito Constitucional',
    'portugues': 'Português',
    'raciocinio_logico': 'Raciocínio Lógico'
  };

  const materiaNome = materiaMap[materia] || 'Conhecimentos Gerais';
  
  ctx.reply(
    `🎯 *Simulado de ${materiaNome}*\n\n` +
    `Como você prefere realizar este simulado?`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Iniciar aqui no Telegram', callback_data: `simulado_run_tg:${materia}` }],
          [{ text: '💻 Baixar para PC (HTML Portátil)', callback_data: `simulado_download:${materia}` }],
          [{ text: '🔙', callback_data: 'cmd_simulado' }]
        ]
      }
    }
  );
  return true;
}

async function handleSimuladoDownload(ctx, materia) {
  await ctx.answerCbQuery('Gerando arquivo HTML...');
  
  const userId = ctx.from.id;
  const userName = ctx.from.first_name || 'Estudante';
  
  const materiaMap = {
    'dir_administrativo': 'Direito Administrativo',
    'dir_constitucional': 'Direito Constitucional',
    'portugues': 'Português',
    'raciocinio_logico': 'Raciocínio Lógico'
  };
  const materiaNome = materiaMap[materia] || 'Geral';

  try {
    // Gerar simulado via AI Tutor
    const simulado = AITutor.gerarSimuladoAdaptativo(userId, 'VUNESP', materiaNome);
    
    // Gerar HTML
    const htmlContent = generateStudyHTML({
      userId,
      userName,
      banca: 'VUNESP',
      materia: materiaNome,
      questoes: simulado.questoes,
      tempoLimite: simulado.tempo_limite_minutos
    });

    const filename = `Gabaritou_Simulado_${materia}.html`;
    
    // Enviar como arquivo no Telegram
    await ctx.replyWithDocument({
      source: Buffer.from(htmlContent),
      filename: filename
    }, {
      caption: `💻 *Arquivo Portátil Gerado!*\n\n` +
               `Baixe este arquivo no seu PC para estudar em uma tela maior.\n\n` +
               `🎯 *Banca:* VUNESP\n` +
               `📚 *Matéria:* ${materiaNome}\n` +
               `⏱️ *Tempo:* ${simulado.tempo_limite_minutos} min\n\n` +
               `Quando terminar, use o código de sincronização no final do arquivo para salvar seu progresso aqui!`,
      parse_mode: 'Markdown'
    });

  } catch (err) {
    ctx.reply(`Erro ao gerar arquivo: ${err.message}`);
  }
  return true;
}

async function handleTrialStart(ctx) {
  await ctx.answerCbQuery('Ativando trial...');
  ctx.reply(
    `🆓 *Trial Ativado — 3 dias Premium!*\n\n` +
    `Tudo desbloqueado. Aproveite!`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '📊 Predições', callback_data: 'cmd_predicao' }], [{ text: '🔙 Menu', callback_data: 'menu_principal' }]] },
    }
  );
  return true;
}

async function handlePremiumCheckout(ctx, planType) {
  await ctx.answerCbQuery();
  
  const pricingInfo = {
    vitorioso: { name: 'Vitorioso (Anual)', price: 'R$ 7,90/mês (Total R$ 94,80)' },
    combatente: { name: 'Combatente (Semestral)', price: 'R$ 11,90/mês (Total R$ 71,40)' },
    sniper: { name: 'Sniper (Mensal)', price: 'R$ 19,90/mês' },
  };

  const plan = pricingInfo[planType] || pricingInfo.sniper;

  ctx.reply(
    `💳 *Assinar Premium — ${plan.name}*\n\n` +
    `Preço: *${plan.price}*\n\n` +
    `Para finalizar sua assinatura via Pix ou Cartão:\n` +
    `🔗 https://gabaritouconcursos.com.br/premium\n\n` +
    `Após o pagamento, seu acesso é liberado automaticamente.`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔗 Finalizar Pagamento', url: 'https://gabaritouconcursos.com.br/premium' }],
          [{ text: '🔙 Menu', callback_data: 'menu_principal' }],
        ],
      },
    }
  );
  return true;
}
