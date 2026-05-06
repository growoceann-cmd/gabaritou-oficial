import { spawn } from 'child_process';
import path from 'path';
import logger from '../utils/logger.js';

const log = logger.child('QuantumService');

/**
 * QuantumService — Integração com Origin Brain (Origin Quantum).
 * 
 * Este serviço utiliza processamento quântico para simular correlações
 * complexas entre tópicos de editais e bancos de questões.
 */
class QuantumService {
  constructor() {
    this.token = process.env.ORIGIN_QUANTUM_TOKEN;
    this.workerPath = path.resolve('src/services/quantum_worker.py');
  }

  /**
   * Executa uma simulação quântica para predição de tópicos.
   * @param {Object} data - Dados para a simulação (scores, probabilidades)
   * @returns {Promise<Object>} Resultado da simulação quântica
   */
  async simulateCorrelations(data) {
    if (!this.token) {
      log.warn('ORIGIN_QUANTUM_TOKEN não configurado. Pulando processamento quântico.');
      return null;
    }

    log.info('Iniciando simulação quântica via Origin Brain...', { dataSize: JSON.stringify(data).length });

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        this.workerPath,
        '--token', this.token,
        '--data', JSON.stringify(data)
      ]);

      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          log.error('Erro no worker quântico', { code, error });
          return reject(new Error(`Quantum worker failed with code ${code}`));
        }

        try {
          const result = JSON.parse(output);
          log.info('Simulação quântica concluída com sucesso', { confidenceBoost: result.boost });
          resolve(result);
        } catch (e) {
          log.error('Erro ao processar output quântico', { error: e.message, output });
          reject(e);
        }
      });
    });
  }
}

export default new QuantumService();
