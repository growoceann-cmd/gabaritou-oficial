import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StatsCard from '../components/StatsCard'

const MOCK_STATS = {
  totalPredicoes: 2847,
  acuraciaMedia: 78,
  usersAtivos: 12450,
  provasRastreadas: 156,
}

const MOCK_TOP_PREDICTIONS = [
  { id: 1, topico: 'Direito Constitucional — Controle de Constitucionalidade', probabilidade: 92, banca: 'CEBRASPE', materia: 'Direito Constitucional', dificuldade: 'dificil', recencia: '15 dias' },
  { id: 2, topico: 'Administração Pública — Modelos de Gestão', probabilidade: 88, banca: 'FGV', materia: 'Administração Pública', dificuldade: 'medio', recencia: '8 dias' },
  { id: 3, topico: 'Direito Administrativo — Licitações (Nova Lei 14.133)', probabilidade: 85, banca: 'CEBRASPE', materia: 'Direito Administrativo', dificuldade: 'dificil', recencia: '3 dias' },
  { id: 4, topico: 'Raciocínio Lógico — Proposições e Conectivos', probabilidade: 82, banca: 'FCC', materia: 'Raciocínio Lógico', dificuldade: 'medio', recencia: '12 dias' },
  { id: 5, topico: 'Língua Portuguesa — Interpretação Textual', probabilidade: 79, banca: 'CEBRASPE', materia: 'Língua Portuguesa', dificuldade: 'facil', recencia: '5 dias' },
]

const MOCK_ACCURACY_REPORTS = [
  { id: 'r1', concurso: 'TRF-3 — Técnico Judiciário', banca: 'CEBRASPE', data: '2024-11-15', acuracia: 82, questoes: 100, acertos: 82 },
  { id: 'r2', concurso: 'TJ-SP — Escrevente', banca: 'VUNESP', data: '2024-11-10', acuracia: 76, questoes: 90, acertos: 68 },
  { id: 'r3', concurso: 'Polícia Federal — Agente', banca: 'CEBRASPE', data: '2024-11-05', acuracia: 85, questoes: 120, acertos: 102 },
]

const MOCK_CHALLENGES = [
  { id: 'c1', titulo: 'Desafio CEBRASPE Semanal', participantes: 342, premio: '1 mês Premium', encerraEm: '3 dias' },
  { id: 'c2', titulo: 'Maratona Direito Constitucional', participantes: 128, premio: 'Plano VIP', encerraEm: '7 dias' },
]

const MOCK_FUNNEL = [
  { etapa: 'Visitantes', valor: 45000, percentual: 100 },
  { etapa: 'Cadastros', valor: 12450, percentual: 27.7 },
  { etapa: 'Trial Premium', valor: 3200, percentual: 7.1 },
  { etapa: 'Premium Ativo', valor: 1870, percentual: 4.2 },
]

