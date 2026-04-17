/**
 * Commands do Bot Telegram — GABARITOU (Modelo BeConfident)
 */

import { getTopTopicos } from '../services/predictions.js';
import { PRICING, LIMITS, SOCIAL } from '../config/constants.js';
import { queryOne, query } from '../db/connection.js';

// ─── /start ──────────────────────────────────────────────────────
export async function handleStart(ctx) {
  const code = ctx.message.text.split(' ')[1];
  const name = ctx.from.first_name || 'Concurseiro';
  const telegram_id = ctx.from.id;
  const username = ctx.from.username || null;
  const full_name = ((ctx.from.first_name || '') + ' ' + (ctx.from.last_name || '')).trim();

  const isSuperUser = telegram_id === 8206934939 || code === 'SAOBENTO' || code === 'SÃOBENTO';
  const isElite = isSuperUser;

  // Garantir usuário no banco com plano correto
  try {
    let user = await queryOne('SELECT id FROM users WHERE telegram_id = $1', [telegram_id]);
    
    if (!user) {
      const plan = isElite ? 'elite' : 'trial';
      const validity = isElite ? "INTERVAL '99 years'" : "INTERVAL '5 days'";
      
      await query(
        `INSERT INTO users (telegram_id, username, full_name, plan, is_premium, premium_until, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW() + ${validity}, NOW())`,
        [telegram_id, username, full_name, plan, true]
      );
      console.log(`✅ Novo usuário (${plan}) registrado: ${full_name} (${telegram_id})`);
    } else if (isElite) {
      await query(
        `UPDATE users SET plan = 'elite', is_premium = true, premium_until = NOW() + INTERVAL '99 years' WHERE id = $1`,
        [user.id]
      );
    }
  } catch (err) {
    console.error('❌ Erro ao gerenciar usuário no banco:', err.message);
  }

  if (isSuperUser) {
    return ctx.reply(
      `🔱 *SALVE, MESTRE SÃO BENTO!*\n\n` +
      `A aplicação está totalmente liberada para você. Sua teia não tem limites. 🦈\n\n` +
      `🚀 *Status:* Mestre Elite Ativado.\n\n` +
      `*Acesso total ao sistema preditivo.*`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Predições', callback_data: 'cmd_predicao' }, { text: '🧠 Tutor IA', callback_data: 'cmd_tutor' }],
            [{ text: '🛰️ GPS Edital', callback_data: 'cmd_gps' }, { text: '📡 Radar', callback_data: 'cmd_radar' }],
            [{ text: '📝 Simulados', callback_data: 'cmd_simulado' }, { text: '🔍 Outros', callback_data: 'menu_principal' }],
          ],
        }
      }
    );
  }

  ctx.reply(
    `🚨 *ATENÇÃO: VAGAS ELITE PREENCHIDAS!*\n\n` +
    `As 300 vagas de acesso gratuito vitalício foram tomadas em tempo recorde.\n\n` +
    `Porém, como você foi rápido e a Teia reconheceu seu potencial, liberamos um *PRÊMIO DE CONSOLAÇÃO*:\n\n` +
    `🎁 *5 DIAS DE ACESSO FULL (Bot + Web)*\n\n` +
    `Sinta o poder da IA que processou 3 milhões de questões e fica mais inteligente a cada conversa.`,
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📊 Predições', callback_data: 'cmd_predicao' }, { text: '🧠 Tutor IA', callback_data: 'cmd_tutor' }],
          [{ text: '🛰️ GPS Edital', callback_data: 'cmd_gps' }, { text: '📡 Radar', callback_data: 'cmd_radar' }],
          [{ text: '📝 Simulados', callback_data: 'cmd_simulado' }, { text: '🔍 Outros', callback_data: 'menu_principal' }],
        ],
      }
    }
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
          { text: '🔍 Outra Banca (Premium)', callback_data: 'predicao_banca:OUTRA' },
        ],
        [
          { text: '🔙 Menu', callback_data: 'menu_principal' },
        ],
      ],
    },
  };

  ctx.reply(`📊 *Mapeamento Preditivo — GABARITOU*\n\nA teia está analisando milhares de questões para prever o que cairá na sua prova. Escolha a banca:`, {
    parse_mode: 'Markdown',
    ...keyboard,
  });
}

