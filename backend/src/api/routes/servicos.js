/**
 * Rotas de Serviços - Gabaritou v3.1
 * Endpoints para Radar, GPS e Mapa Mental.
 */
import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

// Mock data para os serviços
const gabaritouServices = {
  radar: {
    nome: 'Radar',
    descricao: 'Monitoramento inteligente de editais e tendências em tempo real.',
    preco: 3.00,
    checkout: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=52048695-45026c7b-d054-45ee-ba4a-448fb4865e13'
  },
  gps: {
    nome: 'GPS',
    descricao: 'Auditoria completa do seu edital com foco no que realmente cai.',
    preco: 2.00,
    checkout: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=52048695-a869ac0e-f7f6-49b2-a493-58fd4437cb6e'
  },
  mapa: {
    nome: 'Mapa Mental',
    descricao: 'Mapas mentais gerados por IA para memorização acelerada.',
    preco: 2.00,
    checkout: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=52048695-411a87f1-b951-4e86-a394-2fbc56f13167'
  }
};

/**
 * GET /api/servicos/info
 * Lista todos os serviços e seus links de checkout.
 */
router.get('/info', (req, res) => {
  res.json({
    sucesso: true,
    dados: gabaritouServices
  });
});

/**
 * GET /api/servicos/radar/:userId
 * Status do Radar do usuário.
 */
router.get('/radar/:userId', (req, res) => {
  const { userId } = req.params;
  // Mock: Usuário 123 tem radar ativo
  const ativo = userId === '123';
  
  res.json({
    sucesso: true,
    dados: {
      userId,
      ativo,
      vencimento: ativo ? '2026-05-15T00:00:00.000Z' : null,
      historico: [
        { data: '2026-04-14', evento: 'Edital TJ-SP Publicado - Tendência VUNESP alta.' },
        { data: '2026-04-12', evento: 'Novo tópico de Direito Administrativo em alta.' }
      ]
    }
  });
});

/**
 * GET /api/servicos/gps/:userId
 * Lista auditorias GPS geradas pelo usuário.
 */
router.get('/gps/:userId', (req, res) => {
  const { userId } = req.params;
  
  res.json({
    sucesso: true,
    dados: {
      userId,
      auditorias: [
        { id: 'gps-001', banca: 'VUNESP', materia: 'Geral', data: '2026-04-14', status: 'concluido' }
      ]
    }
  });
});

/**
 * GET /api/servicos/mapa/:userId
 * Lista mapas mentais gerados pelo usuário.
 */
router.get('/mapa/:userId', (req, res) => {
  const { userId } = req.params;
  
  res.json({
    sucesso: true,
    dados: {
      userId,
      mapas: [
        { id: 'mapa-001', topico: 'Licitações', data: '2026-04-15', status: 'concluido' }
      ]
    }
  });
});

export default router;
