import React, { useState, useEffect } from 'react'
import LeaderboardTable from '../components/LeaderboardTable'

const MOCK_LEADERBOARD = [
  { id: 'u1', nome: 'Maria Silva', pontos: 12450, acuracia: 92, bancaFavorita: 'CEBRASPE' },
  { id: 'u2', nome: 'João Santos', pontos: 11200, acuracia: 89, bancaFavorita: 'FGV' },
  { id: 'u3', nome: 'Ana Oliveira', pontos: 10890, acuracia: 87, bancaFavorita: 'CEBRASPE' },
  { id: 'u4', nome: 'Carlos Pereira', pontos: 9750, acuracia: 85, bancaFavorita: 'FCC' },
  { id: 'u5', nome: 'Fernanda Costa', pontos: 9200, acuracia: 84, bancaFavorita: 'CEBRASPE' },
  { id: 'u6', nome: 'Ricardo Mendes', pontos: 8900, acuracia: 82, bancaFavorita: 'VUNESP' },
  { id: 'u7', nome: 'Patrícia Almeida', pontos: 8450, acuracia: 81, bancaFavorita: 'CEBRASPE' },
  { id: 'u8', nome: 'Lucas Ferreira', pontos: 7800, acuracia: 79, bancaFavorita: 'FGV' },
  { id: 'u9', nome: 'Juliana Rocha', pontos: 7200, acuracia: 78, bancaFavorita: 'FCC' },
  { id: 'u10', nome: 'Marcos Lima', pontos: 6900, acuracia: 76, bancaFavorita: 'CEBRASPE' },
]

const MOCK_CHALLENGES = [
  { id: 'c1', titulo: 'Desafio CEBRASPE Semanal', descricao: 'Acerte o máximo de predições para concursos da CEBRASPE esta semana!', participantes: 342, premio: '1 mês Premium', encerraEm: '3 dias', status: 'ativo', banca: 'CEBRASPE' },
  { id: 'c2', titulo: 'Maratona Direito Constitucional', descricao: 'Desafio especial: 30 dias focados em Direito Constitucional.', participantes: 128, premio: 'Plano VIP 3 meses', encerraEm: '7 dias', status: 'ativo', banca: 'Todas' },
  { id: 'c3', titulo: 'Derrota da FGV — Novembro', descricao: 'Quem prevê mais questões da FGV em novembro vence!', participantes: 256, premio: '1 ano Premium', encerraEm: '15 dias', status: 'ativo', banca: 'FGV' },
  { id: 'c4', titulo: 'Desafio Raciocínio Lógico', descricao: 'Questões de lógica pura — teste suas habilidades de predição.', participantes: 89, premio: 'Simulado Premium', encerraEm: 'Encerrado', status: 'encerrado', banca: 'Todas' },
]

const MOCK_GROUPS = [
  { id: 'g1', nome: 'CEBRASPE — Analista Judiciário', banca: 'CEBRASPE', membros: 1248, cargo: 'Analista Judiciário', aberto: true },
  { id: 'g2', nome: 'FGV — Tribunais', banca: 'FGV', membros: 892, cargo: 'Geral', aberto: true },
  { id: 'g3', nome: 'FCC — TRTs', banca: 'FCC', membros: 645, cargo: 'Analista/Técnico', aberto: true },
  { id: 'g4', nome: 'CEBRASPE — Polícia Federal', banca: 'CEBRASPE', membros: 2103, cargo: 'Agente/Delegado', aberto: true },
  { id: 'g5', nome: 'VUNESP — TJ-SP', banca: 'VUNESP', membros: 756, cargo: 'Escrevente/Analista', aberto: false },
]

const CONCURSO_FILTERS = [
  { value: '', label: 'Geral' },
  { value: 'cebraspe', label: 'CEBRASPE' },
  { value: 'fgv', label: 'FGV' },
  { value: 'fcc', label: 'FCC' },
]

