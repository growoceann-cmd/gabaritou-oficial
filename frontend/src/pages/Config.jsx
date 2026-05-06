import { useState, useEffect } from 'react';
import { Settings, Tag, Timer, Zap, Brain, BarChart3, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { getConfig } from '../utils/api';

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft(targetDate));

  function calcTimeLeft(date) {
    if (!date) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    const diff = new Date(date) - new Date();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  );
}

export default function ConfigPage() {
  const [config, setConfig] = useState(null);
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getConfig()
      .then((data) => {
        setConfig(data);
        setFeatures(data.features || {});
      })
      .catch((err) => setError(err.message || 'Erro ao carregar configurações.'))
      .finally(() => setLoading(false));
  }, []);

  const countdown = useCountdown(config?.launchEnd);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Carregando configurações...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-header">
        <h1>Configurações</h1>
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
                getConfig()
                  .then((data) => {
                    setConfig(data);
                    setFeatures(data.features || {});
                  })
                  .catch((err) => setError(err.message || 'Erro ao carregar configurações.'))
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

  if (!config) return null;

  const featureLabels = {
    microSessions: { label: 'Micro-sessões', desc: 'Questões rápidas em formato de micro-sessões', icon: Zap },
    adaptiveDifficulty: { label: 'Dificuldade Adaptativa', desc: 'Ajusta a dificuldade conforme o desempenho do usuário', icon: Brain },
    streakSystem: { label: 'Sistema de Streak', desc: 'Recompensa usuários por sequência de dias ativos', icon: Timer },
    predictions: { label: 'Predições de Vestibular', desc: 'Geração de predições baseadas em padrões de provas', icon: BarChart3 },
    detailedFeedback: { label: 'Feedback Detalhado', desc: 'Explicações completas após cada resposta', icon: Shield },
    proMode: { label: 'Modo PRO', desc: 'Funcionalidades avançadas para usuários premium (em breve)', icon: Settings },
  };

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <>
      <div className="page-header">
        <h1>Configurações</h1>
        <p>Gerenciar preços, recursos e parâmetros do bot</p>
      </div>

      {/* Pricing */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag size={16} />
            Preços
          </h3>
        </div>
        <div className="card-body">
          <div className="config-row">
            <div className="config-label">
              <span>Preço de Lançamento</span>
              <span>Valor promocional durante o período de lançamento</span>
            </div>
            <span className="config-value">R$ {(config.pricing?.launch || 0).toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="config-row">
            <div className="config-label">
              <span>Preço Regular</span>
              <span>Valor padrão após o período de lançamento</span>
            </div>
            <span className="config-value muted">R$ {(config.pricing?.regular || 0).toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </div>

      {/* Launch Countdown */}
      {config.launchEnd && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Timer size={16} />
              Período de Lançamento
            </h3>
            <span className={`badge ${countdown.expired ? 'badge-danger' : 'badge-success'}`}>
              {countdown.expired ? 'Encerrado' : 'Ativo'}
            </span>
          </div>
          <div className="card-body">
            {countdown.expired ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                O período de lançamento promocional encerrou. O preço regular está em vigor.
              </p>
            ) : (
              <>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
                  Preço promocional de R$ {(config.pricing?.launch || 0).toFixed(2).replace('.', ',')} válido até:
                </p>
                <div className="countdown">
                  <div className="countdown-item">
                    <div className="countdown-number">{pad(countdown.days)}</div>
                    <div className="countdown-text">Dias</div>
                  </div>
                  <div className="countdown-item">
                    <div className="countdown-number">{pad(countdown.hours)}</div>
                    <div className="countdown-text">Horas</div>
                  </div>
                  <div className="countdown-item">
                    <div className="countdown-number">{pad(countdown.minutes)}</div>
                    <div className="countdown-text">Min</div>
                  </div>
                  <div className="countdown-item">
                    <div className="countdown-number">{pad(countdown.seconds)}</div>
                    <div className="countdown-text">Seg</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Feature Toggles */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} />
            Recursos do Bot
          </h3>
        </div>
        <div className="card-body">
          {Object.entries(featureLabels).map(([key, { label, desc, icon: FeatureIcon }]) => (
            <div key={key} className="config-row">
              <div className="config-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FeatureIcon size={14} style={{ color: 'var(--text-muted)' }} />
                  {label}
                </span>
                <span>{desc}</span>
              </div>
              <Toggle
                checked={!!features[key]}
                onChange={(checked) =>
                  setFeatures((prev) => ({ ...prev, [key]: checked }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bot Info */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={16} />
            Informações do Sistema
          </h3>
        </div>
        <div className="card-body">
          <div className="config-row">
            <div className="config-label">
              <span>Versão</span>
              <span>Versão atual do bot</span>
            </div>
            <span className="config-value muted">{config.bot?.version || '3.0.0'}</span>
          </div>
          <div className="config-row">
            <div className="config-label">
              <span>Status</span>
              <span>Status atual do serviço</span>
            </div>
            <span className={`badge ${(config.bot?.status || 'online') === 'online' ? 'badge-success' : 'badge-danger'}`}>
              ● {(config.bot?.status || 'online') === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="config-row">
            <div className="config-label">
              <span>Uptime</span>
              <span>Disponibilidade nos últimos 30 dias</span>
            </div>
            <span className="config-value">{config.bot?.uptime || '99.8%'}</span>
          </div>
        </div>
      </div>
    </>
  );
}
