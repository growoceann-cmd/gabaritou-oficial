/**
 * Rotas Freemium - Gabaritou v2
 * Endpoints para limites de plano, trial, upgrade e funil de conversão.
 */
import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { authenticateAdmin } from '../../middleware/auth.js';

const router = Router();

// Armazenamento em memória
const usuarios = new Map();
const planos = {
  free: {
    nome: 'Gratuito',
    predicoesPorDia: 5,
    bancas: 1,
    topicsPorPredicao: 5,
    provaDay: false,
    aiTutor: false,
    simuladoAdaptativo: false,
    rankingCompleto: false,
  },
  trial: {
    nome: 'Trial (7 dias)',
    predicoesPorDia: 999,
    bancas: 999,
    topicsPorPredicao: 20,
    provaDay: true,
    aiTutor: true,
    simuladoAdaptativo: true,
    rankingCompleto: true,
    diasRestantes: 7,
  },
  premium: {
    nome: 'Premium',
    predicoesByDia: 999,
    bancas: 999,
    topicsPorPredicao: 999,
    provaDay: true,
    aiTutor: true,
    simuladoAdaptativo: true,
    rankingCompleto: true,
  },
};

// Funil de conversão em memória
const funnelData = {
  totalUsuarios: 15847,
  free: 12100,
  trialAtivado: 5230,
  trialConvertido: 1890,
  premiumDireto: 340,
  churnMensal: '12.3%',
  ltvMedio: 'R$ 89,40',
  cacMedio: 'R$ 15,20',
};

/**
 * GET /api/freemium/limits/:userId
 * Obtém os limites do plano do usuário.
 */
