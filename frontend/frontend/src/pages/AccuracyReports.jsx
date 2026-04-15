import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ShareButton from '../components/ShareButton'

const MOCK_REPORTS = [
  { id: 'r1', concurso: 'TRF-3 — Técnico Judiciário', banca: 'CEBRASPE', data: '2024-11-15', acuracia: 82, questoes: 100, acertos: 82, temasMapeados: 65, temasAcertados: 53 },
  { id: 'r2', concurso: 'TJ-SP — Escrevente Técnico Judiciário', banca: 'VUNESP', data: '2024-11-10', acuracia: 76, questoes: 90, acertos: 68, temasMapeados: 55, temasAcertados: 42 },
  { id: 'r3', concurso: 'Polícia Federal — Agente', banca: 'CEBRASPE', data: '2024-11-05', acuracia: 85, questoes: 120, acertos: 102, temasMapeados: 80, temasAcertados: 68 },
  { id: 'r4', concurso: 'TRT-12 — Analista Judiciário', banca: 'FCC', data: '2024-10-28', acuracia: 73, questoes: 80, acertos: 58, temasMapeados: 50, temasAcertados: 37 },
  { id: 'r5', concurso: 'TCU — Auditor Federal', banca: 'CEBRASPE', data: '2024-10-20', acuracia: 88, questoes: 150, acertos: 132, temasMapeados: 95, temasAcertados: 84 },
  { id: 'r6', concurso: 'STN — Analista de Finanças', banca: 'FGV', data: '2024-10-15', acuracia: 79, questoes: 100, acertos: 79, temasMapeados: 60, temasAcertados: 47 },
  { id: 'r7', concurso: 'TRF-1 — Analista Judiciário', banca: 'CEBRASPE', data: '2024-10-08', acuracia: 84, questoes: 110, acertos: 92, temasMapeados: 72, temasAcertados: 61 },
  { id: 'r8', concurso: 'CGU — Analista de Finanças', banca: 'FGV', data: '2024-09-30', acuracia: 71, questoes: 80, acertos: 57, temasMapeados: 48, temasAcertados: 34 },
]

export default function AccuracyReports({ onMenuClick }) {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState(MOCK_REPORTS)
  const [sortBy, setSortBy] = useState('data')

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  const sortedReports = [...reports].sort((a, b) => {
    if (sortBy === 'data') return new Date(b.data) - new Date(a.data)
    if (sortBy === 'acuracia') return b.acuracia - a.acuracia
    return 0
  })

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <span>Carregando relatórios...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="btn btn-icon btn-outline" onClick={onMenuClick}>☰</button>
          <h1>📈 Relatórios de Acurácia</h1>
        </div>
        <p>Acompanhe o desempenho das predições em cada concurso realizado</p>
      </div>

      {/* Sort */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Ordenar por:</span>
        <button
          className={`btn btn-sm ${sortBy === 'data' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setSortBy('data')}
        >
          Data
        </button>
        <button
          className={`btn btn-sm ${sortBy === 'acuracia' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setSortBy('acuracia')}
        >
          Acurácia
        </button>
      </div>

      {/* Reports Grid */}
      <div className="content-grid-2">
        {sortedReports.map(report => (
          <div key={report.id} className="card card-glow">
            <Link to={`/acuracia/${report.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: 4 }}>
                    {report.concurso}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-cyan">{report.banca}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {new Date(report.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: report.acuracia >= 80 ? 'var(--neon)' : report.acuracia >= 50 ? 'var(--gold)' : 'var(--red)',
                  lineHeight: 1,
                }}>
                  {report.acuracia}%
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>{report.acertos}/{report.questoes}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Questões acertadas</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>{report.temasMapeados}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Temas mapeados</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>{report.temasAcertados}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Temas acertados</div>
                </div>
              </div>
            </Link>

            <ShareButton
              concurso={report.concurso}
              acuracia={report.acuracia}
              totalQuestoes={report.questoes}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
