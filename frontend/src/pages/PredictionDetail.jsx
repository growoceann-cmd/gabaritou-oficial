import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PredictionCard from '../components/PredictionCard'

const MOCK_PREDICTIONS_DETAIL = {
  'cebraspe/direito-constitucional': {
    banca: 'CEBRASPE',
    materia: 'Direito Constitucional',
    totalPredicoes: 48,
    acuraciaMedia: 81,
    topicos: [
      { id: 1, topico: 'Controle de Constitucionalidade', probabilidade: 92, banca: 'CEBRASPE', materia: 'Direito Constitucional', dificuldade: 'dificil', recencia: '15 dias',
        armadilhas: ['Diferenciar ADI e ADC na aplicação de efeitos', 'STF pode modular efeitos — cuidado com exceções recentes', 'Distinção entre inconstitucionalidade por ação e por omissão'],
        dicas: ['Foque na jurisprudência do STF pós-2020', 'Estude os leading cases principais', 'Revise as alterações da EC 103/2019'],
        provasOndeCaiu: ['TRF-3 2024', 'STN 2024', 'TCU 2023'],
      },
      { id: 2, topico: 'Direitos Fundamentais — Gerações e Características', probabilidade: 87, banca: 'CEBRASPE', materia: 'Direito Constitucional', dificuldade: 'medio', recencia: '22 dias',
        armadilhas: ['Não confundir dimensões com gerações', 'Limitação dos direitos no estado de sítio vs. defesa do estado'],
        dicas: ['Estude como o STF aplica a ponderação de direitos', 'Revise a teoria de Robert Alexy'],
        provasOndeCaiu: ['TRF-1 2024', 'Polícia Federal 2023'],
      },
      { id: 3, topico: 'Organização do Estado — Competências', probabilidade: 83, banca: 'CEBRASPE', materia: 'Direito Constitucional', dificuldade: 'dificil', recencia: '10 dias',
        armadilhas: ['Competência exclusiva vs. privativa vs. comum', 'Diferença entre competência legislativa e material'],
        dicas: ['Monte um quadro comparativo de competências', 'Foque nas competências concorrentes — arts. 22-24'],
        provasOndeCaiu: ['TRF-3 2024', 'TJ-SP 2023', 'MPE-GO 2023'],
      },
      { id: 4, topico: 'Processo Legislativo — Espécies Normativas', probabilidade: 76, banca: 'CEBRASPE', materia: 'Direito Constitucional', dificuldade: 'medio', recencia: '30 dias',
        armadilhas: ['Medida provisória vs. lei delegada — diferenças cruciais', 'Processo legislativo ordinário vs. sumário vs. especial'],
        dicas: ['Revise as emendas constitucionais relevantes', 'Entenda o papel da CNH na conversão de MP'],
        provasOndeCaiu: ['STN 2024', 'TCU 2023'],
      },
    ],
  },
  'fgv/administracao-publica': {
    banca: 'FGV',
    materia: 'Administração Pública',
    totalPredicoes: 35,
    acuraciaMedia: 77,
    topicos: [
      { id: 5, topico: 'Modelos de Gestão Pública', probabilidade: 88, banca: 'FGV', materia: 'Administração Pública', dificuldade: 'medio', recencia: '8 dias',
        armadilhas: ['Confundir gestão results com gestão de desempenho', 'NÃO usar O&M como modelo atual'],
        dicas: ['Compare os modelos: patrimonialista, burocrático, gerencial', 'Entenda os pilares do paradigma pós-burocrático'],
        provasOndeCaiu: ['CGU 2024', 'TJ-RJ 2024'],
      },
      { id: 6, topico: 'Governança e Governabilidade', probabilidade: 82, banca: 'FGV', materia: 'Administração Pública', dificuldade: 'medio', recencia: '18 dias',
        armadilhas: ['Governança ≠ Governabilidade — são conceitos distintos', 'Accountability pode ser horizontal, vertical ou societal'],
        dicas: ['Estude as dimensões da governança pública', 'Revise o modelo de Bresser-Pereira'],
        provasOndeCaiu: ['BNDES 2023', 'TJ-SP 2023'],
      },
    ],
  },
}

export default function PredictionDetail({ onMenuClick }) {
  const { banca, materia } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    const key = `${banca}/${materia}`
    const timer = setTimeout(() => {
      setData(MOCK_PREDICTIONS_DETAIL[key] || {
        banca: banca.toUpperCase(),
        materia: materia.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        totalPredicoes: 12,
        acuraciaMedia: 72,
        topicos: [
          { id: 1, topico: `${materia.replace(/-/g, ' ')} — Tópico Principal`, probabilidade: 75, banca: banca.toUpperCase(), materia: materia, dificuldade: 'medio', recencia: '20 dias', armadilhas: [], dicas: [], provasOndeCaiu: [] },
        ],
      })
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [banca, materia])

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="btn btn-icon btn-outline" onClick={onMenuClick}>☰</button>
          <Link to="/predicoes" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Voltar
          </Link>
        </div>
        <h1>🎯 {data.banca} — {data.materia}</h1>
        <p>{data.totalPredicoes} predições • Acurácia média: {data.acuraciaMedia}%</p>
      </div>

      {/* Summary stats */}
      <div className="content-grid-3" style={{ marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--neon)' }}>{data.totalPredicoes}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Predições ativas</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--cyan)' }}>{data.acuraciaMedia}%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Acurácia média</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--gold)' }}>{data.topicos.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tópicos mapeados</div>
        </div>
      </div>

      {/* Predictions */}
      <div className="section-title">
        <span className="icon">📋</span>
        Tópicos Previstos
      </div>

      {data.topicos.map(topico => (
        <PredictionCard key={topico.id} prediction={topico} />
      ))}
    </div>
  )
}
