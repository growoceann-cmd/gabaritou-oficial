import 'dotenv/config';
import fetch from 'node-fetch';
import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const baseUrl = "https://rota-api.grancursosonline.com.br/questoes/search";
const baseParams = "dificuldade=3,4&banca=286,27,92,102,252,277,26,982&assunto=405199,405626,403716,405707,407143,406602,405030,403587,403825,32,2538,404571,406223,404257,427647&desatualizada=0&anulada=0";

async function extract() {
    console.log("🚀 Iniciando Extração Massiva Hermes — 4.000 Questões...");
    
    let totalExtracted = 0;
    const targetCount = 4000;
    const pagesToFetch = 200;

    for (let i = 1; i <= pagesToFetch; i++) {
        console.log(`📦 Processando página ${i}/${pagesToFetch}...`);
        const url = `${baseUrl}?${baseParams}&page=${i}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`❌ Erro na página ${i}: ${response.status}`);
                continue;
            }

            const data = await response.json();
            const items = data.data || data.items || [];
            
            if (items.length === 0) {
                console.log("🏁 Fim dos dados alcançado.");
                break;
            }

            for (const q of items) {
                const questionData = {
                    id: q.id,
                    banca: q.banca?.nome || q.banca,
                    materia: q.materia?.nome || q.materia,
                    enunciado: q.texto || q.enunciado,
                    alternativas: q.alternativas?.map(a => ({
                        texto: a.texto || a.descricao,
                        correta: !!a.correta
                    })) || []
                };

                // Insert into Supabase (embeddings table as a placeholder or create a new one)
                // For now, let's use the 'embeddings' table as a 'knowledge base' 
                // but ideally we should have a 'questoes' table.
                // I'll create the table first.
                
                await pool.query(
                    'INSERT INTO embeddings (content, metadata) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [questionData.enunciado, JSON.stringify(questionData)]
                );
                
                totalExtracted++;
            }

            console.log(`✅ ${totalExtracted} questões indexadas na Teia.`);
            
            if (totalExtracted >= targetCount) break;

            // Rate limit prevention
            await new Promise(r => setTimeout(r, 200));

        } catch (error) {
            console.error(`❌ Erro crítico na página ${i}:`, error.message);
        }
    }

    console.log(`\n🏆 OPERAÇÃO FINALIZADA. ${totalExtracted} QUESTÕES INTEGRADAS.`);
    await pool.end();
}

extract();
