import { generateB2BFormHTML } from '../../utils/b2b-generator.js';
import fs from 'fs';
import path from 'path';
import { sanitizeInput } from '../../utils/helpers.js';

/**
 * Handler para o comando /api (Lead Capture B2B)
 */
export async function handleApiB2B(ctx) {
  const name = sanitizeInput(ctx.from.first_name || 'Parceiro');
  const dateStr = new Date().toLocaleDateString('pt-BR');

  const html = generateB2BFormHTML({ name });
  const fileName = `B2B_Partner_Form_${ctx.from.id}_${Date.now()}.html`;
  const filePath = path.join(process.cwd(), 'temp', fileName);

  try {
    // Garantir que a pasta temp existe
    if (!fs.existsSync(path.join(process.cwd(), 'temp'))) {
      fs.mkdirSync(path.join(process.cwd(), 'temp'));
    }

    fs.writeFileSync(filePath, html);

    await ctx.reply(
      `🔌 *Aether Engine B2B — Parcerias & API*\n\n` +
      `Olá, *${name}*! Você está prestes a acessar a camada corporativa do Gabaritou.\n\n` +
      `Nossa tecnologia de *Swarm Intelligence* (MiroFish) pode ser integrada diretamente no seu portal de alunos ou cursinho via API White Label.\n\n` +
      `🚀 *O que oferecemos:*\n` +
      `• Predição de questões por banca (ENEM, OAB, Concursos)\n` +
      `• Simulador de nota de corte em tempo real\n` +
      `• Monitoramento de fadiga cognitiva\n\n` +
      `Estou enviando o *Formulário de Qualificação B2B* abaixo. Preencha os dados da sua instituição para receber uma proposta de Setup Fee.`,
      { parse_mode: 'Markdown' }
    );

    await ctx.replyWithDocument(
      { source: filePath, filename: `GABARITOU_B2B_Qualificacao.html` },
      { caption: '🔗 Abra este arquivo no navegador para solicitar acesso à API.' }
    );

    // Limpeza após o envio
    setTimeout(() => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, 5000);

  } catch (err) {
    console.error('[ApiB2B Error]:', err.message);
    ctx.reply('❌ Erro ao gerar formulário B2B. Tente novamente mais tarde.');
  }
}