export default function Dashboard({ onMenuClick }) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(MOCK_STATS)
  const [topPredictions, setTopPredictions] = useState(MOCK_TOP_PREDICTIONS)
  const [reports, setReports] = useState(MOCK_ACCURACY_REPORTS)
  const [challenges, setChallenges] = useState(MOCK_CHALLENGES)
  const [funnel, setFunnel] = useState(MOCK_FUNNEL)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <span>Carregando dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <button
            className="btn btn-icon btn-outline"
            onClick={onMenuClick}
            style={{ display: 'none', marginRight: 12 }}
          >
            ☰
          </button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
            🎯 <span style={{ background: 'linear-gradient(135deg, var(--violet), var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Gabaritou</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            IA que prevê questões de concursos públicos
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/premium" className="btn btn-gold btn-sm">💎 Upgrade Premium</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="content-grid-4" style={{ marginBottom: 32 }}>
        <StatsCard value={stats.totalPredicoes.toLocaleString('pt-BR')} label="Total de predições" color="neon" icon="🎯" change={12} changeLabel="vs mês anterior" />
        <StatsCard value={`${stats.acuraciaMedia}%`} label="Acurácia média" color="cyan" icon="📈" change={5} changeLabel="vs mês anterior" />
        <StatsCard value={stats.usersAtivos.toLocaleString('pt-BR')} label="Usuários ativos" color="violet" icon="👥" change={18} changeLabel="vs mês anterior" />
        <StatsCard value={stats.provasRastreadas.toLocaleString('pt-BR')} label="Provas rastreadas" color="gold" icon="⚡" change={8} changeLabel="vs mês anterior" />
      </div>

      {/* Top Predictions Carousel */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-title">
          <span className="icon">🔥</span>
          Top Predições
        </div>
        <div className="carousel" style={{ paddingBottom: 4 }}>
          {topPredictions.map(pred => (
            <Link
              key={pred.id}
              to={`/predicoes/${pred.banca.toLowerCase()}/${pred.materia.toLowerCase().replace(/\s+/g, '-')}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div className="card card-glow" style={{ width: 300, cursor: 'pointer' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: 6 }}>
                  {pred.banca} • {pred.materia}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: 12, lineHeight: 1.3 }}>
                  {pred.topico}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: pred.probabilidade >= 80 ? 'var(--neon)' : 'var(--gold)' }}>
                    {pred.probabilidade}%
                  </div>
                  <span className="badge badge-free">Recência: {pred.recencia}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${pred.probabilidade >= 80 ? 'neon' : 'gold'}`}
                    style={{ width: `${pred.probabilidade}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="content-grid-2" style={{ marginBottom: 32 }}>
        {/* Latest Accuracy Reports */}
        <div>
          <div className="section-title">
            <span className="icon">📈</span>
            Últimos Relatórios de Acurácia
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reports.map(report => (
              <Link
                key={report.id}
                to={`/acuracia/${report.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="card card-glow" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 2 }}>
                        {report.concurso}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {report.banca} • {new Date(report.data).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '1.4rem',
                        fontWeight: 900,
                        color: report.acuracia >= 75 ? 'var(--neon)' : 'var(--gold)',
                      }}>
                        {report.acuracia}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {report.acertos}/{report.questoes}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Link to="/acuracia" className="btn btn-outline" style={{ marginTop: 12, width: '100%' }}>
            Ver todos os relatórios →
          </Link>
        </div>

        {/* Active Challenges */}
        <div>
          <div className="section-title">
            <span className="icon">🏆</span>
            Desafios da Comunidade
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {challenges.map(ch => (
              <div key={ch.id} className="card">
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 6 }}>
                  {ch.titulo}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  <span>👥 {ch.participantes} participantes</span>
                  <span>🎁 {ch.premio}</span>
                  <span>⏰ {ch.encerraEm}</span>
                </div>
                <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                  Participar
                </button>
              </div>
            ))}
          </div>
          <Link to="/comunidade" className="btn btn-outline" style={{ marginTop: 12, width: '100%' }}>
            Ver comunidade →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-title">
          <span className="icon">🚀</span>
          Ações Rápidas
        </div>
        <div className="content-grid-3">
          <Link to="/predicoes" style={{ textDecoration: 'none' }}>
            <div className="card card-glow" style={{ cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎯</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: 4 }}>
                Ver Predições
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Explore predições por banca e matéria
              </div>
            </div>
          </Link>
          <Link to="/tutor" style={{ textDecoration: 'none' }}>
            <div className="card card-glow" style={{ cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🧠</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: 4 }}>
                Iniciar Plano de Estudos
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Plano personalizado com IA
              </div>
            </div>
          </Link>
          <Link to="/prova-day" style={{ textDecoration: 'none' }}>
            <div className="card card-glow" style={{ cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚡</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: 4 }}>
                Prova Day
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Rastreie provas em tempo real
              </div>
              <span className="badge badge-premium" style={{ marginTop: 8 }}>PREMIUM</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Conversion Funnel Mini */}
      <div>
        <div className="section-title">
          <span className="icon">📊</span>
          Funil de Conversão
        </div>
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {funnel.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 160, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>
                  {step.etapa}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="progress-bar progress-bar-lg">
                    <div
                      className="progress-bar-fill violet"
                      style={{ width: `${step.percentual}%` }}
                    />
                  </div>
                </div>
                <div style={{ width: 100, textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontWeight: 800, color: 'var(--cyan)', fontSize: '0.9rem' }}>
                    {step.valor.toLocaleString('pt-BR')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 6 }}>
                    ({step.percentual}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
