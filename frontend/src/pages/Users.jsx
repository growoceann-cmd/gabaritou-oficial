import { useState, useEffect } from 'react';
import { Search, Users as UsersIcon, AlertTriangle, RefreshCw } from 'lucide-react';
import { getUsers } from '../utils/api';

function formatLastActive(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 5) return 'Agora';
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString('pt-BR');
}

function getAdaptiveBadge(level) {
  if (level >= 4) return { class: 'badge-success', label: `Nv ${level}` };
  if (level >= 3) return { class: 'badge-info', label: `Nv ${level}` };
  if (level >= 2) return { class: 'badge-warning', label: `Nv ${level}` };
  return { class: 'badge-neutral', label: `Nv ${level}` };
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getUsers()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Erro ao carregar usuários.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      String(u.id).includes(search);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'premium' && u.plan === 'premium') ||
      (filter === 'free' && u.plan !== 'premium');
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Carregando usuários...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-header">
        <h1>Usuários</h1>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: '40px 20px',
            color: 'var(--text-secondary)',
          }}>
            <AlertTriangle size={32} style={{ color: 'var(--danger, #e74c3c)' }} />
            <p style={{ fontSize: 14 }}>{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                getUsers()
                  .then((data) => setUsers(Array.isArray(data) ? data : []))
                  .catch((err) => setError(err.message || 'Erro ao carregar usuários.'))
                  .finally(() => setLoading(false));
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--accent)',
                background: 'var(--accent-muted)',
                color: 'var(--accent)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RefreshCw size={14} /> Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Usuários</h1>
        <p>{users.length} usuários cadastrados</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Buscar por nome ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { key: 'all', label: 'Todos' },
              { key: 'premium', label: 'Premium' },
              { key: 'free', label: 'Grátis' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius)',
                  border:
                    filter === f.key
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border)',
                  background:
                    filter === f.key ? 'var(--accent-muted)' : 'transparent',
                  color: filter === f.key ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Plano</th>
                <th>Nível Adaptativo</th>
                <th>Streak</th>
                <th>Última Atividade</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <UsersIcon size={32} />
                      <p>Nenhum usuário encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const levelBadge = getAdaptiveBadge(user.adaptiveLevel);
                  return (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: 'var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 600,
                              color: 'var(--text-secondary)',
                              flexShrink: 0,
                            }}
                          >
                            {(user.name?.charAt(0) || '?')}
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                              {user.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${user.plan === 'premium' ? 'badge-warning' : 'badge-neutral'}`}
                        >
                          {user.plan === 'premium' ? '👑 Premium' : 'Grátis'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${levelBadge.class}`}>
                          {levelBadge.label}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color: user.streak >= 7 ? 'var(--warning)' : 'var(--text-secondary)',
                          }}
                        >
                          {user.streak} {user.streak === 1 ? 'dia' : 'dias'}
                        </span>
                      </td>
                      <td>{formatLastActive(user.lastActive)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
