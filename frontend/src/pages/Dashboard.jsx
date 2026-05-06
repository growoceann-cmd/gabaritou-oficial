import { useState, useEffect } from 'react';
import {
  Users,
  Crown,
  DollarSign,
  Zap,
  Target,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { getStats } from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStats()
      .then((data) => setStats(data))
      .catch((err) => setError(err.message || 'Erro ao carregar dados do dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Carregando dados...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-header">
        <h1>Dashboard</h1>
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
                getStats()
                  .then((data) => setStats(data))
                  .catch((err) => setError(err.message || 'Erro ao carregar dados do dashboard.'))
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

  if (!stats) return null;

  const maxSessions = Math.max(...(stats.weeklySessions || []).map((d) => d.count), 0);

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Visão geral do bot Gabaritou v3</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          icon={Users}
          label="Total de Usuários"
          value={stats.totalUsers?.toLocaleString('pt-BR')}
          trend={stats.trends?.users}
          color="emerald"
        />
        <StatsCard
          icon={Crown}
          label="Usuários Premium"
          value={stats.premiumUsers?.toLocaleString('pt-BR')}
          trend={stats.trends?.premium}
          color="amber"
        />
        <StatsCard
          icon={DollarSign}
          label="Receita Mensal"
          value={`R$ ${(stats.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={stats.trends?.revenue}
          color="blue"
        />
        <StatsCard
          icon={Zap}
          label="Micro-sessões Hoje"
          value={stats.sessionsToday?.toLocaleString('pt-BR')}
          trend={stats.trends?.sessions}
          color="cyan"
        />
        <StatsCard
          icon={Target}
          label="Taxa de Acerto Média"
          value={`${stats.avgAccuracy}%`}
          trend={stats.trends?.accuracy}
          color="rose"
        />
        <StatsCard
          icon={TrendingUp}
          label="Nível Adaptativo Médio"
          value={stats.avgAdaptiveLevel?.toFixed(1)}
          color="purple"
        />
      </div>

      {/* Weekly Sessions Chart */}
      {stats.weeklySessions && stats.weeklySessions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={16} />
              Micro-sessões por Dia
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Últimos 7 dias</span>
          </div>
          <div className="card-body">
            <div className="bar-chart">
              {stats.weeklySessions.map((item, index) => {
                const height = maxSessions > 0 ? (item.count / maxSessions) * 100 : 0;
                const isToday = index === stats.weeklySessions.length - 1;

                return (
                  <div key={item.day} className="bar-chart-item">
                    <span className="bar-chart-value">{item.count}</span>
                    <div
                      className={`bar-chart-bar${isToday ? ' today' : ''}`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="bar-chart-label">{item.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
