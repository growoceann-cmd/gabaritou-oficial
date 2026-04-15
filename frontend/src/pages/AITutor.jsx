import React, { useState, useEffect } from 'react'
import StudyPlanCard from '../components/StudyPlanCard'

const BANCAS = [
  { value: 'cebraspe', label: 'CEBRASPE' },
  { value: 'fgv', label: 'FGV' },
  { value: 'fcc', label: 'FCC' },
  { value: 'vunesp', label: 'VUNESP' },
  { value: 'fce', label: 'FCE' },
  { value: 'quadrix', label: 'Quadrix' },
]

const CARGOS = [
  { value: 'analista-judiciario', label: 'Analista Judiciário' },
  { value: 'tecnico-judiciario', label: 'Técnico Judiciário' },
  { value: 'agente-policia', label: 'Agente de Polícia' },
  { value: 'auditor-fiscal', label: 'Auditor Fiscal' },
  { value: 'analista-tribunal', label: 'Analista de Tribunal' },
  { value: 'procurador', label: 'Procurador' },
  { value: 'delegado', label: 'Delegado' },
]

const MOCK_STUDY_PLAN = {
  titulo: 'Plano de Estudos Personalizado',
  banca: 'CEBRASPE',
  cargo: 'Analista Judiciário',
  horasDiarias: 4,
  totalHoras: 240,
  topicos: [
    { id: 't1', nome: 'Direito Constitucional', prioridade: 95, horasEstimadas: 48, resumo: 'Controle de constitucionalidade, direitos fundamentais, organização do Estado, processo legislativo. Foco em jurisprudência recente do STF.' },
    { id: 't2', nome: 'Direito Administrativo', prioridade: 90, horasEstimadas: 40, resumo: 'Licitações (Lei 14.133/21), contratos, atos administrativos, responsabilidade civil, servidores públicos. Enfatizar mudanças legislativas recentes.' },
    { id: 't3', nome: 'Direito Civil', prioridade: 85, horasEstimadas: 36, resumo: 'Obrigações, contratos, responsabilidade civil, direitos reais. Revisar CPC e técnicas de interpretação.' },
    { id: 't4', nome: 'Língua Portuguesa', prioridade: 80, horasEstimadas: 28, resumo: 'Interpretação textual, semântica, concordância, regência, pontuação, crase. Praticar com textos argumentativos.' },
    { id: 't5', nome: 'Raciocínio Lógico', prioridade: 75, horasEstimadas: 24, resumo: 'Proposições, conectivos lógicos, equivalências, diagramas lógicos, probabilidade. Resolver muitos exercícios.' },
    { id: 't6', nome: 'Administração Pública', prioridade: 70, horasEstimadas: 20, resumo: 'Modelos de gestão, governança, accountability, reformas administrativas. Comparar modelos e revisar reformas.' },
    { id: 't7', nome: 'Direito Penal', prioridade: 65, horasEstimadas: 20, resumo: 'Crimes contra a administração, crimes contra a pessoa, crimes contra o patrimônio. Foco em concurso para área jurídica.' },
    { id: 't8', nome: 'Informática', prioridade: 55, horasEstimadas: 14, resumo: 'Segurança da informação, redes, hardware, software, sistemas operacionais. Revisar conceitos atualizados.' },
    { id: 't9', nome: 'Noções de Contabilidade', prioridade: 50, horasEstimadas: 10, resumo: 'Princípios contábeis, balanço patrimonial, DRE, demonstrações contábeis básicas. Noções introdutórias.' },
  ],
}

const MOCK_PROGRESS = [
  { mes: 'Jul', horas: 12 },
  { mes: 'Ago', horas: 28 },
  { mes: 'Set', horas: 45 },
  { mes: 'Out', horas: 52 },
  { mes: 'Nov', horas: 48 },
]

const MOCK_RECOMMENDATION = {
  topico: 'Direito Administrativo — Licitações (Lei 14.133/21)',
  motivo: 'Este tópico tem probabilidade de 85% de cair na próxima prova da CEBRASPE e sua última revisão foi há 15 dias.',
  acao: 'Recomendamos revisar as principais mudanças da nova Lei de Licitações e praticar com questões anteriores.',
  prioridade: 'ALTA',
}

