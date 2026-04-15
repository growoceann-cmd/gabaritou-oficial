import React from 'react'

export default function LeaderboardTable({ data, currentUserId }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🏆</div>
        <div className="empty-state-title">Nenhum dado disponível</div>
        <div className="empty-state-text">O ranking aparecerá aqui quando houver participantes.</div>
      </div>
    )
  }

  const positionIcons = ['🥇', '🥈', '🥉']

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>Pos.</th>
            <th>Nome</th>
            <th>Pontos</th>
            <th>Acurácia</th>
            <th>Banca Favorita</th>
          </tr>
        </thead>
        <tbody>
          {data.map((user, idx) => {
            const isTop3 = idx < 3
            const isCurrentUser = currentUserId && user.id === currentUserId

            return (
              <tr
                key={user.id || idx}
                className={`
                  ${isTop3 ? `leaderboard-row-${idx + 1}` : ''}
                  ${isCurrentUser ? 'highlight' : ''}
                `}
              >
                <td style={{ fontWeight: 700, textAlign: 'center' }}>
                  {isTop3 ? (
                    <span style={{ fontSize: '1.2rem' }}>{positionIcons[idx]}</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>#{idx + 1}</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isCurrentUser ? 'var(--violet)' : 'var(--card-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      color: isCurrentUser ? 'white' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}>
                      {user.nome ? user.nome.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {user.nome || 'Anônimo'}
                        {isCurrentUser && (
                          <span className="badge badge-violet" style={{ marginLeft: 8 }}>Você</span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 800, color: 'var(--gold)' }}>
                    {user.pontos?.toLocaleString('pt-BR') || 0}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: user.acuracia >= 75 ? 'var(--neon)' : user.acuracia >= 50 ? 'var(--gold)' : 'var(--red)' }}>
                    {user.acuracia || 0}%
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  {user.bancaFavorita || '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
