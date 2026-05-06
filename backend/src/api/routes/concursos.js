/**
 * Rotas de Concursos — Gabaritou v3
 * Endpoints para busca de concursos por estado e banca.
 */
import { Router } from 'express';
import {
  getConcursosPorEstado,
  getConcursosPorBanca,
  getEstadoNome,
  getEstatisticasConcursos,
  UFS,
} from '../../services/concursos.js';
import { sanitizeInput } from '../../utils/helpers.js';
import logger from '../../utils/logger.js';

const log = logger.child('ConcursosRoutes');

const router = Router();

/**
 * GET /api/concursos
 * Lista todos os concursos disponíveis (nível nacional).
 * Query params: banca, limite (default 20)
 */
router.get('/', async (req, res) => {
  try {
    const { banca, limite = 20 } = req.query;

    // Se filtrar por banca, usa a função específica
    if (banca) {
      const safeBanca = sanitizeInput(banca);
      const concursos = await getConcursosPorBanca(safeBanca);
      return res.json({
        sucesso: true,
        mensagem: `Concursos da banca ${safeBanca}`,
        dados: concursos.slice(0, parseInt(limite, 10)),
        total: concursos.length,
        filtros: { banca: safeBanca },
      });
    }

    // Senão, retorna todos (BR)
    const concursos = await getConcursosPorEstado('BR');

    res.json({
      sucesso: true,
      mensagem: 'Concursos disponíveis (nacional)',
      dados: concursos.slice(0, parseInt(limite, 10)),
      total: concursos.length,
      estatisticas: getEstatisticasConcursos(),
    });
  } catch (err) {
    log.error('Erro ao buscar concursos', { erro: err.message });
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar concursos',
      codigo: 'ERRO_CONCURSOS',
    });
  }
});

/**
 * GET /api/concursos/:uf
 * Lista concursos por estado (UF).
 * Query params: banca, limite (default 20)
 */
router.get('/:uf', async (req, res) => {
  try {
    const { uf } = req.params;
    const { banca, limite = 20 } = req.query;

    const ufUpper = uf.toUpperCase().trim();

    if (!UFS.includes(ufUpper)) {
      return res.status(400).json({
        sucesso: false,
        erro: `UF inválida: "${uf}". UFs disponíveis: ${UFS.join(', ')}`,
        codigo: 'UF_INVALIDA',
      });
    }

    let concursos = await getConcursosPorEstado(ufUpper);

    // Filtra por banca se especificado
    if (banca) {
      const bancaNorm = sanitizeInput(banca).toUpperCase().trim();
      concursos = concursos.filter((c) => {
        const bancaConcurso = (c.banca || '').toUpperCase();
        return bancaConcurso.includes(bancaNorm) || bancaNorm.includes(bancaConcurso);
      });
    }

    res.json({
      sucesso: true,
      mensagem: `Concursos em ${getEstadoNome(ufUpper)} (${ufUpper})`,
      estado: {
        uf: ufUpper,
        nome: getEstadoNome(ufUpper),
      },
      dados: concursos.slice(0, parseInt(limite, 10)),
      total: concursos.length,
      filtros: { uf: ufUpper, banca: banca ? sanitizeInput(banca) : null },
    });
  } catch (err) {
    log.error('Erro ao buscar concursos por UF', { uf: req.params.uf, erro: err.message });
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar concursos',
      codigo: 'ERRO_CONCURSOS_UF',
    });
  }
});

export default router;
