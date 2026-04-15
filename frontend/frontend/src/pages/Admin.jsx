import React, { useState, useEffect } from 'react'

const MOCK_METRICS = {
  totalUsers: 12450,
  premiumUsers: 1870,
  freeUsers: 10580,
  totalPredictions: 28470,
  avgAccuracy: 78.5,
  viralCoefficient: 1.8,
  feedbackVolume: 4827,
  predictionImprovement: 12.5,
  revenue: 46683,
  churnRate: 4.2,
}

const MOCK_PARTNERS = [
  { id: 'p1', nome: 'Estratégia Concursos', tipo: 'curso', usuarios: 3200, status: 'ativo', receitaMensal: 8500 },
  { id: 'p2', nome: 'Gran Cursos Online', tipo: 'curso', usuarios: 2800, status: 'ativo', receitaMensal: 7200 },
  { id: 'p3', nome: 'Editora Foco', tipo: 'material', usuarios: 1500, status: 'ativo', receitaMensal: 4200 },
  { id: 'p4', nome: 'CERS', tipo: 'curso', usuarios: 900, status: 'trial', receitaMensal: 0 },
]

const MOCK_LICENSES = [
  { id: 'l1', tipo: 'Predições por banca', preco: 2500, licencasVendidas: 8, receitaTotal: 20000 },
  { id: 'l2', tipo: 'Dataset de acurácia', preco: 5000, licencasVendidas: 3, receitaTotal: 15000 },
  { id: 'l3', tipo: 'API de predições', preco: 1500, licencasVendidas: 12, receitaTotal: 18000 },
  { id: 'l4', tipo: 'Relatórios personalizados', preco: 3500, licencasVendidas: 5, receitaTotal: 17500 },
]

const MOCK_FUNNEL = [
  { etapa: 'Visitantes do site', valor: 45000, percentual: 100, cor: 'violet' },
  { etapa: 'Criaram conta', valor: 12450, percentual: 27.7, cor: 'cyan' },
  { etapa: 'Iniciaram trial', valor: 3200, percentual: 7.1, cor: 'gold' },
  { etapa: 'Assinantes Premium', valor: 1870, percentual: 4.2, cor: 'neon' },
  { etapa: 'Premium há 3+ meses', valor: 1240, percentual: 2.8, cor: 'green' },
]