router.get('/limits/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    if (!usuarios.has(userId)) {
      usuarios.set(userId, {
        id: userId,
        plano: 'free',
        dataRegistro: new Date().toISOString(),
        predicoesHoje: 0,
        ultimaPredicao: null,
      });
    }

    const usuario = usuarios.get(userId);
    const plano = planos[usuario.plano] || planos.free;

    const limites = {
      plano: usuario.plano,
      nomePlano: plano.nome,
      limites: {
        predicoesPorDia: plano.predicoesPorDia,
        predicoesUsadasHoje: usuario.predicoesHoje,
        predicoesRestantesHoje: Math.max(0, plano.predicoesPorDia - usuario.predicoesHoje),
        bancasPermitidas: plano.bancas,
        topicsPorPredicao: plano.topicsPorPredicao,
      },
      funcionalidades: {
        provaDay: plano.provaDay,
        aiTutor: plano.aiTutor,
        simuladoAdaptativo: plano.simuladoAdaptativo,
        rankingCompleto: plano.rankingCompleto,
      },
    };

    if (usuario.plano === 'trial') {
      limites.trial = {
        diasRestantes: calcularDiasRestantes(usuario.dataInicioTrial),
        dataExpiracao: calcularDataExpiracao(usuario.dataInicioTrial),
      };
    }

    res.json({
      sucesso: true,
      dados: limites,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar limites',
      codigo: 'ERRO_LIMITES',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/freemium/check/:userId/:feature
 * Verifica se o usuário tem acesso a uma funcionalidade específica.
 */
router.get('/check/:userId/:feature', (req, res) => {
  try {
    const { userId, feature } = req.params;

    if (!usuarios.has(userId)) {
      usuarios.set(userId, { id: userId, plano: 'free', predicoesHoje: 0 });
    }

    const usuario = usuarios.get(userId);
    const plano = planos[usuario.plano] || planos.free;

    const featureMap = {
      predicoes: { limite: plano.predicoesPorDia, usado: usuario.predicoesHoje },
      bancas: { permitido: plano.bancas > 1 },
      prova_day: { permitido: plano.provaDay },
      ai_tutor: { permitido: plano.aiTutor },
      simulado: { permitido: plano.simuladoAdaptativo },
      ranking: { permitido: plano.rankingCompleto },
      topics_ilimitados: { permitido: plano.topicsPorPredicao > 10 },
    };

    const featureKey = feature.toLowerCase();
    const check = featureMap[featureKey];

    if (!check) {
      return res.status(400).json({
        sucesso: false,
        erro: `Funcionalidade desconhecida: ${feature}`,
        codigo: 'FEATURE_DESCONHECIDA',
        funcionalidadesDisponiveis: Object.keys(featureMap),
      });
    }

    const temAcesso = check.permitido !== undefined ? check.permitido : (check.limite > check.usado);

    const response = {
      sucesso: true,
      dados: {
        userId,
        feature: featureKey,
        plano: usuario.plano,
        temAcesso,
      },
    };

    if (check.limite !== undefined) {
      response.dados.limite = check.limite;
      response.dados.usado = check.usado;
      response.dados.restante = Math.max(0, check.limite - check.usado);
    }

    if (!temAcesso) {
      response.dados.mensagemUpgrade = `🔓 Funcionalidade "${feature}" requer plano Premium ou Trial.`;
      response.dados.linkUpgrade = 'https://t.me/gabaritou_bot?start=premium';
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao verificar funcionalidade',
      codigo: 'ERRO_CHECK_FEATURE',
      detalhes: err.message,
    });
  }
});

/**
 * POST /api/freemium/trial/:userId
 * Ativa o trial de 7 dias para o usuário.
 */
router.post('/trial/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    if (!usuarios.has(userId)) {
      usuarios.set(userId, { id: userId, plano: 'free', predicoesHoje: 0 });
    }

    const usuario = usuarios.get(userId);

    if (usuario.plano === 'premium') {
      return res.json({
        sucesso: true,
        mensagem: 'Você já é usuário Premium! 🎉',
        dados: { plano: 'premium' },
      });
    }

    if (usuario.plano === 'trial') {
      const diasRestantes = calcularDiasRestantes(usuario.dataInicioTrial);
      if (diasRestantes > 0) {
        return res.json({
          sucesso: true,
          mensagem: `Você já possui um Trial ativo! Restam ${diasRestantes} dias.`,
          dados: {
            plano: 'trial',
            diasRestantes,
          },
        });
      }
    }

    usuario.plano = 'trial';
    usuario.dataInicioTrial = new Date().toISOString();

    usuarios.set(userId, usuario);

    res.json({
      sucesso: true,
      mensagem: '🎉 Trial de 7 dias ativado com sucesso!',
      dados: {
        plano: 'trial',
        duracao: '7 dias',
        funcionalidadesDesbloqueadas: [
          '✅ Predições ilimitadas',
          '✅ Todas as bancas',
          '✅ Prova Day ao vivo',
          '✅ Tutor IA',
          '✅ Simulado adaptativo',
          '✅ Ranking completo',
        ],
        dataExpiracao: calcularDataExpiracao(usuario.dataInicioTrial),
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao ativar trial',
      codigo: 'ERRO_TRIAL',
      detalhes: err.message,
    });
  }
});

/**
 * POST /api/freemium/upgrade/:userId
 * Faz upgrade do usuário para Premium.
 * Body: { meses }
 */
