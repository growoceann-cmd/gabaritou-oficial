import React, { useState, useEffect } from 'react'

const MOCK_CONCURSOS = [
  { id: 'c1', nome: 'TRF-3 — Técnico Judiciário', banca: 'CEBRASPE', data: '2024-11-24', horario: '09:00', status: 'andamento' },
  { id: 'c2', nome: 'TJ-RJ — Analista Judiciário', banca: 'FCC', data: '2024-12-01', horario: '08:00', status: 'agendada' },
  { id: 'c3', nome: 'TJ-SP — Escrevente', banca: 'VUNESP', data: '2024-11-17', horario: '10:00', status: 'encerrada' },
]

const MOCK_TRACKING = {
  concursoId: 'c1',
  concurso: 'TRF-3 — Técnico Judiciário',
  banca: 'CEBRASPE',
  inicio: '09:00',
  totalPredicoes: 15,
  topicosVistos: [
    { topico: 'Controle de Constitucionalidade', previsto: true, probabilidade: 92 },
    { topico: 'Licitações (Lei 14.133/21)', previsto: true, probabilidade: 85 },
    { topico: 'Princípios Administrativos', previsto: true, probabilidade: 88 },
    { topico: 'Interpretação Textual', previsto: true, probabilidade: 79 },
    { topico: 'Proposições Lógicas', previsto: true, probabilidade: 82 },
    { topico: 'Atos Administrativos', previsto: true, probabilidade: 86 },
    { topico: 'Competências Constitucionais', previsto: false, probabilidade: 72 },
    { topico: 'Crase e Pontuação', previsto: true, probabilidade: 69 },
  ],
}

