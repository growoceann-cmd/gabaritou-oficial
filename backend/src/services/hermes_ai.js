import dashScope from './dashscope.js';
import logger from '../utils/logger.js';

const log = logger.child('HermesAI');

/**
 * Hermes AI Service — O Oráculo de Emergência da LETHUS.
 * 
 * Este serviço utiliza o motor Qwen-Plus para garantir estabilidade absoluta
 * e busca em tempo real quando o motor principal encontra instabilidades.
 */
class HermesAIService {
  async ask(question) {
    log.info('Oráculo Hermes convocado para responder:', { question });

    try {
      const response = await dashScope.generateResponse([
        { role: 'system', content: 'Você é o Hermes, o Oráculo de Inteligência da LETHUS. Sua missão é fornecer respostas definitivas, fundamentadas em leis e atualizadas. Você tem acesso à busca em tempo real. Assine ao final: "🛡️ Resposta via Oráculo Hermes (LETHUS)".' },
        { role: 'user', content: question }
      ], { 
        model: 'qwen-plus', // Modelo de alta estabilidade
        temperature: 0.5,
        enable_search: true 
      });

      return response;
    } catch (err) {
      log.error('Falha no Oráculo Hermes', { erro: err.message });
      return null;
    }
  }
}

export default new HermesAIService();
