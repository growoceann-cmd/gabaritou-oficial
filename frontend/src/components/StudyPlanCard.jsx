import React, { useState } from 'react'

export default function StudyPlanCard({ plan }) {
  const [expandedTopic, setExpandedTopic] = useState(null)

  if (!plan || !plan.topicos || plan.topicos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📚</div>
        <div className="empty-state-title">Nenhum plano gerado</div>
        <div className="empty-state-text">Preencha o formulário para gerar seu plano de estudos personalizado.</div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        padding: '16px 24px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
            📋 {plan.titulo || 'Plano de Estudos'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {plan.banca || 'CEBRASPE'} • {plan.cargo || 'Analista'} • {plan.horasDiarias || 4}h/dia
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, color: 'var(--cyan)', fontSize: '1.1rem' }}>
            {plan.totalHoras || 120}h
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>carga total</div>
        </div>
      </div>

      <div style={{ padding: '8px 0' }}>
        {plan.topicos.map((topico, idx) => (
          <div key={topico.id || idx} style={{
            borderBottom: idx < plan.topicos.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div
              style={{
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onClick={() => setExpandedTopic(expandedTopic === idx ? null : idx)}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--card-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: topico.prioridade >= 80 ? 'var(--violet-glow)' : topico.prioridade >= 50 ? 'var(--gold-glow)' : 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: topico.prioridade >= 80 ? 'var(--violet-light)' : topico.prioridade >= 50 ? 'var(--gold)' : 'var(--text-muted)',
                flexShrink: 0,
              }}>
                {idx + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 4 }}>
                  {topico.nome}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="progress-bar progress-bar-sm" style={{ flex: 1, maxWidth: 200 }}>
                    <div
                      className={`progress-bar-fill ${topico.prioridade >= 80 ? 'violet' : topico.prioridade >= 50 ? 'gold' : 'cyan'}`}
                      style={{ width: `${topico.prioridade}%` }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, flexShrink: 0 }}>
                    {topico.prioridade}% prio
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--cyan)' }}>
                  {topico.horasEstimadas || topico.horas || 4}h
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>estimativa</div>
              </div>

              <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                {expandedTopic === idx ? '▲' : '▼'}
              </span>
            </div>

            {expandedTopic === idx && (
              <div style={{
                padding: '0 24px 16px',
                paddingLeft: 68,
                animation: 'fadeIn 0.2s ease',
              }}>
                <div style={{
                  padding: 12,
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.83rem',
                  color: 'var(--text-muted)',
                  marginBottom: 10,
                }}>
                  {topico.resumo || `Estude os conceitos fundamentais de ${topico.nome}. Foque nas últimas atualizações legislativas e pratique com questões de concursos anteriores.`}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm">
                    📖 Iniciar estudo
                  </button>
                  <button className="btn btn-outline btn-sm">
                    🧠 Resumo IA
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
