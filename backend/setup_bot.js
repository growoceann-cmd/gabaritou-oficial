import axios from 'axios';
const token = '8620428138:AAET01fRGFBDv6DJGEYUun3GvrWGvLgxFps';

async function setMetadata() {
  try {
    const desc = "O Gabaritou é a primeira ferramenta do mundo a prever o que vai cair na sua prova com 87% de precisão. Use o poder da IA BeConfident para estudar de forma inteligente.";
    const short = "🎯 Sua aprovação em concursos públicos garantida pela IA preditiva.";
    
    console.log('--- Atualizando Metadados do Bot ---');
    
    await axios.post(`https://api.telegram.org/bot${token}/setMyDescription`, { description: desc });
    console.log('✅ Descrição completa atualizada');
    
    await axios.post(`https://api.telegram.org/bot${token}/setMyShortDescription`, { short_description: short });
    console.log('✅ Descrição curta (About) atualizada');
    
    // Tentar limpar qualquer webhook anterior para garantir polling local
    await axios.post(`https://api.telegram.org/bot${token}/deleteWebhook`, { drop_pending_updates: true });
    console.log('✅ Webhook removido para ativação local');

    console.log('--- Fim da Atualização ---');
  } catch (e) {
    console.error('❌ Erro:', e.response?.data || e.message);
  }
}

setMetadata();
