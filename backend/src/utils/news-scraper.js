import fetch from 'node-fetch';

/**
 * Scraper especializado para o Ache Concursos.
 * Extrai as notícias mais quentes com Vagas e Salários.
 */
export async function getLatestNews() {
    try {
        const response = await fetch('https://www.acheconcursos.com.br/');
        const html = await response.text();

        const newsItems = [];
        
        // Regex para capturar blocos de notícias
        // Padrão: Notícia (H2) seguido de descrição (texto após o H2)
        const regex = /<h2[^>]*>(.*?)<\/h2>[\s\S]*?<p[^>]*>(.*?)<\/p>/g;
        let match;

        while ((match = regex.exec(html)) !== null && newsItems.length < 5) {
            let title = match[1].replace(/<[^>]*>/g, '').trim();
            let description = match[2].replace(/<[^>]*>/g, '').trim();
            
            // Filtro para garantir que pegamos notícias com números de vagas ou salários
            if (title.length > 10 && (title.includes('vaga') || title.includes('R$') || description.includes('vaga') || description.includes('R$'))) {
                newsItems.push(`📢 *${title}*\n   └ ${description}`);
            }
        }

        // Caso o regex acima falhe em pegar o formato, fallback para apenas títulos limpos
        if (newsItems.length === 0) {
            const backupRegex = /<h2[^>]*>(.*?)<\/h2>/g;
            while ((match = backupRegex.exec(html)) !== null && newsItems.length < 5) {
                let title = match[1].replace(/<[^>]*>/g, '').trim();
                if (title.length > 10) newsItems.push(`📢 *${title}*`);
            }
        }

        return newsItems;
    } catch (error) {
        console.error('Erro ao buscar notícias:', error.message);
        return [];
    }
}

// Teste rápido
if (process.argv[1] && process.argv[1].includes('news-scraper.js')) {
    getLatestNews().then(news => console.log('Notícias Capturadas:\n', news.join('\n\n')));
}