export default function ProvaDay({ onMenuClick }) {
  const [loading, setLoading] = useState(true)
  const [concursos, setConcursos] = useState(MOCK_CONCURSOS)
  const [selectedConcurso, setSelectedConcurso] = useState(null)
  const [tracking, setTracking] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  const [simulatedProgress, setSimulatedProgress] = useState(0)
  const [showPricing, setShowPricing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isTracking || !tracking) return
    const maxProgress = Math.round((tracking.topicosVistos.filter(t => t.previsto).length / tracking.totalPredicoes) * 100)
    const interval = setInterval(() => {
      setSimulatedProgress(prev => {
        const next = prev + Math.random() * 3
        if (next >= maxProgress) {
          clearInterval(interval)
          return maxProgress
        }
        return next
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [isTracking, tracking])

  const handleStartTracking = (concurso) => {
    setSelectedConcurso(concurso)
    setTracking({ ...MOCK_TRACKING, concurso: concurso.nome, banca: concurso.banca, concursoId: concurso.id })
    setIsTracking(true)
    setSimulatedProgress(0)
  }

  const handleFinishTracking = () => {
    setIsTracking(false)
  }

  const matchedCount = tracking ? tracking.topicosVistos.filter(t => t.previsto).length : 0
  const matchPercent = tracking ? Math.round((matchedCount / tracking.totalPredicoes) * 100) : 0

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <span>Carregando Prova Day...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="btn btn-icon btn-outline" onClick={onMenuClick}>☰</button>
          <h1>⚡ Prova Day</h1>
          <span className="badge badge-premium">PREMIUM</span>
        </div>
        <p>Rastreamento em tempo real de provas de concursos</p>
      </div>

      {/* Premium Gate */}
      {!showPricing ? (
        <>
          {/* Active Exams */}
          <div className="section-title">
            <span className="icon">📅</span>
            Provas Disponíveis
          </div>

          {!isTracking ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {concursos.map(concurso => (
                <div key={concurso.id} className="card card-glow">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: 4 }}>
                        {concurso.nome}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="badge badge-cyan">{concurso.banca}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(concurso.data).toLocaleDateString('pt-BR')} às {concurso.horario}
                        </span>
                        <span className={`badge ${concurso.status === 'andamento' ? 'badge-neon' : concurso.status === 'agendada' ? 'badge-yellow' : 'badge-orange'}`}>
                          {concurso.status === 'andamento' ? '🔴 Em andamento' : concurso.status === 'agendada' ? '⏰ Agendada' : '✅ Encerrada'}
                        </span>
                      </div>
                    </div>
                    {concurso.status !== 'encerrada' ? (
                      <button className="btn btn-neon" onClick={() => handleStartTracking(concurso)}>
                        🚀 Rastrear Prova
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Prova encerrada</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Tracking View */
            <div>
              {/* Live Tracking Header */}
              <div className="card" style={{ marginBottom: 24, textAlign: 'center', background: 'linear-gradient(135deg, rgba(57,255,20,0.08), var(--card))' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  🔴 Rastreamento ativo — {tracking.concurso}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--neon)', marginBottom: 4 }}>
                  {matchedCount} de {tracking.totalPredicoes}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  predições apareceram até agora
                </div>
                <div className="progress-bar progress-bar-lg" style={{ maxWidth: 500, margin: '0 auto 16px' }}>
                  <div
                    className="progress-bar-fill neon"
                    style={{ width: `${Math.min(simulatedProgress, 100)}%`, transition: 'width 1s ease' }}
                  />
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  {Math.round(simulatedProgress)}% das predições confirmadas
                </div>
              </div>

              {/* Topics Seen vs Predicted */}
              <div className="section-title">
                <span className="icon">📋</span>
                Tópicos Vistos vs. Previstos
              </div>
              <div className="table-container" style={{ marginBottom: 24 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tópico</th>
                      <th style={{ width: 100 }}>Probabilidade</th>
                      <th style={{ width: 100 }}>Previsto?</th>
                      <th style={{ width: 100 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tracking.topicosVistos.map((topico, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500 }}>{topico.topico}</td>
                        <td>
                          <span style={{
                            fontWeight: 700,
                            color: topico.probabilidade >= 80 ? 'var(--neon)' : topico.probabilidade >= 50 ? 'var(--gold)' : 'var(--text-muted)',
                          }}>
                            {topico.probabilidade}%
                          </span>
                        </td>
                        <td>
                          {topico.previsto ? (
                            <span className="badge badge-green">✓ Previsto</span>
                          ) : (
                            <span className="badge badge-orange">✗ Não previsto</span>
                          )}
                        </td>
                        <td>
                          {topico.previsto ? (
                            <span className="badge badge-neon">🎯 Acerto</span>
                          ) : (
                            <span className="badge badge-red">❌ Falta</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button className="btn btn-outline" onClick={handleFinishTracking} style={{ width: '100%', marginBottom: 24 }}>
                ⏹️ Finalizar Rastreamento
              </button>
            </div>
          )}

          {/* Pricing */}
          <div className="section-title">
            <span className="icon">💎</span>
            Preços do Prova Day
          </div>
          <div className="content-grid-2">
            <div className="pricing-card">
              <div className="pricing-card-name">Prova Única</div>
              <div className="pricing-card-price">R$ 9,90</div>
              <div className="pricing-card-features">
                <div className="pricing-card-feature"><span className="check">✓</span> Rastreamento de 1 prova</div>
                <div className="pricing-card-feature"><span className="check">✓</span> Comparação em tempo real</div>
                <div className="pricing-card-feature"><span className="check">✓</span> Relatório pós-prova</div>
              </div>
              <button className="btn btn-outline" style={{ width: '100%' }}>Comprar</button>
            </div>
            <div className="pricing-card featured">
              <div className="pricing-card-name">Pack 5 Provas</div>
              <div className="pricing-card-price">R$ 39,90 <span>/ 5 provas</span></div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gold)', fontWeight: 600, marginBottom: 8 }}>
                Economize R$ 9,60!
              </div>
              <div className="pricing-card-features">
                <div className="pricing-card-feature"><span className="check">✓</span> 5 rastreamentos de provas</div>
                <div className="pricing-card-feature"><span className="check">✓</span> Comparação em tempo real</div>
                <div className="pricing-card-feature"><span className="check">✓</span> Relatório pós-prova</div>
                <div className="pricing-card-feature"><span className="check">✓</span> Análise estatística completa</div>
                <div className="pricing-card-feature"><span className="check">✓</span> Dados para o flywheel</div>
              </div>
              <button className="btn btn-neon" style={{ width: '100%' }}>Comprar Pack</button>
            </div>
          </div>
        </>
      ) : (
        /* Premium Upsell */
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>💎</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
            Prova Day é exclusivo Premium
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            Assine o plano Premium para ter acesso ao rastreamento em tempo real de provas de concursos.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-neon" onClick={() => setShowPricing(false)}>
              Já sou Premium
            </button>
            <a href="/premium" className="btn btn-gold">
              Assinar Premium
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
