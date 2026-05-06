import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { getPayments } from '../utils/api';

function getStatusBadge(status) {
  switch (status) {
    case 'confirmed':
    case 'approved': return { class: 'badge-success', label: 'Confirmado', icon: CheckCircle };
    case 'pending': return { class: 'badge-warning', label: 'Pendente', icon: Clock };
    case 'failed':
    case 'rejected': return { class: 'badge-danger', label: 'Falhou', icon: XCircle };
    case 'refunded':
    case 'cancelled': return { class: 'badge-info', label: 'Estornado', icon: DollarSign };
    default: return { class: 'badge-neutral', label: status, icon: Clock };
  }
}

function getMethodLabel(method) {
  switch (method) {
    case 'pix': return 'PIX';
    case 'credit_card': return 'Cartão';
    case 'boleto': return 'Boleto';
    default: return method;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getPayments()
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Erro ao carregar pagamentos.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter((p) =>
    filter === 'all' ? true : p.status === filter
  );

  // Summary
  const confirmed = payments.filter((p) => p.status === 'confirmed' || p.status === 'approved');
  const totalRevenue = confirmed.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingCount = payments.filter((p) => p.status === 'pending').length;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Carregando pagamentos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-header">
        <h1>Pagamentos</h1>
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
                getPayments()
                  .then((data) => setPayments(Array.isArray(data) ? data : []))
                  .catch((err) => setError(err.message || 'Erro ao carregar pagamentos.'))
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
        <h1>Pagamentos</h1>
        <p>Histórico de transações e assinaturas</p>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon emerald"><CreditCard size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Transações</div>
            <div className="stat-value">{payments.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><DollarSign size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Receita Confirmada</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Clock size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Pendentes</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{pendingCount}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[
          { key: 'all', label: 'Todos' },
          { key: 'confirmed', label: 'Confirmados' },
          { key: 'approved', label: 'Aprovados' },
          { key: 'pending', label: 'Pendentes' },
          { key: 'failed', label: 'Falhados' },
          { key: 'rejected', label: 'Rejeitados' },
          { key: 'refunded', label: 'Estornados' },
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

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Usuário</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Método</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <CreditCard size={32} />
                      <p>Nenhum pagamento encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((payment) => {
                  const statusInfo = getStatusBadge(payment.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <tr key={payment.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {payment.id}
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {payment.user}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        R$ {payment.amount?.toFixed(2).replace('.', ',')}
                      </td>
                      <td>
                        <span
                          className={`badge ${statusInfo.class}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>{getMethodLabel(payment.method)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {formatDate(payment.date || payment.created_at)}
                      </td>
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
