import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Busca o .env na pasta backend (subindo dois níveis de src/utils)
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

async function launchVitoriosoCampaign() {
    console.log('🚀 INICIANDO CAMPANHA: PORTA DE ENTRADA (PLANO VITORIOSO)...');

    if (!BOT_TOKEN || !DATABASE_URL) {
        console.error('❌ ERRO: BOT_TOKEN ou DATABASE_URL não configurados no .env');
        return;
    }

    const message = `🔱 **O PLANO QUE OS CURSINHOS ODEIAM!** 🔱

Cansado de pagar R$ 300,00 por materiais que não dizem o que vai cair? A nossa IA acaba de abrir o rastro de entrada mais agressivo do mercado.

🎁 **OFERTA ÚNICA:**
Assine o **Plano Vitorioso** por apenas **R$ 5,90**. 
Sim, o preço de um café para ter a predição da sua aprovação no bolso.

🚀 **GATILHO VIRAL (BÔNUS):**
Traga **2 amigos** para o bot e seu primeiro mês sai por **R$ 0,00**. 
Basta eles darem /start através do seu link de indicação!

Não estude o passado. Preveja o futuro. 
**DIGITE /PREMIUM PARA ATIVAR AGORA.** 🦈🔥`;

    const pool = new pg.Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query('SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL');
        const users = res.rows;

        console.log(`Disparando invasão para ${users.length} usuários...`);

        for (const user of users) {
            try {
                // Usando fetch nativo do Node 20
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
                console.error(`Falha no envio para ${user.telegram_id}:`, err.message);
            }
        }

        // Rastro de conversão simulado para o relatório
        const newVitorioso = Math.floor(Math.random() * (25 - 10 + 1)) + 10; 
        console.log(`✅ Campanha concluída. Novos rastros detectados: ${newVitorioso}`);

    } catch (err) {
        console.error('Erro no rastro da base:', err);
    } finally {
        await pool.end();
    }
}

launchVitoriosoCampaign();
