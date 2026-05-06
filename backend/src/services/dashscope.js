import axios from 'axios';
import logger from '../utils/logger.js';

const log = logger.child('DashScope');

/**
 * DashScope Service — Integração com Alibaba DashScope (Qwen 2.5).
 * 
 * Este serviço gerencia chamadas para os modelos Qwen via infraestrutura da Alibaba.
 */
class DashScopeService {
  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    this.baseUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
  }

  /**
   * Envia uma mensagem para o Qwen 2.5.
   * @param {Array} messages - Histórico de mensagens [{role, content}]
   * @param {Object} options - Opções (model, temperature, etc)
   * @returns {Promise<string>} Resposta da IA
   */
  async generateResponse(messages, options = {}) {
    if (!this.apiKey) {
      log.error('DASHSCOPE_API_KEY não configurada.');
      throw new Error('DashScope API Key is missing');
    }

    const model = options.model || 'qwen-max'; // Fallback estável para desbloqueio
    
    log.info('Chamando Qwen via DashScope...', { model });

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: model,
          input: {
            messages: messages
          },
          parameters: {
            result_format: 'message',
            temperature: options.temperature || 0.5, // Temperatura baixa para evitar colapsos
            max_tokens: options.max_tokens || 1500,
            top_p: 0.8,
            enable_search: true,
            incremental_output: false
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-DashScope-SSE': 'disable'
          },
          timeout: 50000 
        }
      );


      // Verificação de segurança (Quantum Safety / Content Filter)
      if (response.data?.output?.finish_reason === 'safety_check') {
        log.warn('COLAPSO DE SEGURANÇA: A resposta foi bloqueada pelos filtros quânticos da Alibaba.', {
          prompt: messages[messages.length - 1].content
        });
        return 'Peço desculpas, mas não posso processar essa solicitação devido às minhas diretrizes de segurança. Por favor, tente reformular sua pergunta.';
      }

      const aiMessage = response.data?.output?.choices?.[0]?.message?.content || response.data?.output?.text;
      
      if (!aiMessage) {
        log.error('Resposta inválida do DashScope', { 
          data: JSON.stringify(response.data).substring(0, 500) 
        });
        throw new Error('Empty response from AI');
      }

      return aiMessage;
    } catch (err) {
      log.error('Erro ao chamar DashScope', { 
        msg: err.message, 
        response: err.response?.data 
      });
      throw err;
    }
  }
}

export default new DashScopeService();
