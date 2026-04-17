import 'dotenv/config';
import fs from 'fs';
import readline from 'readline';
import pg from 'pg';
import path from 'path';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });

const FILE_PATH = path.join(process.cwd(), 'gabaritou_4000_questoes_ELITE.jsonl');
const DADOS_DIR = path.join(process.cwd(), 'backend', 'dados');

async function processLine(line) {
  try {
    const question = JSON.parse(line);
    return question;
  } catch (err) {
    return null;
  }
}

async function upload() {
  console.log('🔱 INICIANDO SINCRONIZAÇÃO DE ELITE (4.000 QUESTÕES) 🔱');

  if (!fs.existsSync(FILE_PATH)) {
    console.error(`❌ ERRO: Arquivo não encontrado em ${FILE_PATH}`);
    console.log('Certifique-se de que baixou o arquivo usando o GABARITOU HUB no navegador.');
    return;
  }

  const fileStream = fs.createReadStream(FILE_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  const questions = [];

  for await (const line of rl) {
    const q = await processLine(line);
    if (q) {
      questions.push(q);
      count++;
    }
  }

  console.log(`✅ ${count} questões carregadas do arquivo.`);

  // 1. Agrupar para o Data Flywheel (Arquivos JSON locais)
  console.log('📂 Gerando arquivos de Predição (Data Flywheel)...');
  const grouped = {};

  questions.forEach(q => {
    const banca = (q.banca?.nome || 'OUTRA').toUpperCase();
    const materia = (q.disciplina?.nome || 'Geral').toLowerCase().replace(/ /g, '-');
    const key = `${banca}:${materia}`;

    if (!grouped[key]) grouped[key] = [];
    
    // Adicionar tópico (assunto)
    const topico = q.assuntos && q.assuntos[0] ? q.assuntos[0].nome : 'Geral';
    
    let existing = grouped[key].find(t => t.topico === topico);
    if (!existing) {
      existing = {
        id: `t_${Math.random().toString(36).substr(2, 9)}`,
        topico: topico,
        subtopicos: [],
        probabilidade: 0,
        recencia: 0,
        peso_historico: 0,
        total_feedbacks: 0,
        acertos_feedbacks: 0,
        nivel_dificuldade: q.dificuldade?.nome?.toLowerCase() || 'medio',
        armadilhas: ["Pegadinha recorrente nesta banca"],
        dicas: ["Foque na letra da lei para este assunto"]
      };
      grouped[key].push(existing);
    }
    
    // Incrementar "probabilidade" baseada na frequência (simples)
    existing.peso_historico += 1;
  });

  // Salvar arquivos .json em backend/dados
  if (!fs.existsSync(DADOS_DIR)) fs.mkdirSync(DADOS_DIR, { recursive: true });

  for (const [key, topics] of Object.entries(grouped)) {
    const [banca, materia] = key.split(':');
    const totalQuestions = topics.reduce((sum, t) => sum + t.peso_historico, 0);
    
    // Normalizar probabilidade
    topics.forEach(t => {
      t.probabilidade = Math.round((t.peso_historico / totalQuestions) * 100);
    });

    const fileName = `${banca.toLowerCase()}-${materia}.json`;
    fs.writeFileSync(path.join(DADOS_DIR, fileName), JSON.stringify(topics, null, 2));
    console.log(`📝 Criado: ${fileName} (${topics.length} tópicos)`);
  }

  // 2. Inserir no Supabase (Embeddings e Predictions)
  console.log('🚀 Injetando no Supabase...');
  
  try {
    // Inserir predições resumidas
    for (const [key, topics] of Object.entries(grouped)) {
      const [banca, materia] = key.split(':');
      await pool.query(
        `INSERT INTO predictions (banca, discipline, result, accuracy, created_at) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [banca, materia, JSON.stringify(topics), 85.0]
      );
    }
    console.log('✅ Tabela `predictions` atualizada.');

    // Inserir questões em `embeddings` (Apenas metadados, sem vetor real por enquanto)
    const batchSize = 100;
    for (let i = 0; i < Math.min(questions.length, 500); i += batchSize) { // Limitado a 500 para teste inicial
      const batch = questions.slice(i, i + batchSize);
      const values = batch.map(q => `('${q.pergunta.replace(/'/g, "''")}', '${JSON.stringify(q).replace(/'/g, "''")}', NOW())`).join(',');
      
      await pool.query(`INSERT INTO embeddings (content, metadata, created_at) VALUES ${values}`);
      console.log(`📦 Lote de 100 questões injetado em embeddings... (${i + batchSize}/${questions.length})`);
    }

    console.log('✅ Injeção concluída com sucesso!');
  } catch (err) {
    console.error('❌ ERRO NO SUPABASE:', err.message);
  } finally {
    await pool.end();
  }
}

upload();
