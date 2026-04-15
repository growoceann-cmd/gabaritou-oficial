import React, { useState } from 'react'
import FeedbackButtons from './FeedbackButtons'

const difficultyLabels = {
  facil: { text: 'Fácil', class: 'badge-green' },
  medio: { text: 'Médio', class: 'badge-yellow' },
  dificil: { text: 'Difícil', class: 'badge-red' },
}

const probabilityColor = (prob) => {
  if (prob >= 80) return 'neon'
  if (prob >= 50) return 'gold'
  return 'red'
}

export default function PredictionCard({ prediction }) {
  const [expanded, setExpanded] = useState({ armadilhas: false, dicas: false, provas: false })
  const [feedback, setFeedback] = useState(null)
  const [showToast, setShowToast] = useState(false)

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleFeedback = (acertou) => {
    setFeedback(acertou ? 'acertou' : 'errou')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const prob = prediction.probabilidade || 0
  const probColor = probabilityColor(prob)
  const diff = difficultyLabels[prediction.dificuldade] || difficultyLabels.medio

  return (
    <div className="card card-glow" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            {prediction.topico}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`badge ${diff.class}`}>{diff.text}</span>
            <span className="badge badge-cyan">{prediction.banca || 'CEBRASPE'}</span>
            {prediction.recencia && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Recência: {prediction.recencia}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 80 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: prob >= 80 ? 'var(--neon)' : prob >= 50 ? 'var(--gold)' : 'var(--red)' }}>
            {prob}%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>probabilidade</div>
        </div>
      </div>

      <div className="progress-bar" style={{ marginBottom: 16 }}>
        <div
          className={`progress-bar-fill ${probColor}`}
          style={{ width: `${prob}%` }}
        />
      </div>

      {/* Armadilhas */}
      <div className="expandable" style={{ marginBottom: 8 }}>
        <button className="expandable-header" onClick={() => toggleSection('armadilhas')}>
          ⚠️ Armadilhas frequentes
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            {expanded.armadilhas ? '▲' : '▼'}
          </span>
        </button>
        <div className={`expandable-content ${expanded.armadilhas ? 'open' : ''}`}>
          <ul style={{ paddingLeft: 16, listStyle: 'disc', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {(prediction.armadilhas || ['Confundir conceitos semelhantes', 'Pegadinhas na formulação da questão', 'Interpretação literal vs. interpretativa']).map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Dicas */}
      <div className="expandable" style={{ marginBottom: 8 }}>
        <button className="expandable-header" onClick={() => toggleSection('dicas')}>
          💡 Dicas de estudo
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            {expanded.dicas ? '▲' : '▼'}
          </span>
        </button>
        <div className={`expandable-content ${expanded.dicas ? 'open' : ''}`}>
          <ul style={{ paddingLeft: 16, listStyle: 'disc', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {(prediction.dicas || ['Revise a legislação atualizada', 'Pratique com questões anteriores', 'Foque nas exceções e mudanças recentes']).map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Provas onde caiu */}
      <div className="expandable" style={{ marginBottom: 16 }}>
        <button className="expandable-header" onClick={() => toggleSection('provas')}>
          📋 Provas onde caiu
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            {expanded.provas ? '▲' : '▼'}
          </span>
        </button>
        <div className={`expandable-content ${expanded.provas ? 'open' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(prediction.provasOndeCaiu || [
              'TRF-3 2024 — Técnico Judiciário',
              'TJ-SP 2024 — Escrevente',
              'PF 2023 — Agente',
            ]).map((prova, i) => (
              <div key={i} style={{
                padding: '6px 12px',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
              }}>
                {prova}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback — DATA FLYWHEEL */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Previu corretamente?
        </div>
        <FeedbackButtons
          onFeedback={handleFeedback}
          feedback={feedback}
        />
      </div>

      {showToast && (
        <div className="toast toast-success">
          {feedback === 'acertou' ? '✅ Obrigado pelo feedback! Predição confirmada.' : '❌ Feedback registrado. Vamos melhorar!'}
        </div>
      )}
    </div>
  )
}
