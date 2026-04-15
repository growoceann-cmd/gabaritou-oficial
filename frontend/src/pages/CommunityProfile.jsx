import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import AccuracyBadge from '../components/AccuracyBadge'

const MOCK_PROFILE = {
  u1: {
    id: 'u1',
    nome: 'Maria Silva',
    avatar: 'MS',
    rank: 1,
    pontos: 12450,
    sequencia: 32,
    predicoesFeitas: 487,
    acuracia: 92,
    bancaFavorita: 'CEBRASPE',
    plano: 'Premium',
    badges: [
      { icon: '🏆', nome: 'Top 1 Ranking Geral', descricao: 'Alcançou o primeiro lugar no ranking' },
      { icon: '🔥', nome: 'Sequência de Fogo', descricao: '30+ dias consecutivos de estudo' },
      { icon: '🎯', nome: 'Precisão Cirúrgica', descricao: '90%+ de acurácia em predições' },
      { icon: '💎', nome: 'Premium desde o início', descricao: 'Membro Premium desde o lançamento' },
      { icon: '📊', nome: 'Contribuidor Flywheel', descricao: '100+ feedbacks de predições' },
    ],
    atividade: [
      { tipo: 'predicao', texto: 'Confirmou predição: Controle de Constitucionalidade — Acertou!', data: '2024-11-15 14:32', icon: '✅' },
      { tipo: 'desafio', texto: 'Venceu o Desafio CEBRASPE Semanal', data: '2024-11-14 20:00', icon: '🏆' },
      { tipo: 'estudo', texto: 'Completou 4h de estudo em Direito Administrativo', data: '2024-11-14 18:45', icon: '📖' },
      { tipo: 'predicao', texto: 'Confirmou predição: Licitações — Acertou!', data: '2024-11-13 12:15', icon: '✅' },
      { tipo: 'comunidade', texto: 'Entrou no grupo CEBRASPE — Analista Judiciário', data: '2024-11-12 09:30', icon: '👥' },
      { tipo: 'predicao', texto: 'Confirmou predição: Raciocínio Lógico — Errou', data: '2024-11-11 16:20', icon: '❌' },
      { tipo: 'estudo', texto: 'Gerou plano de estudos personalizado', data: '2024-11-10 10:00', icon: '🧠' },
    ],
  },
  u6: {
    id: 'u6',
    nome: 'Ricardo Mendes',
    avatar: 'RM',
    rank: 6,
    pontos: 8900,
    sequencia: 15,
    predicoesFeitas: 312,
    acuracia: 82,
    bancaFavorita: 'VUNESP',
    plano: 'Free',
    badges: [
      { icon: '🔥', nome: 'Sequência Iniciante', descricao: '15+ dias consecutivos' },
      { icon: '🎯', nome: 'Bom Previsor', descricao: '80%+ de acurácia' },
    ],
    atividade: [
      { tipo: 'predicao', texto: 'Confirmou predição: Competências Constitucionais — Acertou!', data: '2024-11-15 11:20', icon: '✅' },
      { tipo: 'estudo', texto: 'Completou 2h de estudo em Direito Civil', data: '2024-11-14 17:30', icon: '📖' },
    ],
  },
}

export default function CommunityProfile({ onMenuClick }) {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfile(MOCK_PROFILE[id] || MOCK_PROFILE.u1)
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [id])

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <span>Carregando perfil...</span>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="btn btn-icon btn-outline" onClick={onMenuClick}>☰</button>
          <Link to="/comunidade" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Voltar
          </Link>
        </div>
      </div>

      {/* Profile Header */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: profile.rank <= 3
              ? 'linear-gradient(135deg, var(--gold), var(--violet))'
              : 'var(--violet)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'white',
            flexShrink: 0,
          }}>
            {profile.avatar}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{profile.nome}</h2>
              <span className={`badge ${profile.rank === 1 ? 'badge-premium' : 'badge-free'}`}>
                #{profile.rank} Ranking
              </span>
              <span className={`badge ${profile.plano === 'Premium' ? 'badge-premium' : 'badge-free'}`}>
                {profile.plano}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Banca favorita: {profile.bancaFavorita}
            </div>
          </div>
          <AccuracyBadge value={profile.acuracia} size={90} />
        </div>
      </div>

      {/* Stats */}
      <div className="content-grid-4" style={{ marginBottom: 32 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold)' }}>{profile.pontos.toLocaleString('pt-BR')}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pontos</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--orange)' }}>🔥 {profile.sequencia}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sequência (dias)</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--cyan)' }}>{profile.predicoesFeitas}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Predições feitas</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--neon)' }}>{profile.acuracia}%</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Acurácia</div>
        </div>
      </div>

      {/* Badges */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-title">
          <span className="icon">🏅</span>
          Conquistas
        </div>
        <div className="content-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {profile.badges.map((badge, idx) => (
            <div key={idx} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>{badge.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', marginBottom: 4 }}>
                {badge.nome}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {badge.descricao}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <div className="section-title">
          <span className="icon">📋</span>
          Atividade Recente
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {profile.atividade.map((item, idx) => (
            <div key={idx} className="card" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{item.texto}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>
                    {new Date(item.data).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
