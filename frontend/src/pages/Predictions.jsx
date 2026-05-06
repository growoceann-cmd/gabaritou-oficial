import { useState, useEffect } from 'react';
import { Brain, ThumbsUp, ThumbsDown, HelpCircle, Target, AlertTriangle, RefreshCw } from 'lucide-react';
import { getPredictions } from '../utils/api';

function getDifficultyBadge(difficulty) {
  switch (difficulty) {
    case 'Fácil': return 'badge-success';
    case 'Médio': return 'badge-warning';
    case 'Difícil': return 'badge-danger';
    default: return 'badge-neutral';
  }
}

function getAccuracyColor(accuracy) {
  if (accuracy >= 80) return 'var(--success)';
  if (accuracy >= 60) return 'var(--warning)';
  return 'var(--danger)';
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPredictions()
      .then((data) => setPredictions(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Erro ao carregar predições.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Carregando predições...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-header">
        <h1>Predições</h1>
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
                getPredictions()
                  .then((data) => setPredictions(Array.isArray(data) ? data : []))
                  .catch((err) => setError(err.message || 'Erro ao carregar predições.'))
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

  // Summary stats
  const totalAttempts = predictions.reduce((sum, p) => sum + (p.totalAttempts || 0), 0);
  const totalCorrect = predictions.reduce((sum, p) => sum + (p.correct || 0), 0);
  const overallAccuracy = totalAttempts > 0 ? ((totalCorrect / totalAttempts) * 100).toFixed(1) : 0;
  const totalPositive = predictions.reduce((sum, p) => sum + (p.feedback?.positive || 0), 0);
  const totalNegative = predictions.reduce((sum, p) => sum + (p.feedback?.negative || 0), 0);

  return (
    <>
      <div className="page-header">
        <h1>Predições</h1>
        <p>Tópicos e estatísticas de acerto das micro-sessões</p>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon emerald"><Brain size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Tópicos Ativos</div>
            <div className="stat-value">{predictions.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Target size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Total de Tentativas</div>
            <div className="stat-value">{totalAttempts.toLocaleString('pt-BR')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><ThumbsUp size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Feedback Positivo</div>
            <div className="stat-value">{totalPositive.toLocaleString('pt-BR')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rose"><HelpCircle size={20} /></div>
          <div className="stat-info">
            <div className="stat-label">Taxa de Acerto Geral</div>
            <div className="stat-value" style={{ color: getAccuracyColor(Number(overallAccuracy)) }}>
              {overallAccuracy}%
            </div>
          </div>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="card">
        <div className="card-header">
          <h3>Tópicos de Predição</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {predictions.length} tópicos
          </span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tópico</th>
                <th>Matéria</th>
                <th>Tentativas</th>
                <th>Acertos</th>
                <th>Taxa de Acerto</th>
                <th>Feedback</th>
                <th>Dificuldade</th>
              </tr>
            </thead>
            <tbody>
              {predictions.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <Brain size={32} />
                      <p>Nenhuma predição encontrada</p>
                    </div>
                  </td>
                </tr>
              ) : (
                predictions.map((pred) => {
                  const accuracy = pred.totalAttempts > 0
                    ? ((pred.correct / pred.totalAttempts) * 100).toFixed(1)
                    : 0;
                  return (
                    <tr key={pred.id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: 280 }}>
                        {pred.topic}
                      </td>
                      <td>
                        <span className="badge badge-info">{pred.subject}</span>
                      </td>
                      <td>{pred.totalAttempts?.toLocaleString('pt-BR')}</td>
                      <td>{pred.correct?.toLocaleString('pt-BR')}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: getAccuracyColor(Number(accuracy)) }}>
                          {accuracy}%
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                          <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <ThumbsUp size={12} /> {pred.feedback?.positive || 0}
                          </span>
                          <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <ThumbsDown size={12} /> {pred.feedback?.negative || 0}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getDifficultyBadge(pred.difficulty)}`}>
                          {pred.difficulty}
                        </span>
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
