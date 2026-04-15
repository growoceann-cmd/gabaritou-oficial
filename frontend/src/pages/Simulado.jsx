import React, { useState, useEffect } from 'react'

export default function Simulado({ onMenuClick }) {
  const [materia, setMateria] = useState('')
  const [questoes, setQuestoes] = useState([])
  const [loading, setLoading] = useState(false)

  const handleStart = (m) => {
    setLoading(true)
    setMateria(m)
    // Simular carregamento de questões via IA
    setTimeout(() => {
      setQuestoes([
        { id: 1, enunciado: 'Sobre os atos administrativos, é correto afirmar que:', alternativas: ['A', 'B', 'C', 'D'], resposta: 'C' },
        { id: 2, enunciado: 'O princípio da impessoalidade veda:', alternativas: ['A', 'B', 'C', 'D'], resposta: 'A' }
      ])
      setLoading(false)
    }, 1500)
  }

  if (loading) return <div className="page center">Gerando simulado adaptativo...</div>

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-menu" onClick={onMenuClick}>☰</button>
        <h1 className="page-title">🎯 Simulado IA</h1>
      </div>

      {!materia ? (
        <div className="grid">
          {['Direito Administrativo', 'Direito Constitucional', 'Português', 'Raciocínio Lógico'].map(m => (
            <div key={m} className="card card-interactive" onClick={() => handleStart(m)}>
              <h3>{m}</h3>
              <p>Questões infinitas baseadas no seu nível.</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="simulado-container">
          <h2>Simulado: {materia}</h2>
          {questoes.map((q, i) => (
            <div key={q.id} className="card q-card">
              <p><strong>Questão {i+1}</strong></p>
              <p>{q.enunciado}</p>
              <div className="options">
                 {['A', 'B', 'C', 'D'].map(opt => (
                   <button key={opt} className="btn btn-outline">{opt}</button>
                 ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
