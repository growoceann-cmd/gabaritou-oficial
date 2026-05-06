import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';
import { getLatestNews } from './news-scraper.js';

const BOT_TOKEN = process.env.BOT_TOKEN || '8620428138:AAGFei1Ze8vqPQuOXhpMf5_1BCj8RtRndLk';
const DATABASE_URL = process.env.DATABASE_URL;

async function runMorningSniper() {
    console.log('🌅 Iniciando Operação Morning Sniper...');

    // 1. Capturar notícias reais
    const news = await getLatestNews();
    const newsList = news.map(item => `• ${item}`).join('\n');

    // 2. Montar Mensagem Master
    const date = new Date().toLocaleDateString('pt-BR');
    const message = `🌅 **MORNING SNIPER: O RASTRO DAS NOTÍCIAS (${date})** 🔱\n\nDireto do portal Ache Concursos, as movimentações mais quentes do dia:\n\n${newsList || '• Processando novos editais...'}\n\n🚀 **NOSSA ATUALIZAÇÃO (MiroFish v3.2):** \nEnquanto outros sites apenas listam notícias, nosso motor **MiroFish** já está processando esses editais para prever o seu sucesso.\n\n💰 **PLANO VITORIOSO (R$ 5,90):** \nO rastro mais barato do mercado continua ativo. Não perca a chance de sair na frente.\n\nNão estude o que já caiu. Preveja o que VAI cair.\n\n**DIGITE /START E COMECE A PREVER AGORA.** 🦈🔥`;

    // 3. Buscar usuários no Supabase
    const pool = new pg.Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query('SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL');
        const users = res.rows;

        console.log(`Enviando para ${users.length} snipers...`);

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

        console.log('✅ Operação Morning Sniper concluída com sucesso.');
    } catch (err) {
        console.error('Erro na base de dados:', err.message);
    } finally {
        await pool.end();
    }
}

runMorningSniper();