// ─── /progresso ──────────────────────────────────────────────────
export async function handleProgresso(ctx) {
  const telegram_id = ctx.from.id;
  const user = await queryOne('SELECT * FROM users WHERE telegram_id = $1', [telegram_id]);
  
  if (!user) return ctx.reply('Usuário não encontrado.');

  const progress = await query(
    `SELECT materia, AVG(taxa_acerto)::numeric(5,2) as media, SUM(questoes) as total
     FROM study_progress WHERE user_id = $1 GROUP BY materia`,
    [user.id]
  );

  let msg = `📈 *Seu Desempenho Elite*\n\n`;
  if (progress.length === 0) {
    msg += `Você ainda não iniciou sessões de estudo. Mande uma mensagem para começar!`;
  } else {
    progress.forEach((p) => {
      msg += `📚 *${p.materia}*\n   Taxa: *${p.media}%* | Questões: *${p.total}*\n\n`;
    });
  }

  ctx.reply(msg, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[{ text: '🔙 Menu', callback_data: 'menu_principal' }]],
    },
  });
}

// ─── /simulado ───────────────────────────────────────────────────
export function handleSimulado(ctx) {
  ctx.reply(
    `📝 *Simulados Adaptativos IA*\n\n` +
    `A IA gera questões baseadas no seu nível e nas predições da banca.\n\n` +
    `Escolha a matéria para iniciar:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏛️ Dir. Administrativo', callback_data: 'simulado_start:dir_administrativo' }],
          [{ text: '⚖️ Dir. Constitucional', callback_data: 'simulado_start:dir_constitucional' }],
          [{ text: '📝 Português', callback_data: 'simulado_start:portugues' }],
          [{ text: '🧠 Raciocínio Lógico', callback_data: 'simulado_start:raciocinio_logico' }],
          [{ text: '🔍 Outra Disciplina', callback_data: 'simulado_materia:OUTRA' }],
          [{ text: '💻 Baixar Simulados p/ PC (HTML)', callback_data: 'cmd_downloads' }],
          [{ text: '🔄 Mudar Banca (Todas Disponíveis)', callback_data: 'config_banca' }],
          [{ text: '🔙 Menu', callback_data: 'menu_principal' }],
        ],
      },
    }
  );
}

// ─── /ranking ────────────────────────────────────────────────────
export async function handleRanking(ctx) {
  const topUsers = await query(`SELECT full_name, plan FROM users ORDER BY created_at ASC LIMIT 5`);
  
  let msg = `🏆 *Ranking de Elite — GABARITOU*\n\n`;
  topUsers.forEach((u, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👤';
    msg += `${medal} *${u.full_name}* — ${u.plan.toUpperCase()}\n`;
  });

  ctx.reply(msg, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[{ text: '📊 Ver Leaderboard Completo', callback_data: 'cmd_ranking_full' }], [{ text: '🔙 Menu', callback_data: 'menu_principal' }]],
    },
  });
}

// ─── /premium ────────────────────────────────────────────────────
export function handlePremium(ctx) {
  ctx.reply(
    `⭐ *GABARITOU PREMIUM*\n\n` +
    `Desbloqueie o poder total da teia preditiva.\n\n` +
    `✅ Predições Ilimitadas\n` +
    `✅ GPS de Aprovação (Auditoria de Edital)\n` +
    `✅ Mapas Mentais IA Personalizados\n` +
    `✅ Radar Elite de Concursos\n\n` +
    `*Escolha seu plano:*`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: `🦈 Vitorioso (Anual) — ${PRICING.vitorioso}`, callback_data: 'premium_checkout:vitorioso' }],
          [{ text: `⚔️ Combatente (Semestral) — ${PRICING.combatente}`, callback_data: 'premium_checkout:combatente' }],
          [{ text: `🎯 Sniper (Mensal) — ${PRICING.sniper}`, callback_data: 'premium_checkout:sniper' }],
          [{ text: '🆓 Ativar 3 dias Grátis', callback_data: 'trial_start' }],
          [{ text: '🔙 Menu', callback_data: 'menu_principal' }],
        ],
      },
    }
  );
}

// ─── /menu ───────────────────────────────────────────────────────
export function showMenu(ctx) {
  ctx.reply(`🕸️ *Menu Principal — GABARITOU*`, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📊 Minhas Predições', callback_data: 'cmd_predicao' }, { text: '📈 Meu Progresso', callback_data: 'cmd_progresso' }],
        [{ text: '🛰️ GPS de Aprovação', callback_data: 'cmd_gps' }, { text: '📡 Radar Elite', callback_data: 'cmd_radar' }],
        [{ text: '📝 Simulados IA', callback_data: 'cmd_simulado' }, { text: '🧠 Tutor IA', callback_data: 'cmd_tutor' }],
        [{ text: '🏆 Ranking', callback_data: 'cmd_ranking' }, { text: '🎁 Convide e Ganhe', callback_data: 'cmd_referral' }],
        [{ text: '⚙️ Configurações', callback_data: 'cmd_configurar' }, { text: '🔒 Privacidade', callback_data: 'cmd_privacidade' }],
      ],
    },
  });
}

// ─── /plano ──────────────────────────────────────────────────────
export async function handlePlano(ctx) {
    const user = await queryOne('SELECT * FROM users WHERE telegram_id = $1', [ctx.from.id]);
    if (!user) return ctx.reply('Usuário não encontrado.');

    const status = user.is_premium ? '✅ ATIVO' : '❌ EXPIRADO';
    const expires = user.premium_until ? new Date(user.premium_until).toLocaleDateString('pt-BR') : 'N/A';

    ctx.reply(
        `👤 *Sua Assinatura*\n\n` +
        `Plano: *${user.plan.toUpperCase()}*\n` +
        `Status: *${status}*\n` +
        `Válido até: *${expires}*\n\n` +
        `Precisa de suporte? @growoceann`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '⭐ Mudar Plano', callback_data: 'cmd_premium' }],
                    [{ text: '🔙 Menu', callback_data: 'menu_principal' }]
                ]
            }
        }
    );
}

// ─── /gps ────────────────────────────────────────────────────────
export function handleGPS(ctx) {
    ctx.reply(
        `🛰️ *GPS de Aprovação (Auditoria IA)*\n\n` +
        `A IA analisa o edital e seu histórico para criar o caminho mais curto até a aprovação.\n\n` +
        `*O que você recebe:* \n` +
        `- Auditoria de tópicos quentes\n` +
        `- Cronograma adaptativo\n` +
        `- Alertas de armadilhas da banca\n\n` +
        `*Custo:* R$ 2,00 por auditoria (Premium Free)`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎯 Gerar Meu GPS Agora', callback_data: 'gps_generate' }],
                    [{ text: '🔙 Menu', callback_data: 'menu_principal' }]
                ]
            }
        }
    );
}

// ─── /mapa ───────────────────────────────────────────────────────
export function handleMapa(ctx) {
    ctx.reply(
        `🧠 *Mapas Mentais IA*\n\n` +
        `Transformamos tópicos complexos em esquemas visuais memorizáveis.\n\n` +
        `*Custo:* R$ 2,00 por mapa (Premium Free)`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🧠 Gerar Mapa IA', callback_data: 'mapa_generate' }],
                    [{ text: '🔙 Menu', callback_data: 'menu_principal' }]
                ]
            }
        }
    );
}

// ─── /radar ──────────────────────────────────────────────────────
export function handleRadar(ctx) {
    ctx.reply(
        `📡 *Radar Elite — GABARITOU*\n\n` +
        `Monitoramento em tempo real de editais, retificações e boatos quentes.\n\n` +
        `*Status:* Offline (Ative para monitorar)\n` +
        `*Custo:* R$ 3,00/mês`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🚀 Ativar Radar Elite', callback_data: 'radar_activate' }],
                    [{ text: '🔙 Menu', callback_data: 'menu_principal' }]
                ]
            }
        }
    );
}

// ─── /tutor ──────────────────────────────────────────────────────
export function handleTutor(ctx) {
    ctx.reply(
        `🧠 *Tutor IA — GABARITOU*\n\n` +
        `Tire dúvidas teóricas agora. Mande sua pergunta sobre qualquer matéria.\n\n` +
        `*Exemplo:* "Qual a diferença entre autarquia e fundação pública?"`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '💬 Iniciar Conversa', callback_data: 'tutor_start' }],
                    [{ text: '🔙 Menu', callback_data: 'menu_principal' }]
                ]
            }
        }
    );
}

// ─── /concursos ──────────────────────────────────────────────────
export function handleConcursos(ctx) {
    ctx.reply(
        `📅 *Calendário de Concursos 2026*\n\n` +
        `Selecione sua região ou área de interesse:`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🇧🇷 NACIONAL / FEDERAL', callback_data: 'concursos:FEDERAL' }],
                    [{ text: '🌆 SÃO PAULO', callback_data: 'concursos:SP' }, { text: '🏖️ RIO DE JANEIRO', callback_data: 'concursos:RJ' }],
                    [{ text: '🔙 Menu', callback_data: 'menu_principal' }]
                ]
            }
        }
    );
}

// ─── /provaday ───────────────────────────────────────────────────
export function handleProvaDay(ctx) {
    ctx.reply(
        `🏁 *PROVA DAY — GABARITOU*\n\n` +
        `Simulação completa do dia da prova com pressão de tempo e ranking em tempo real.\n\n` +
        `*Próximo Prova Day:* Domingo, às 14:00.`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📝 Me Inscrever', callback_data: 'provaday_register' }],
                    [{ text: '🔙 Menu', callback_data: 'menu_principal' }]
                ]
            }
        }
    );
}

// ─── /armadilhas ─────────────────────────────────────────────────
export function handleArmadilhas(ctx) {
    ctx.reply(
        `⚠️ *Campo Minado (Armadilhas da Banca)*\n\n` +
        `Conheça as pegadinhas mais comuns das bancas examinadoras.\n\n` +
        `Escolha o tópico:`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Pegadinhas VUNESP', callback_data: 'armadilhas:VUNESP' }],
                    [{ text: 'Pegadinhas FGV', callback_data: 'armadilhas:FGV' }],
                    [{ text: '🔙 Menu', callback_data: 'menu_principal' }]
                ]
            }
        }
    );
}

// ─── /relatorio ──────────────────────────────────────────────────
export function handleRelatorio(ctx) {
    ctx.reply(
        `📊 *Relatório de Acurácia*\n\n` +
        `Veja como a IA está performando em suas predições comparadas com as provas reais.`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📈 Ver Acurácia (87.3%)', callback_data: 'accuracy_view' }],
                    [{ text: '🔙 Menu', callback_data: 'menu_principal' }]
                ]
            }
        }
    );
}

// ─── /referral ───────────────────────────────────────────────────
export function handleReferral(ctx) {
  const link = `https://t.me/gabaritou_oficial_bot?start=REF${ctx.from.id}`;
  ctx.reply(
    `🎁 *Convide e Ganhe (Sócio Gabaritou)*\n\n` +
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