export default function Admin({ onMenuClick }) {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('metricas')
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [metrics, setMetrics] = useState(MOCK_METRICS)
  const [partners, setPartners] = useState(MOCK_PARTNERS)
  const [licenses, setLicenses] = useState(MOCK_LICENSES)
  const [funnel, setFunnel] = useState(MOCK_FUNNEL)
  const [showPartnerForm, setShowPartnerForm] = useState(false)
  const [newPartner, setNewPartner] = useState({ nome: '', tipo: 'curso', usuarios: '' })

  useEffect(() => {
    if (authenticated) {
      const timer = setTimeout(() => setLoading(false), 400)
      return () => clearTimeout(timer)
    }
  }, [authenticated])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === 'admin123') {
      setAuthenticated(true)
    }
  }

  const handleAddPartner = (e) => {
    e.preventDefault()
    const partner = {
      id: `p${partners.length + 1}`,
      nome: newPartner.nome,
      tipo: newPartner.tipo,
      usuarios: parseInt(newPartner.usuarios) || 0,
      status: 'trial',
      receitaMensal: 0,
    }
    setPartners([...partners, partner])
    setShowPartnerForm(false)
    setNewPartner({ nome: '', tipo: 'curso', usuarios: '' })
  }

  if (!authenticated) {
    return (
      <div className="page" style={{ maxWidth: 400, margin: '0 auto', paddingTop: 80 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚙️</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>Acesso Admin</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            Digite a senha de administrador
          </p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="password"
                className="form-input"
                placeholder="Senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ textAlign: 'center' }}
              />
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
              Entrar
            </button>
          </form>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 16 }}>
            Demo: senha = "admin123"
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <span>Carregando admin...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="btn btn-icon btn-outline" onClick={onMenuClick}>☰</button>
          <h1>⚙️ Admin</h1>
          <span className="badge badge-b2b">B2B</span>
        </div>
        <p>Painel administrativo — Métricas, B2B, Data Licensing e Funil</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'metricas' ? 'active' : ''}`} onClick={() => setActiveTab('metricas')}>
          📊 Métricas
        </button>
        <button className={`tab ${activeTab === 'b2b' ? 'active' : ''}`} onClick={() => setActiveTab('b2b')}>
          🤝 B2B
        </button>
        <button className={`tab ${activeTab === 'licensing' ? 'active' : ''}`} onClick={() => setActiveTab('licensing')}>
          📄 Data Licensing
        </button>
        <button className={`tab ${activeTab === 'funil' ? 'active' : ''}`} onClick={() => setActiveTab('funil')}>
          🔀 Funil
        </button>
        <button className={`tab ${activeTab === 'flywheel' ? 'active' : ''}`} onClick={() => setActiveTab('flywheel')}>
          ♻️ Flywheel
        </button>
      </div>

      {/* Métricas Tab */}
      {activeTab === 'metricas' && (
        <div>
          <div className="admin-metric-grid">
            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>Total de Usuários</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--cyan)' }}>{metrics.totalUsers.toLocaleString('pt-BR')}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--neon)' }}>Free: {metrics.freeUsers.toLocaleString('pt-BR')}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>Premium: {metrics.premiumUsers.toLocaleString('pt-BR')}</span>
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>Predições Geradas</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--neon)' }}>{metrics.totalPredictions.toLocaleString('pt-BR')}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>Acurácia Média</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold)' }}>{metrics.avgAccuracy}%</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>Coeficiente Viral</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--violet-light)' }}>{metrics.viralCoefficient}x</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>Acima de 1.0 = crescimento</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>Receita Mensal</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--neon)' }}>R$ {metrics.revenue.toLocaleString('pt-BR')}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>Churn Rate</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--red)' }}>{metrics.churnRate}%</div>
            </div>
          </div>

          {/* Premium Conversion */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Conversão Free → Premium</div>
            <div className="content-grid-3">
              <div style={{ textAlign: 'center' }}>
                <div className="progress-bar progress-bar-lg" style={{ marginBottom: 8 }}>
                  <div className="progress-bar-fill cyan" style={{ width: `${(metrics.premiumUsers / metrics.totalUsers) * 100}%` }} />
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {((metrics.premiumUsers / metrics.totalUsers) * 100).toFixed(1)}% dos usuários são Premium
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--gold)' }}>
                  R$ {((metrics.premiumUsers * 11.50)).toLocaleString('pt-BR')}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>MRR potencial (Premium only)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--cyan)' }}>
                  R$ {(metrics.revenue / metrics.premiumUsers).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>ARPU mensal</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B2B Tab */}
      {activeTab === 'b2b' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>
              <span className="icon">🤝</span>
              Parceiros B2B
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowPartnerForm(!showPartnerForm)}>
              {showPartnerForm ? '✕ Cancelar' : '+ Novo Parceiro'}
            </button>
          </div>

          {showPartnerForm && (
            <div className="card" style={{ marginBottom: 16, border: '1px solid var(--violet)' }}>
              <form onSubmit={handleAddPartner}>
                <div className="content-grid-3">
                  <div className="form-group">
                    <label className="form-label">Nome do parceiro</label>
                    <input
                      className="form-input"
                      placeholder="Ex: Estratégia Concursos"
                      value={newPartner.nome}
                      onChange={e => setNewPartner(prev => ({ ...prev, nome: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select
                      className="form-select"
                      value={newPartner.tipo}
                      onChange={e => setNewPartner(prev => ({ ...prev, tipo: e.target.value }))}
                    >
                      <option value="curso">Curso Online</option>
                      <option value="material">Material Didático</option>
                      <option value="editora">Editora</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Usuários estimados</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="1000"
                      value={newPartner.usuarios}
                      onChange={e => setNewPartner(prev => ({ ...prev, usuarios: e.target.value }))}
                    />
                  </div>
                </div>
                <button className="btn btn-neon btn-sm" type="submit">
                  Adicionar Parceiro
                </button>
              </form>
            </div>
          )}

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Parceiro</th>
                  <th>Tipo</th>
                  <th>Usuários</th>
                  <th>Status</th>
                  <th>Receita Mensal</th>
                </tr>
              </thead>
              <tbody>
                {partners.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.nome}</td>
                    <td><span className="badge badge-cyan">{p.tipo}</span></td>
                    <td>{p.usuarios.toLocaleString('pt-BR')}</td>
                    <td>
                      <span className={`badge ${p.status === 'ativo' ? 'badge-green' : 'badge-yellow'}`}>
                        {p.status === 'ativo' ? 'Ativo' : 'Trial'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--neon)' }}>
                      R$ {p.receitaMensal.toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data Licensing Tab */}
      {activeTab === 'licensing' && (
        <div>
          <div className="section-title">
            <span className="icon">📄</span>
            Data Licensing
          </div>

          <div className="content-grid-2" style={{ marginBottom: 24 }}>
            {licenses.map(lic => (
              <div key={lic.id} className="card">
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: 8 }}>
                  {lic.tipo}
                </div>
                <div className="content-grid-3" style={{ marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Preço/licença</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold)' }}>
                      R$ {lic.preco.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Licenças vendidas</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                      {lic.licencasVendidas}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Receita total</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--neon)' }}>
                      R$ {lic.receitaTotal.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill violet" style={{ width: `${(lic.licencasVendidas / 15) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.1))' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>Receita Total Data Licensing</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--neon)' }}>
              R$ {licenses.reduce((sum, l) => sum + l.receitaTotal, 0).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      )}

      {/* Funil Tab */}
      {activeTab === 'funil' && (
        <div>
          <div className="section-title">
            <span className="icon">🔀</span>
            Funil de Conversão
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {funnel.map((step, idx) => {
                const prevValor = idx > 0 ? funnel[idx - 1].valor : step.valor
                const dropOff = idx > 0 ? (((prevValor - step.valor) / prevValor) * 100).toFixed(1) : '—'

                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                      <div style={{ width: 200, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>
                        {step.etapa}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="progress-bar progress-bar-lg">
                          <div
                            className={`progress-bar-fill ${step.cor}`}
                            style={{ width: `${step.percentual}%` }}
                          />
                        </div>
                      </div>
                      <div style={{ minWidth: 120, textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontWeight: 800, color: 'var(--cyan)', fontSize: '0.95rem' }}>
                          {step.valor.toLocaleString('pt-BR')}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 6 }}>
                          ({step.percentual}%)
                        </span>
                      </div>
                      {dropOff !== '—' && (
                        <div style={{ minWidth: 80, textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--red)' }}>
                            -{dropOff}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="content-grid-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>Taxa de Conversão</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--neon)' }}>4.2%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Visitante → Premium</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>Trial → Premium</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold)' }}>58.4%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Dos trials que assinam</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>CAC Estimado</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--cyan)' }}>R$ 18,50</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Custo de aquisição</div>
            </div>
          </div>
        </div>
      )}

      {/* Flywheel Tab */}
      {activeTab === 'flywheel' && (
        <div>
          <div className="section-title">
            <span className="icon">♻️</span>
            Data Flywheel — Ciclo Virtuoso
          </div>

          <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 16, maxWidth: 500, margin: '0 auto' }}>
              Quanto mais usuários dão feedback sobre as predições, mais a IA melhora, o que gera predições melhores, que geram mais engajamento e feedback.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              <div className="card" style={{ padding: 16, minWidth: 120, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🎯</div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)' }}>Predições IA</div>
              </div>
              <span style={{ fontSize: '1.2rem', color: 'var(--violet)' }}>→</span>
              <div className="card" style={{ padding: 16, minWidth: 120, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🗳️</div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)' }}>Feedback Usuário</div>
              </div>
              <span style={{ fontSize: '1.2rem', color: 'var(--violet)' }}>→</span>
              <div className="card" style={{ padding: 16, minWidth: 120, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>📈</div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)' }}>Acurácia Melhora</div>
              </div>
              <span style={{ fontSize: '1.2rem', color: 'var(--violet)' }}>→</span>
              <div className="card" style={{ padding: 16, minWidth: 120, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>👥</div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)' }}>Mais Usuários</div>
              </div>
            </div>
          </div>

          <div className="admin-metric-grid">
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>Feedbacks Recebidos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--neon)' }}>
                {metrics.feedbackVolume.toLocaleString('pt-BR')}
              </div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>Acurácia Melhorada</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--cyan)' }}>
                +{metrics.predictionImprovement}%
              </div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>Predições Ajustadas</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--violet-light)' }}>
                342
              </div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>Engajamento Flywheel</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold)' }}>
                38.8%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>dos usuários dão feedback</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