export default function Community({ onMenuClick }) {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ranking')
  const [leaderboard, setLeaderboard] = useState(MOCK_LEADERBOARD)
  const [challenges, setChallenges] = useState(MOCK_CHALLENGES)
  const [groups, setGroups] = useState(MOCK_GROUPS)
  const [concursoFilter, setConcursoFilter] = useState('')
  const [joinedChallenges, setJoinedChallenges] = useState([])
  const [joinedGroups, setJoinedGroups] = useState([])

  const [userStreak] = useState(15)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleJoinChallenge = (id) => {
    if (!joinedChallenges.includes(id)) {
      setJoinedChallenges([...joinedChallenges, id])
    }
  }

  const handleJoinGroup = (id) => {
    if (!joinedGroups.includes(id)) {
      setJoinedGroups([...joinedGroups, id])
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <span>Carregando comunidade...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="btn btn-icon btn-outline" onClick={onMenuClick}>☰</button>
          <h1>👥 Comunidade</h1>
        </div>
        <p>Ranking, desafios e grupos de estudo</p>
      </div>

      {/* User streak */}
      <div className="card" style={{ marginBottom: 24, textAlign: 'center', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.1))' }}>
        <div style={{ fontSize: '2rem', marginBottom: 4 }}>🔥</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--gold)' }}>{userStreak} dias</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sua sequência de estudos</div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'ranking' ? 'active' : ''}`} onClick={() => setActiveTab('ranking')}>
          🏆 Ranking
        </button>
        <button className={`tab ${activeTab === 'desafios' ? 'active' : ''}`} onClick={() => setActiveTab('desafios')}>
          🎯 Desafios
        </button>
        <button className={`tab ${activeTab === 'grupos' ? 'active' : ''}`} onClick={() => setActiveTab('grupos')}>
          📚 Grupos de Estudo
        </button>
      </div>

      {/* Ranking Tab */}
      {activeTab === 'ranking' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Filtrar:</span>
            {CONCURSO_FILTERS.map(f => (
              <button
                key={f.value}
                className={`btn btn-sm ${concursoFilter === f.value ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setConcursoFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <LeaderboardTable data={leaderboard} currentUserId="u6" />
        </div>
      )}

      {/* Desafios Tab */}
      {activeTab === 'desafios' && (
        <div>
          {challenges.filter(c => c.status === 'ativo').length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎯</div>
              <div className="empty-state-title">Nenhum desafio ativo</div>
              <div className="empty-state-text">Fique atento — novos desafios são lançados toda semana!</div>
            </div>
          ) : (
            <div className="content-grid-2">
              {challenges.map(ch => (
                <div key={ch.id} className="card card-glow" style={{ opacity: ch.status === 'encerrado' ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className={`badge ${ch.status === 'ativo' ? 'badge-neon' : 'badge-orange'}`}>
                      {ch.status === 'ativo' ? '🔥 Ativo' : 'Encerrado'}
                    </span>
                    {ch.banca !== 'Todas' && <span className="badge badge-cyan">{ch.banca}</span>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: 6 }}>
                    {ch.titulo}
                  </div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                    {ch.descricao}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                    <span>👥 {ch.participantes}</span>
                    <span>🎁 {ch.premio}</span>
                    <span>⏰ {ch.encerraEm}</span>
                  </div>
                  {ch.status === 'ativo' && (
                    joinedChallenges.includes(ch.id) ? (
                      <button className="btn btn-neon btn-sm" disabled style={{ width: '100%' }}>
                        ✅ Participando!
                      </button>
                    ) : (
                      <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => handleJoinChallenge(ch.id)}>
                        🎯 Participar
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'grupos' && (
        <div>
          {groups.map(group => (
            <div key={group.id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: 4 }}>
                    📚 {group.nome}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span className="badge badge-cyan">{group.banca}</span>
                    <span>👥 {group.membros.toLocaleString('pt-BR')} membros</span>
                    <span>💼 {group.cargo}</span>
                    {!group.aberto && <span className="badge badge-orange">Fechado</span>}
                  </div>
                </div>
                {group.aberto && (
                  joinedGroups.includes(group.id) ? (
                    <button className="btn btn-neon btn-sm" disabled>✅ Membro</button>
                  ) : (
                    <button className="btn btn-outline btn-sm" onClick={() => handleJoinGroup(group.id)}>
                      Entrar
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
