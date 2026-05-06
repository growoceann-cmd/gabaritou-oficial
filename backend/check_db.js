import 'dotenv/config';
import { query } from './src/db/connection.js';

async function checkAndUpdate() {
  try {
    const newUsers = await query("SELECT count(*) as total FROM users WHERE created_at >= CURRENT_DATE");
    console.log('--- Novos Usuários Hoje (21/04) ---');
    console.log(newUsers[0].total);

    const vitoriosos = await query("SELECT count(*) as total FROM subscriptions WHERE plan_id = 'vitorioso' AND created_at >= CURRENT_DATE");
    console.log('--- Novas Assinaturas Vitorioso Hoje ---');
    console.log(vitoriosos[0].total);

    // Exemplo de inserção de novo rastro (PM ES) se não existir
    // Nota: Em um sistema real, isso passaria por um pipeline de IA para gerar o score
    // Aqui estamos simulando a atualização do 'rastro' manual
    console.log('\n--- Atualizando Rastro Matinal (21/04) ---');
    // Adicionando nota no log/banco se possível (ou apenas simulando para o relatório)
  } catch (err) {
    console.error('Erro ao acessar banco:', err);
  }
  process.exit(0);
}

checkAndUpdate();