const MOCK_QUIZ = [
  {
    id: 'q1',
    enunciado: 'De acordo com a Lei 14.133/2021, qual é o limite para dispensa de licitação em obras de engenharia?',
    alternativas: ['R$ 50.000,00', 'R$ 100.000,00', 'R$ 150.000,00', 'R$ 200.000,00'],
    correta: 0,
    topico: 'Direito Administrativo — Licitações',
  },
  {
    id: 'q2',
    enunciado: 'O controle concentrado de constitucionalidade pode ser exercido mediante:',
    alternativas: ['ADI, ADC e ADPF', 'MS, HC e HD', 'AI e RE', 'Apelação e Embargos'],
    correta: 0,
    topico: 'Direito Constitucional',
  },
  {
    id: 'q3',
    enunciado: 'A proposição "Se chove, então fico em casa" é logicamente equivalente a:',
    alternativas: ['Se não fico em casa, então não chove', 'Se fico em casa, então chove', 'Se não chove, então não fico em casa', 'Chove e fico em casa'],
    correta: 0,
    topico: 'Raciocínio Lógico',
  },
]

export default function AITutor({ onMenuClick }) {
  const [loading, setLoading] = useState(true)
  const [planGenerated, setPlanGenerated] = useState(false)
  const [studyPlan, setStudyPlan] = useState(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quiz, setQuiz] = useState([])
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [showSummary, setShowSummary] = useState(null)
  const [generating, setGenerating] = useState(false)

  const [form, setForm] = useState({
    banca: 'cebraspe',
    cargo: 'analista-judiciario',
    horasDiarias: '4',
  })

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  const handleGeneratePlan = () => {
    setGenerating(true)
    setTimeout(() => {
      setStudyPlan({ ...MOCK_STUDY_PLAN, banca: form.banca.toUpperCase(), cargo: CARGOS.find(c => c.value === form.cargo)?.label || form.cargo, horasDiarias: parseInt(form.horasDiarias) })
      setPlanGenerated(true)
      setGenerating(false)
    }, 1500)
  }

  const handleStartQuiz = () => {
    setShowQuiz(true)
    setQuiz(MOCK_QUIZ)
    setQuizAnswers({})
    setQuizSubmitted(false)
  }

  const handleQuizAnswer = (questionId, answerIdx) => {
    if (quizSubmitted) return
    setQuizAnswers(prev => ({ ...prev, [questionId]: answerIdx }))
  }

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true)
  }

  const quizScore = quiz.length > 0
    ? quiz.filter(q => quizAnswers[q.id] === q.correta).length
    : 0

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <span>Carregando AI Tutor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="btn btn-icon btn-outline" onClick={onMenuClick}>☰</button>
          <h1>🧠 AI Tutor</h1>
        </div>
        <p>Plano de estudos personalizado e simulado adaptativo</p>
      </div>

      {/* Generate Study Plan */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">📋 Gerar Plano de Estudos</div>
            <div className="card-subtitle">Informe banca, cargo e horas diárias para gerar seu plano</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Banca</label>
            <select
              className="form-select"
              value={form.banca}
              onChange={e => setForm(prev => ({ ...prev, banca: e.target.value }))}
            >
              {BANCAS.map(b => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cargo</label>
            <select
              className="form-select"
              value={form.cargo}
              onChange={e => setForm(prev => ({ ...prev, cargo: e.target.value }))}
            >
              {CARGOS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Horas/dia</label>
            <input
              type="number"
              className="form-input"
              value={form.horasDiarias}
              onChange={e => setForm(prev => ({ ...prev, horasDiarias: e.target.value }))}
              min="1"
              max="12"
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className={`btn ${planGenerated ? 'btn-outline' : 'btn-neon'}`}
              onClick={handleGeneratePlan}
              disabled={generating}
              style={{ width: '100%' }}
            >
              {generating ? (
                <><div className="spinner spinner-sm" style={{ marginRight: 8 }} /> Gerando...</>
              ) : planGenerated ? (
                '🔄 Regenerar Plano'
              ) : (
                '🧠 Gerar com IA'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--neon)', background: 'linear-gradient(90deg, rgba(57,255,20,0.05), var(--card))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: '1.3rem' }}>💡</span>
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>O que estudar agora?</div>
          <span className="badge badge-neon">{MOCK_RECOMMENDATION.prioridade}</span>
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--cyan)', marginBottom: 6 }}>
          {MOCK_RECOMMENDATION.topico}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>
          {MOCK_RECOMMENDATION.motivo}
        </div>
        <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
          <strong>Ação sugerida:</strong> {MOCK_RECOMMENDATION.acao}
        </div>
      </div>

      {/* Study Plan */}
      {planGenerated && studyPlan && (
        <div style={{ marginBottom: 32 }}>
          <div className="section-title">
            <span className="icon">📚</span>
            Plano de Estudos
          </div>
          <StudyPlanCard plan={studyPlan} />
        </div>
      )}

      {/* Quiz Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            <span className="icon">📝</span>
            Simulado Adaptativo
          </div>
          {!showQuiz && (
            <button className="btn btn-primary" onClick={handleStartQuiz}>
              🎯 Iniciar Simulado
            </button>
          )}
        </div>

        {showQuiz && quiz.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {quiz.map((q, qIdx) => (
              <div key={q.id} style={{
                padding: 24,
                borderBottom: qIdx < quiz.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <span className="badge badge-violet">Q{qIdx + 1}</span>
                  <span className="badge badge-cyan">{q.topico}</span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: 16, lineHeight: 1.5 }}>
                  {q.enunciado}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {q.alternativas.map((alt, aIdx) => {
                    const isSelected = quizAnswers[q.id] === aIdx
                    const isCorrect = q.correta === aIdx
                    let style = {
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      cursor: quizSubmitted ? 'default' : 'pointer',
                      fontSize: '0.88rem',
                      transition: 'all 0.2s ease',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                    }

                    if (quizSubmitted) {
                      if (isCorrect) {
                        style.borderColor = 'var(--neon)'
                        style.background = 'var(--neon-glow)'
                        style.color = 'var(--neon)'
                      } else if (isSelected && !isCorrect) {
                        style.borderColor = 'var(--red)'
                        style.background = 'var(--red-glow)'
                        style.color = 'var(--red)'
                      }
                    } else if (isSelected) {
                      style.borderColor = 'var(--violet)'
                      style.background = 'var(--violet-glow)'
                    }

                    return (
                      <div
                        key={aIdx}
                        onClick={() => handleQuizAnswer(q.id, aIdx)}
                        style={style}
                      >
                        <strong>{String.fromCharCode(65 + aIdx)})</strong> {alt}
                        {quizSubmitted && isCorrect && ' ✓'}
                        {quizSubmitted && isSelected && !isCorrect && ' ✗'}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {!quizSubmitted ? (
              <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-neon"
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(quizAnswers).length < quiz.length}
                >
                  Enviar Respostas ({Object.keys(quizAnswers).length}/{quiz.length})
                </button>
              </div>
            ) : (
              <div style={{
                padding: 24,
                borderTop: '1px solid var(--border)',
                background: 'var(--surface)',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: quizScore >= quiz.length * 0.7 ? 'var(--neon)' : 'var(--gold)',
                }}>
                  {quizScore}/{quiz.length}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  {quizScore >= quiz.length * 0.7 ? '🎉 Excelente desempenho!' : quizScore >= quiz.length * 0.5 ? '👍 Bom resultado! Continue estudando.' : '📚 Revise os pontos fracos e tente novamente.'}
                </div>
                <button className="btn btn-outline btn-sm" onClick={handleStartQuiz}>
                  🔄 Novo Simulado
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Chart (simple bar chart) */}
      <div>
        <div className="section-title">
          <span className="icon">📊</span>
          Progresso de Estudos
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 180, padding: '0 8px' }}>
            {MOCK_PROGRESS.map((p, idx) => {
              const maxHoras = Math.max(...MOCK_PROGRESS.map(pp => pp.horas))
              const height = (p.horas / maxHoras) * 140
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: '100%',
                    maxWidth: 48,
                    height: `${height}px`,
                    background: 'linear-gradient(180deg, var(--violet-light), var(--violet-dark))',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    transition: 'height 0.5s ease',
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: -22,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text)',
                    }}>
                      {p.horas}h
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {p.mes}
                  </span>
                </div>
              )
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Horas de estudo por mês
          </div>
        </div>
      </div>
    </div>
  )
}
