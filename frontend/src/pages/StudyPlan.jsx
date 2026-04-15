import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const MOCK_PLAN = {
  id: 'plan_1',
  banca: 'CEBRASPE',
  cargo: 'Analista Judiciário',
  progresso: 35,
  horas_estudadas: 42,
  horas_totais: 120,
  topicos: [
    { nome: 'Direito Administrativo — Atos Administrativos', prioridade: 1, status: 'concluido', horas: 8 },
    { nome: 'Direito Constitucional — Controle de Constitucionalidade', prioridade: 1, status: 'em_andamento', horas: 12 },
    { nome: 'Língua Portuguesa — Sintaxe', prioridade: 2, status: 'nao_iniciado', horas: 10 },
    { nome: 'Raciocínio Lógico — Proposições', prioridade: 3, status: 'nao_iniciado', horas: 6 },
  ]
}

export default function StudyPlan({ onMenuClick }) {
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState(MOCK_PLAN)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <span>Gerando plano personalizado...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
        <button className="btn btn-icon btn-outline" onClick={onMenuClick} style={{ marginRight: 12 }}>☰</button>
        <h1 className="page-title">🧠 Plano de Estudos</h1>
      </div>

      <div className="card card-glow" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--violet)' }}>{plan.cargo}</h2>
            <p style={{ color: 'var(--text-muted)' }}>Foco: <strong>{plan.banca}</strong></p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-premium">PREMIUM</span>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
            <span>Progresso Geral</span>
            <span style={{ fontWeight: 700, color: 'var(--cyan)' }}>{plan.progresso}%</span>
          </div>
          <div className="progress-bar progress-bar-lg">
            <div className="progress-bar-fill cyan" style={{ width: `${plan.progresso}%` }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Estudado</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{plan.horas_estudadas}h</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Meta Total</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{plan.horas_totais}h</div>
          </div>
        </div>
      </div>

      <div className="section-title">
        <span className="icon">📋</span>
        Cronograma de Tópicos
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {plan.topicos.map((topic, i) => (
          <div key={i} className="card" style={{ borderLeft: topic.status === 'concluido' ? '4px solid var(--neon)' : topic.status === 'em_andamento' ? '4px solid var(--violet)' : '4px solid var(--void)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{topic.nome}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Prioridade: {topic.prioridade === 1 ? '🔥 Alta' : '⚡ Média'} • Meta: {topic.horas}h
                </div>
              </div>
              <div>
                {topic.status === 'concluido' ? (
                  <span style={{ color: 'var(--neon)', fontWeight: 800 }}>✓</span>
                ) : (
                  <button className={`btn btn-sm ${topic.status === 'em_andamento' ? 'btn-primary' : 'btn-outline'}`}>
                    {topic.status === 'em_andamento' ? 'Continuar' : 'Iniciar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <button className="btn btn-outline btn-lg" style={{ width: '100%' }}>
          ⚙️ Ajustar Preferências do Plano
        </button>
      </div>
    </div>
  )
}
