import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PredictionCard from '../components/PredictionCard'

const BANCAS = [
  { value: '', label: 'Todas as bancas' },
  { value: 'cebraspe', label: 'CEBRASPE' },
  { value: 'fgv', label: 'FGV' },
  { value: 'fcc', label: 'FCC' },
  { value: 'vunesp', label: 'VUNESP' },
  { value: 'fce', label: 'FCE' },
  { value: 'quadrix', label: 'Quadrix' },
]

const MATERIAS = [
  { value: '', label: 'Todas as matérias' },
  { value: 'direito-constitucional', label: 'Direito Constitucional' },
  { value: 'direito-administrativo', label: 'Direito Administrativo' },
  { value: 'direito-penal', label: 'Direito Penal' },
  { value: 'direito-civil', label: 'Direito Civil' },
  { value: 'administracao-publica', label: 'Administração Pública' },
  { value: 'raciocinio-logico', label: 'Raciocínio Lógico' },
  { value: 'lingua-portuguesa', label: 'Língua Portuguesa' },
  { value: 'informatica', label: 'Informática' },
  { value: 'contabilidade', label: 'Contabilidade' },
]

const MOCK_PREDICTIONS = [
  {
    id: 1, topico: 'Direito Constitucional — Controle de Constitucionalidade', probabilidade: 92, banca: 'CEBRASPE', materia: 'direito-constitucional', dificuldade: 'dificil', recencia: '15 dias',
    armadilhas: ['Diferenciar ADI e ADC na aplicação de efeitos', 'STF pode modular efeitos — cuidado com exceções recentes', 'Distinção entre inconstitucionalidade por ação e por omissão'],
    dicas: ['Foque na jurisprudência do STF pós-2020', 'Estude os leading cases principais', 'Revise as alterações da EC 103/2019'],
    provasOndeCaiu: ['TRF-3 2024 — Técnico Judiciário', 'STN 2024 — Analista', 'TCU 2023 — Auditor'],
  },
  {
    id: 2, topico: 'Administração Pública — Modelos de Gestão', probabilidade: 88, banca: 'FGV', materia: 'administracao-publica', dificuldade: 'medio', recencia: '8 dias',
    armadilhas: ['Confundir gestão results com gestão de desempenho', 'NÃO usar O&M como modelo atual — é modelo clássico desatualizado'],
    dicas: ['Compare os modelos: patrimonialista, burocrático, gerencial', 'Entenda os pilares do paradigma pós-burocrático', 'Estude as reformas: Bresser-Pereira, PDRAE'],
    provasOndeCaiu: ['CGU 2024 — Analista', 'TJ-RJ 2024 — Assessor', 'BNDES 2023 — Analista'],
  },
  {
    id: 3, topico: 'Direito Administrativo — Licitações e Contratos (Lei 14.133/21)', probabilidade: 85, banca: 'CEBRASPE', materia: 'direito-administrativo', dificuldade: 'dificil', recencia: '3 dias',
    armadilhas: ['Comparar dispensa vs. inexigibilidade — limites diferentes', 'Modalidades mudaram — não confunda com Lei 8.666', 'Pregão eletrônico é a regra, mas há exceções'],
    dicas: ['Estude a nova Lei de Licitações de cabo a rabo', 'Foque nas mudanças em relação à Lei 8.666', 'Revise decreto regulamentador 10.947/2022'],
    provasOndeCaiu: ['TRF-1 2024 — Analista', 'INSS 2024 — Perito', 'Polícia Federal 2023 — Agente'],
  },
  {
    id: 4, topico: 'Raciocínio Lógico — Proposições e Conectivos Lógicos', probabilidade: 82, banca: 'FCC', materia: 'raciocinio-logico', dificuldade: 'medio', recencia: '12 dias',
    armadilhas: ['Bicondicional vs. condicional — cuidado com a inversão', 'Tautologia vs. contradição vs. contingência', 'Equivalências notáveis: não esqueça De Morgan'],
    dicas: ['Domine a tabela-verdade para todos os conectivos', 'Pratique questões de equivalência e negação', 'Use diagramas lógicos para visualizar'],
    provasOndeCaiu: ['TRT-12 2024 — Analista', 'TJ-MG 2024 — Juiz Leigo', 'MPE-SC 2023 — Promotor'],
  },
  {
    id: 5, topico: 'Língua Portuguesa — Interpretação Textual e Semântica', probabilidade: 79, banca: 'CEBRASPE', materia: 'lingua-portuguesa', dificuldade: 'facil', recencia: '5 dias',
    armadilhas: ['Não confunda sentido denotativo com conotativo', 'Ironia e humor dependem do contexto — leia o texto inteiro', 'Coesão textual: pronomes relativos e referenciação'],
    dicas: ['Leia textos de gêneros variados diariamente', 'Pratique interpretação com textos argumentativos', 'Estude figuras de linguagem: metáfora, metonímia, hipérbole'],
    provasOndeCaiu: ['TRF-3 2024 — Técnico', 'TRT-8 2024 — Analista', 'Receita Federal 2023 — Auditor'],
  },
  {
    id: 6, topico: 'Contabilidade — Balanço Patrimonial e DRE', probabilidade: 71, banca: 'FGV', materia: 'contabilidade', dificuldade: 'dificil', recencia: '20 dias',
    armadilhas: ['Classificação correta de contas no BP — Ativo vs. Passivo', 'Receita x Despesa: regimes de competência vs. caixa', 'Ajustes de exercícios anteriores — CPC 06/22'],
    dicas: ['Estude a estrutura do BP conforme Lei 6.404/76', 'Revise os CPCs relevantes: 26, 28, 29, 41', 'Pratique montagem de balancetes de verificação'],
    provasOndeCaiu: ['TCU 2024 — Analista', 'STN 2023 — Técnico'],
  },
]

