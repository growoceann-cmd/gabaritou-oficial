import axios from 'axios';

const token = '8620428138:AAET01fRGFBDv6DJGEYUun3GvrWGvLgxFps';

async function syncBotUI() {
    try {
        console.log('--- Sincronizando Interface do Bot (GABARITOU) ---');
        
        // 1. Registrar Lista de Comandos (O que aparece no botão "/" do Telegram)
        const commands = [
            { command: 'start', description: '🚀 Iniciar o Gabaritou' },
            { command: 'menu', description: '📱 Abrir menu principal' },
            { command: 'plano', description: '📋 Seu plano de estudos' },
            { command: 'tutor', description: '🧠 AI Tutor - Mentor pessoal' },
            { command: 'revisar', description: '🔄 Revisão Ativa de Erros' },
            { command: 'gps', description: '🛰️ GPS Aprovação (Auditoria)' },
            { command: 'mapa', description: '🧠 Mapa Mental IA' },
            { command: 'simulado', description: '🎯 Simulado adaptativo IA' },
            { command: 'radar', description: '📡 Radar Elite - Atualidades/Editais' },
            { command: 'predicao', description: '📊 Ver o que vai cair na prova' },
            { command: 'armadilhas', description: '⚠️ Pegadinhas da banca' },
            { command: 'progresso', description: '📈 Suas estatísticas' },
            { command: 'score', description: '🏆 Ranking da comunidade' },
            { command: 'provaday', description: '⚡ Cobertura Prova Day' },
            { command: 'premium', description: '💎 Ativar Premium (3 dias grátis)' },
            { command: 'configurar', description: '⚙️ Ajustar banca/cargo' },
            { command: 'privacidade', description: '🔒 Gerenciar seus dados' }
        ];

        const cmdRes = await axios.post(`https://api.telegram.org/bot${token}/setMyCommands`, {
            commands: commands
        });

        if (cmdRes.data.ok) {
            console.log('✅ Lista de 12 comandos registrada com sucesso!');
        }

        // 2. Garantir Nome e Descrição
        await axios.post(`https://api.telegram.org/bot${token}/setMyName`, { name: 'GABARITOU' });
        await axios.post(`https://api.telegram.org/bot${token}/setMyDescription`, { 
            description: "GABARITOU: A primeira IA preditiva para concursos do mundo. Prevemos o que vai cair com 87% de precisão." 
        });
        
        console.log('✅ Nome e Descrição reforçados.');
        console.log('--- Sincronização Concluída ---');
        console.log('\n💡 Se os comandos não aparecerem imediatamente, reinicie seu Telegram.');
        
    } catch (e) {
        console.error('❌ Erro na sincronização:', e.response?.data || e.message);
    }
}

await syncBotUI();
process.exit(0);