router.post('/upgrade/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { meses = 1 } = req.body;

    if (!usuarios.has(userId)) {
      usuarios.set(userId, { id: userId, plano: 'free', predicoesHoje: 0 });
    }

    const usuario = usuarios.get(userId);
    const mesesNum = parseInt(meses, 10);

    if (mesesNum < 1 || mesesNum > 12) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Número de meses deve ser entre 1 e 12',
        codigo: 'MESES_INVALIDOS',
      });
    }

    const precos = {
      1: 29.90,
      3: 79.90,
      6: 139.90,
      12: 249.90,
    };

    const preco = precos[mesesNum] || (mesesNum * 29.90);
    const desconto = mesesNum > 1 ? `${Math.round((1 - preco / (mesesNum * 29.90)) * 100)}%` : null;

    usuario.plano = 'premium';
    usuario.dataUpgrade = new Date().toISOString();
    usuario.mesesContratados = mesesNum;
    usuario.valorPago = preco;
    usuario.dataExpiracao = new Date(Date.now() + mesesNum * 30 * 24 * 60 * 60 * 1000).toISOString();

    usuarios.set(userId, usuario);

    res.json({
      sucesso: true,
      mensagem: `🚀 Upgrade para Premium realizado com sucesso!`,
      dados: {
        plano: 'premium',
        mesesContratados: mesesNum,
        valor: `R$ ${preco.toFixed(2)}`,
        desconto,
        dataExpiracao: usuario.dataExpiracao,
        beneficiocis: `Economia de R$ ${(mesesNum * 29.90 - preco).toFixed(2)}!`,
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao processar upgrade',
      codigo: 'ERRO_UPGRADE',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/freemium/funnel
 * Métricas do funil de conversão (ADMIN ONLY).
 */
router.get('/funnel', authenticateAdmin, (req, res) => {
  try {
    const taxaAtivacao = ((funnelData.trialAtivado / funnelData.totalUsuarios) * 100).toFixed(1);
    const taxaConversaoTrial = ((funnelData.trialConvertido / funnelData.trialAtivado) * 100).toFixed(1);
    const taxaConversaoGeral = (((funnelData.trialConvertido + funnelData.premiumDireto) / funnelData.totalUsuarios) * 100).toFixed(1);

    const funnel = {
      estagios: [
        {
          nome: 'Visitantes / Usuários registrados',
          quantidade: funnelData.totalUsuarios,
          percentual: '100%',
        },
        {
          nome: 'Ativaram Trial',
          quantidade: funnelData.trialAtivado,
          percentual: `${taxaAtivacao}%`,
        },
        {
          nome: 'Converteram do Trial',
          quantidade: funnelData.trialConvertido,
          percentual: `${taxaConversaoTrial}% do trial`,
        },
        {
          nome: 'Premium direto',
          quantidade: funnelData.premiumDireto,
          percentual: `${((funnelData.premiumDireto / funnelData.totalUsuarios) * 100).toFixed(1)}%`,
        },
        {
          nome: 'Total Premium',
          quantidade: funnelData.trialConvertido + funnelData.premiumDireto,
          percentual: `${taxaConversaoGeral}%`,
        },
      ],
      metricas: {
        churnMensal: funnelData.churnMensal,
        ltvMedio: funnelData.ltvMedio,
        cacMedio: funnelData.cacMedio,
        roas: (parseFloat(funnelData.ltvMedio.replace('R$ ', '').replace(',', '.')) /
          parseFloat(funnelData.cacMedio.replace('R$ ', '').replace(',', '.'))).toFixed(1),
      },
      receita: {
        mensalEstimada: `R$ ${((funnelData.trialConvertido + funnelData.premiumDireto) * 29.90).toFixed(2)}`,
        anualProjetada: `R$ ${((funnelData.trialConvertido + funnelData.premiumDireto) * 29.90 * 12).toFixed(2)}`,
      },
    };

    res.json({
      sucesso: true,
      mensagem: 'Funil de conversão',
      dados: funnel,
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar funil de conversão',
      codigo: 'ERRO_FUNNEL',
      detalhes: err.message,
    });
  }
});

// ─── Funções auxiliares ──────────────────────────────────────────────

function calcularDiasRestantes(dataInicio) {
  if (!dataInicio) return 0;
  const inicio = new Date(dataInicio);
  const expiracao = new Date(inicio.getTime() + 7 * 24 * 60 * 60 * 1000);
  const restantes = Math.ceil((expiracao - Date.now()) / (24 * 60 * 60 * 1000));
  return Math.max(0, restantes);
}

function calcularDataExpiracao(dataInicio) {
  if (!dataInicio) return null;
  return new Date(new Date(dataInicio).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
}

export default router;
