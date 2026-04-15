/**
 * Rotas Concursos - Gabaritou v2
 * Endpoints para listagem de concursos por estado e banca.
 */
import { Router } from 'express';

const router = Router();

// Dados de concursos por UF
const concursosPorUF = {
  AC: [
    { id: 'conc-ac-01', nome: 'TJ-AC', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-02-28', dataProva: '2025-04-20', vagas: 45 },
    { id: 'conc-ac-02', nome: 'Prefeitura de Rio Branco', banca: 'FCC', cargo: 'Procurador Municipal', inscricoesAte: '2025-03-15', dataProva: '2025-05-10', vagas: 20 },
  ],
  AL: [
    { id: 'conc-al-01', nome: 'TRT-19ª Região', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-01-30', dataProva: '2025-03-16', vagas: 30 },
  ],
  AM: [
    { id: 'conc-am-01', nome: 'TJ-AM', banca: 'FCC', cargo: 'Juiz Substituto', inscricoesAte: '2025-03-01', dataProva: '2025-05-18', vagas: 12 },
    { id: 'conc-am-02', nome: 'Prefeitura de Manaus', banca: 'CESPE', cargo: 'Auditor Fiscal', inscricoesAte: '2025-02-15', dataProva: '2025-04-06', vagas: 80 },
  ],
  AP: [
    { id: 'conc-ap-01', nome: 'TJ-AP', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-04-01', dataProva: '2025-06-15', vagas: 25 },
  ],
  BA: [
    { id: 'conc-ba-01', nome: 'TJ-BA', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-02-28', dataProva: '2025-04-27', vagas: 60 },
    { id: 'conc-ba-02', nome: 'Prefeitura de Salvador', banca: 'FGV', cargo: 'Procurador', inscricoesAte: '2025-03-20', dataProva: '2025-05-25', vagas: 35 },
    { id: 'conc-ba-03', nome: 'TRE-BA', banca: 'CESPE', cargo: 'Analista Judiciário', inscricoesAte: '2025-01-25', dataProva: '2025-03-23', vagas: 40 },
  ],
  CE: [
    { id: 'conc-ce-01', nome: 'TJ-CE', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-03-15', dataProva: '2025-05-11', vagas: 50 },
    { id: 'conc-ce-02', nome: 'Prefeitura de Fortaleza', banca: 'FGV', cargo: 'Auditor Fiscal', inscricoesAte: '2025-02-10', dataProva: '2025-04-13', vagas: 100 },
  ],
  DF: [
    { id: 'conc-df-01', nome: 'TJ-DFT', banca: 'CESPE', cargo: 'Analista Judiciário', inscricoesAte: '2025-04-10', dataProva: '2025-06-22', vagas: 70 },
    { id: 'conc-df-02', nome: 'TRE-DFT', banca: 'CESPE', cargo: 'Analista Judiciário', inscricoesAte: '2025-03-05', dataProva: '2025-05-04', vagas: 45 },
    { id: 'conc-df-03', nome: 'PC-DF', banca: 'CESPE', cargo: 'Delegado', inscricoesAte: '2025-02-20', dataProva: '2025-04-20', vagas: 30 },
  ],
  ES: [
    { id: 'conc-es-01', nome: 'TJ-ES', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-01-31', dataProva: '2025-03-30', vagas: 35 },
  ],
  GO: [
    { id: 'conc-go-01', nome: 'TJ-GO', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-03-25', dataProva: '2025-05-18', vagas: 55 },
    { id: 'conc-go-02', nome: 'TRE-GO', banca: 'FGV', cargo: 'Analista', inscricoesAte: '2025-02-28', dataProva: '2025-04-27', vagas: 30 },
  ],
  MA: [
    { id: 'conc-ma-01', nome: 'TJ-MA', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-04-05', dataProva: '2025-06-08', vagas: 40 },
  ],
  MG: [
    { id: 'conc-mg-01', nome: 'TJ-MG', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-02-15', dataProva: '2025-04-13', vagas: 80 },
    { id: 'conc-mg-02', nome: 'PC-MG', banca: 'FGV', cargo: 'Delegado', inscricoesAte: '2025-03-10', dataProva: '2025-05-11', vagas: 50 },
    { id: 'conc-mg-03', nome: 'Prefeitura de BH', banca: 'FGV', cargo: 'Procurador', inscricoesAte: '2025-01-20', dataProva: '2025-03-16', vagas: 25 },
  ],
  MS: [
    { id: 'conc-ms-01', nome: 'TJ-MS', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-03-20', dataProva: '2025-05-25', vagas: 35 },
  ],
  MT: [
    { id: 'conc-mt-01', nome: 'TJ-MT', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-04-15', dataProva: '2025-06-22', vagas: 30 },
  ],
  PA: [
    { id: 'conc-pa-01', nome: 'TRF-1ª Região (Belém)', banca: 'CESPE', cargo: 'Analista Judiciário', inscricoesAte: '2025-02-28', dataProva: '2025-04-20', vagas: 25 },
  ],
  PB: [
    { id: 'conc-pb-01', nome: 'TJ-PB', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-03-15', dataProva: '2025-05-11', vagas: 30 },
  ],
  PE: [
    { id: 'conc-pe-01', nome: 'TJ-PE', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-01-30', dataProva: '2025-03-30', vagas: 45 },
    { id: 'conc-pe-02', nome: 'Prefeitura do Recife', banca: 'FGV', cargo: 'Auditor Fiscal', inscricoesAte: '2025-04-01', dataProva: '2025-06-01', vagas: 60 },
  ],
  PI: [
    { id: 'conc-pi-01', nome: 'TJ-PI', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-03-10', dataProva: '2025-05-04', vagas: 25 },
  ],
  PR: [
    { id: 'conc-pr-01', nome: 'TJ-PR', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-04-20', dataProva: '2025-06-22', vagas: 65 },
    { id: 'conc-pr-02', nome: 'TRE-PR', banca: 'CESPE', cargo: 'Analista', inscricoesAte: '2025-02-10', dataProva: '2025-04-06', vagas: 35 },
  ],
  RJ: [
    { id: 'conc-rj-01', nome: 'TJ-RJ', banca: 'FGV', cargo: 'Analista Judiciário', inscricoesAte: '2025-03-01', dataProva: '2025-05-04', vagas: 90 },
    { id: 'conc-rj-02', nome: 'PC-RJ', banca: 'FGV', cargo: 'Delegado', inscricoesAte: '2025-04-15', dataProva: '2025-06-15', vagas: 60 },
    { id: 'conc-rj-03', nome: 'Prefeitura do Rio', banca: 'FGV', cargo: 'Procurador', inscricoesAte: '2025-02-20', dataProva: '2025-04-27', vagas: 40 },
  ],
  RN: [
    { id: 'conc-rn-01', nome: 'TJ-RN', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-03-25', dataProva: '2025-05-18', vagas: 30 },
  ],
  RO: [
    { id: 'conc-ro-01', nome: 'TJ-RO', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-04-10', dataProva: '2025-06-08', vagas: 20 },
  ],
  RR: [
    { id: 'conc-rr-01', nome: 'TJ-RR', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-03-30', dataProva: '2025-06-01', vagas: 15 },
  ],
  RS: [
    { id: 'conc-rs-01', nome: 'TJ-RS', banca: 'FGV', cargo: 'Analista Judiciário', inscricoesAte: '2025-02-28', dataProva: '2025-04-27', vagas: 75 },
    { id: 'conc-rs-02', nome: 'TRE-RS', banca: 'FCC', cargo: 'Analista', inscricoesAte: '2025-03-15', dataProva: '2025-05-11', vagas: 40 },
    { id: 'conc-rs-03', nome: 'PC-RS', banca: 'FGV', cargo: 'Delegado', inscricoesAte: '2025-04-01', dataProva: '2025-06-08', vagas: 35 },
  ],
  SC: [
    { id: 'conc-sc-01', nome: 'TJ-SC', banca: 'FGV', cargo: 'Analista Judiciário', inscricoesAte: '2025-03-20', dataProva: '2025-05-25', vagas: 50 },
  ],
  SE: [
    { id: 'conc-se-01', nome: 'TJ-SE', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-04-05', dataProva: '2025-06-01', vagas: 25 },
  ],
  SP: [
    { id: 'conc-sp-01', nome: 'TJ-SP', banca: 'VUNESP', cargo: 'Analista Judiciário', inscricoesAte: '2025-02-15', dataProva: '2025-04-13', vagas: 120 },
    { id: 'conc-sp-02', nome: 'TRE-SP', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-03-10', dataProva: '2025-05-04', vagas: 55 },
    { id: 'conc-sp-03', nome: 'PC-SP', banca: 'VUNESP', cargo: 'Delegado', inscricoesAte: '2025-04-20', dataProva: '2025-06-22', vagas: 80 },
    { id: 'conc-sp-04', nome: 'Prefeitura de SP', banca: 'FGV', cargo: 'Procurador', inscricoesAte: '2025-01-25', dataProva: '2025-03-23', vagas: 50 },
    { id: 'conc-sp-05', nome: 'TRF-3ª Região', banca: 'CESPE', cargo: 'Analista Judiciário', inscricoesAte: '2025-03-30', dataProva: '2025-05-25', vagas: 45 },
  ],
  TO: [
    { id: 'conc-to-01', nome: 'TJ-TO', banca: 'FCC', cargo: 'Analista Judiciário', inscricoesAte: '2025-03-15', dataProva: '2025-05-11', vagas: 20 },
  ],
  FEDERAL: [
    { id: 'conc-fed-01', nome: 'STF', banca: 'CESPE', cargo: 'Analista Judiciário', inscricoesAte: '2025-04-30', dataProva: '2025-07-13', vagas: 40 },
    { id: 'conc-fed-02', nome: 'STJ', banca: 'CESPE', cargo: 'Analista Judiciário', inscricoesAte: '2025-05-15', dataProva: '2025-07-27', vagas: 35 },
    { id: 'conc-fed-03', nome: 'Senado Federal', banca: 'CESPE', cargo: 'Analista Legislativo', inscricoesAte: '2025-03-01', dataProva: '2025-05-04', vagas: 25 },
    { id: 'conc-fed-04', nome: 'CGU', banca: 'FGV', cargo: 'Auditor Federal', inscricoesAte: '2025-02-28', dataProva: '2025-04-20', vagas: 60 },
    { id: 'conc-fed-05', nome: 'Receita Federal', banca: 'FGV', cargo: 'Auditor-Fiscal', inscricoesAte: '2025-04-10', dataProva: '2025-06-22', vagas: 200 },
    { id: 'conc-fed-06', nome: 'Polícia Federal', banca: 'CESPE', cargo: 'Agente', inscricoesAte: '2025-03-20', dataProva: '2025-05-18', vagas: 150 },
    { id: 'conc-fed-07', nome: 'INSS', banca: 'CESPE', cargo: 'Analista do Seguro Social', inscricoesAte: '2025-04-01', dataProva: '2025-06-01', vagas: 100 },
  ],
};

/**
 * GET /api/concursos
 * Lista os estados com concursos disponíveis.
 */
router.get('/', (req, res) => {
  try {
    const ufsComConcursos = Object.entries(concursosPorUF).map(([uf, concursos]) => ({
      uf,
      nome: getNomeUF(uf),
      totalConcursos: concursos.length,
      bancas: [...new Set(concursos.map((c) => c.banca))],
    }));

    const totalConcursos = ufsComConcursos.reduce((acc, uf) => acc + uf.totalConcursos, 0);

    res.json({
      sucesso: true,
      mensagem: 'Estados com concursos disponíveis',
      dados: {
        totalConcursos,
        totalEstados: ufsComConcursos.length,
        estados: ufsComConcursos,
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao listar estados',
      codigo: 'ERRO_LISTAR_ESTADOS',
      detalhes: err.message,
    });
  }
});

/**
 * GET /api/concursos/:uf
 * Obtém concursos por estado.
 * Query params: banca (filtro opcional)
 */
router.get('/:uf', (req, res) => {
  try {
    const { uf } = req.params;
    const { banca } = req.query;

    const ufUpper = uf.toUpperCase();
    const concursos = concursosPorUF[ufUpper];

    if (!concursos || concursos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        erro: `Nenhum concurso encontrado para ${uf}`,
        codigo: 'UF_SEM_CONCURSOS',
        uf: ufUpper,
      });
    }

    let resultado = concursos;

    // Filtrar por banca se especificado
    if (banca) {
      const bancaUpper = banca.toUpperCase();
      resultado = concursos.filter((c) => c.banca.toUpperCase() === bancaUpper);

      if (resultado.length === 0) {
        return res.json({
          sucesso: true,
          mensagem: `Nenhum concurso de ${bancaUpper} encontrado para ${ufUpper}`,
          dados: [],
          uf: ufUpper,
          banca: bancaUpper,
          bancasDisponiveis: [...new Set(concursos.map((c) => c.banca))],
        });
      }
    }

    // Ordenar por data de prova
    resultado.sort((a, b) => new Date(a.dataProva) - new Date(b.dataProva));

    res.json({
      sucesso: true,
      mensagem: `Concursos: ${getNomeUF(ufUpper)}${banca ? ` (${banca.toUpperCase()})` : ''}`,
      dados: {
        uf: ufUpper,
        nome: getNomeUF(ufUpper),
        total: resultado.length,
        concursos: resultado,
        bancas: [...new Set(resultado.map((c) => c.banca))],
      },
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar concursos',
      codigo: 'ERRO_CONCURSOS_UF',
      detalhes: err.message,
    });
  }
});

// ─── Funções auxiliares ──────────────────────────────────────────────

function getNomeUF(uf) {
  const nomes = {
    AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá',
    BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
    GO: 'Goiás', MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul',
    MT: 'Mato Grosso', PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco',
    PI: 'Piauí', PR: 'Paraná', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
    RO: 'Rondônia', RR: 'Roraima', RS: 'Rio Grande do Sul', SC: 'Santa Catarina',
    SE: 'Sergipe', SP: 'São Paulo', TO: 'Tocantins', FEDERAL: 'Federal',
  };
  return nomes[uf] || uf;
}

export default router;
