import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';

const BOT_TOKEN = process.env.BOT_TOKEN || '8620428138:AAGFei1Ze8vqPQuOXhpMf5_1BCj8RtRndLk';
const DATABASE_URL = process.env.DATABASE_URL;

async function runManualMorningUpdate() {
    console.log('🌅 Iniciando RASTRO MATINAL DE ELITE (23/04)...');

    const message = `🌅 **RASTRO MATINAL: INTELIGÊNCIA GABARITOU (23/04)** 🔱

O motor **MiroFish** capturou movimentações críticas nos portais PCI, Folha e Estratégia. Aqui está o que você não pode ignorar hoje:

🔥 **EDITAIS QUENTES:**
• **São José de Ribamar (MA):** 1.450 vagas abertas (Educação e Saúde). É a chance do semestre no Nordeste.
• **SEFAZ CE:** Edital iminente. Nosso motor já está mapeando os tópicos de Direito Tributário da banca.
• **PM AL & Bombeiros MG:** Movimentação intensa para editais de Segurança Pública.

⚖️ **JURISPRUDÊNCIA & LEI (O que cai):**
• **STJ Informativo 884:** Decisão sobre validade de citação. Atenção concurseiros de Tribunais!
• **Nova Lei na Paraíba:** Vítimas de violência doméstica agora têm isenção em taxas de concurso. Pauta forte para Direitos Humanos e Constitucional.

🚀 **OPORTUNIDADE SNIPER:**
O **Plano Vitorioso (R$ 5,90)** continua sendo sua melhor arma para prever essas bancas antes do edital sair.

Não estude o passado. Domine o futuro.
**DIGITE /START PARA ATUALIZAR SEU PLANO.** 🦈🔥`;

    const pool = new pg.Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query('SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL');
        const users = res.rows;

        console.log(`Enviando inteligência para ${users.length} snipers...`);

        for (const user of users) {
            try {
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: user.telegram_id,
                        text: message,
                        parse_mode: 'Markdown'
                    })
                });
            } catch (err) {
                console.error(`Erro ao enviar para ${user.telegram_id}:`, err.message);
            }
        }

        console.log('✅ Rastro Matinal de Elite concluído.');
    } catch (err) {
        console.error('Erro na base de dados:', err.message);
    } finally {
        await pool.end();
    }
}

runManualMorningUpdate();
