import axios from 'axios';

const token = '8620428138:AAET01fRGFBDv6DJGEYUun3GvrWGvLgxFps';

async function updateBotIdentity() {
    try {
        console.log('--- Atualizando Identidade do Bot ---');
        
        // 1. Atualizar Nome para "GABARITOU"
        // Nota: O método setMyName requer Telegram Bot API 6.4+
        const nameRes = await axios.post(`https://api.telegram.org/bot${token}/setMyName`, {
            name: 'GABARITOU'
        });
        
        if (nameRes.data.ok) {
            console.log('✅ Nome do Bot atualizado para: GABARITOU');
        }

        // 2. Atualizar Descrições (Reforço)
        const desc = "GABARITOU: A primeira IA preditiva para concursos do mundo. Prevemos o que vai cair com 87% de precisão.";
        await axios.post(`https://api.telegram.org/bot${token}/setMyDescription`, { description: desc });
        console.log('✅ Descrição atualizada.');

        console.log('\n⚠️ Nota sobre o Avatar:');
        console.log('A API do Telegram não permite que o bot altere sua própria foto de perfil programaticamente.');
        console.log('Por favor, envie a imagem anexa para o @BotFather usando o comando /setuserpic.');
        
        console.log('--- Fim da Operação ---');
    } catch (e) {
        console.error('❌ Erro:', e.response?.data || e.message);
    }
}

updateBotIdentity();