const MOCK_FLYWHEEL = {
  totalFeedbacks: 4827,
  acuraciaMelhorada: 12.5,
  predicoesAjustadas: 342,
  usuariosEngajados: 2156,
}

export default function Predictions({ onMenuClick }) {
  const [loading, setLoading] = useState(true)
  const [banca, setBanca] = useState('')
  const [materia, setMateria] = useState('')
  const [predictions, setPredictions] = useState(MOCK_PREDICTIONS)
  const [flywheel, setFlywheel] = useState(MOCK_FLYWHEEL)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const filteredPredictions = predictions.filter(p => {
    if (banca && p.banca.toLowerCase() !== banca) return false
    if (materia && p.materia !== materia) return false
    return true
  }).sort((a, b) => b.probabilidade - a.probabilidade)

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <span>Carregando predições...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="btn btn-icon btn-outline" onClick={onMenuClick}>☰</button>
          <h1>🎯 Predições</h1>
        </div>
        <p>Previsões de questões geradas por IA para concursos públicos</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="form-group">
          <label className="form-label">Banca</label>
          <select
            className="form-select"
            value={banca}
            onChange={e => setBanca(e.target.value)}
          >
            {BANCAS.map(b => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Matéria</label>
          <select
            className="form-select"
            value={materia}
            onChange={e => setMateria(e.target.value)}
          >
            {MATERIAS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ flex: 'none' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => { setBanca(''); setMateria('') }}
            style={{ marginTop: 4 }}
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* Results count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {filteredPredictions.length} predição(ões) encontrada(s)
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          Ordenado por probabilidade
        </span>
      </div>

      {/* Predictions List */}
      {filteredPredictions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <div className="empty-state-title">Nenhuma predição encontrada</div>
          <div className="empty-state-text">Tente alterar os filtros para ver mais predições.</div>
        </div>
      ) : (
        <div>
          {filteredPredictions.map(pred => (
            <PredictionCard key={pred.id} prediction={pred} />
          ))}
        </div>
      )}

      {/* Flywheel Stats */}
      <div className="flywheel-stats" style={{ marginTop: 32 }}>
        <div style={{ marginBottom: 12, fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>
          ♻️ Data Flywheel — Quanto mais feedback, melhor a IA
        </div>
        <div className="content-grid-4">
          <div className="flywheel-stat">
            <div className="flywheel-stat-value">{flywheel.totalFeedbacks.toLocaleString('pt-BR')}</div>
            <div className="flywheel-stat-label">Feedbacks recebidos</div>
          </div>
          <div className="flywheel-stat">
            <div className="flywheel-stat-value" style={{ color: 'var(--neon)' }}>+{flywheel.acuraciaMelhorada}%</div>
            <div className="flywheel-stat-label">Acurácia melhorada</div>
          </div>
          <div className="flywheel-stat">
            <div className="flywheel-stat-value" style={{ color: 'var(--cyan)' }}>{flywheel.predicoesAjustadas.toLocaleString('pt-BR')}</div>
            <div className="flywheel-stat-label">Predições ajustadas</div>
          </div>
          <div className="flywheel-stat">
            <div className="flywheel-stat-value" style={{ color: 'var(--gold)' }}>{flywheel.usuariosEngajados.toLocaleString('pt-BR')}</div>
            <div className="flywheel-stat-label">Usuários engajados</div>
          </div>
        </div>
      </div>
    </div>
  )
}
