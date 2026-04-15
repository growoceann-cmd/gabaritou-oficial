import React, { useState, useEffect } from 'react'

/**
 * Premium — Gabaritou v3.1 (12/04/2026)
 * Modelo 3-tier: Vitorioso R$7,90 | Combatente R$11,90 | Sniper R$19,90
 * Pagamentos: PIX + Cartão de Crédito Recorrente (Mercado Pago Pre-approval)
 */

const PLANS = [
  {
    id: 'vitorioso',
    name: 'Vitorioso',
    badge: '🏆',
    priceMonthly: 'R$ 7,90',
    priceLabel: 'R$ 7,90/mês',
    totalLabel: 'R$ 94,80/ano',
    cycleLabel: 'Cobrado anualmente',
    discount: '60% OFF',
    description: 'Compromisso anual — menor custo mensal do mercado',
    method: 'Cartão de Crédito Recorrente',
    featured: true,
    features: [
      { text: 'Todas as bancas', highlight: true },
      { text: 'Predições ilimitadas', highlight: true },
      { text: 'Relatórios de acurácia completos' },
      { text: 'Comunidade completa (ranking, desafios)' },
      { text: 'Prova Day — rastreamento em tempo real', highlight: true },
      { text: 'AI Tutor completo — plano personalizado', highlight: true },
      { text: 'Simulado adaptativo com IA', highlight: true },
      { text: 'Recomendação inteligente de estudos' },
      { text: 'Badges exclusivas Premium' },
      { text: 'Suporte prioritário' },
    ],
  },
  {
    id: 'combatente',
    name: 'Combatente',
    badge: '⚔️',
    priceMonthly: 'R$ 11,90',
    priceLabel: 'R$ 11,90/mês',
    totalLabel: 'R$ 71,40/semestre',
    cycleLabel: 'Cobrado semestralmente',
    discount: '40% OFF',
    description: 'Equilíbrio entre economia e flexibilidade',
    method: 'Cartão de Crédito Recorrente',
    featured: false,
    features: [
      { text: 'Todas as bancas', highlight: true },
      { text: 'Predições ilimitadas', highlight: true },
      { text: 'Relatórios de acurácia completos' },
      { text: 'Comunidade completa (ranking, desafios)' },
      { text: 'Prova Day — rastreamento em tempo real', highlight: true },
      { text: 'AI Tutor completo — plano personalizado', highlight: true },
      { text: 'Simulado adaptativo com IA', highlight: true },
      { text: 'Recomendação inteligente de estudos' },
      { text: 'Badges exclusivas Premium' },
      { text: 'Suporte prioritário' },
    ],
  },
  {
    id: 'sniper',
    name: 'Sniper',
    badge: '🎯',
    priceMonthly: 'R$ 19,90',
    priceLabel: 'R$ 19,90/mês',
    totalLabel: 'R$ 19,90/mês',
    cycleLabel: 'Sem compromisso',
    discount: null,
    description: 'Flexibilidade máxima — cancele quando quiser',
    method: 'PIX ou Cartão de Crédito',
    featured: false,
    features: [
      { text: 'Todas as bancas', highlight: true },
      { text: 'Predições ilimitadas', highlight: true },
      { text: 'Relatórios de acurácia completos' },
      { text: 'Comunidade completa (ranking, desafios)' },
      { text: 'Prova Day — rastreamento em tempo real', highlight: true },
      { text: 'AI Tutor completo — plano personalizado', highlight: true },
      { text: 'Simulado adaptativo com IA', highlight: true },
      { text: 'Recomendação inteligente de estudos' },
      { text: 'Badges exclusivas Premium' },
      { text: 'Suporte prioritário' },
    ],
  },
]

const MOCK_USER = {
  plano: 'free',
  dataExpiracao: null,
  limitePredicoes: 5,
  predicoesUsadas: 3,
  bancasDisponiveis: 1,
  bancasUsadas: 1,
}

export default function Premium({ onMenuClick }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(MOCK_USER)
  const [referralCount, setReferralCount] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('vitorioso')

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  const handleUpgrade = () => {
    setUser(prev => ({
      ...prev,
      plano: 'premium',
      dataExpiracao: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    }))
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 5000)
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  const isPremium = user.plano === 'premium'

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="btn btn-icon btn-outline" onClick={onMenuClick}>☰</button>
          <h1>💎 Premium</h1>
        </div>
        <p>A partir de R$7,90/mês — o plano mais acessível do mercado</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
          v3.1 — 12/04/2026 — PIX + Cartão de Crédito Recorrente
        </p>
      </div>

      {showSuccess && (
        <div className="toast toast-success" style={{ position: 'relative', marginBottom: 24 }}>
          🎉 Upgrade realizado! Seu trial de 3 dias grátis foi ativado!
        </div>
      )}

      {/* Current Plan */}
      <div className="card" style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>Seu plano atual</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 900, color: isPremium ? 'var(--gold)' : 'var(--text)' }}>
            {isPremium ? 'Premium ⭐' : 'Free'}
          </span>
          <span className={`badge ${isPremium ? 'badge-premium' : 'badge-free'}`}>
            {isPremium ? 'ATIVO' : 'GRÁTIS'}
          </span>
        </div>
        {isPremium && user.dataExpiracao && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Trial expira em: {new Date(user.dataExpiracao).toLocaleDateString('pt-BR')}
          </div>
        )}
      </div>

      {/* Pricing Info Banner */}
      <div className="card" style={{
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(124,58,237,0.08))',
        borderLeft: '3px solid var(--cyan)',
      }}>
        <div style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--cyan)' }}>3 Planos Disruptivos:</strong> O modelo foi redesenhado para capturar
          diferentes perfis de concurseiro. O cartão de crédito recorrente (Mercado Pago Pre-approval) minimiza
          a evasão por esquecimento e garante previsibilidade de receita. Cancele quando quiser, sem multa.
        </div>
      </div>

      {/* Pricing Cards — 3 Tiers */}
      <div className="content-grid-3" style={{ marginBottom: 32 }}>
        {PLANS.map(plan => (
          <div key={plan.id} className={`pricing-card ${plan.featured ? 'featured' : ''}`}>
            <div className="pricing-card-badge">{plan.badge} {plan.name}</div>
            <div className="pricing-card-price">
              {plan.priceMonthly} <span>/mês</span>
            </div>
            {plan.discount && (
              <div style={{
                fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700,
                marginBottom: 4, textTransform: 'uppercase',
              }}>
                {plan.discount}
              </div>
            )}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              {plan.totalLabel} — {plan.cycleLabel}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 12, fontStyle: 'italic' }}>
              {plan.description}
            </div>
            <div style={{
              fontSize: '0.72rem', padding: '4px 8px', borderRadius: 4,
              background: 'rgba(124,58,237,0.1)', color: 'var(--neon)',
              display: 'inline-block', marginBottom: 12,
            }}>
              {plan.method}
            </div>
            <div className="pricing-card-features">
              {plan.features.map((feat, idx) => (
                <div key={idx} className="pricing-card-feature">
                  <span className="check">✓</span> {feat.highlight ? <strong>{feat.text}</strong> : feat.text}
                </div>
              ))}
            </div>
            {isPremium ? (
              <button className="btn btn-neon" disabled style={{ width: '100%' }}>
                ✅ Você é Premium!
              </button>
            ) : (
              <button
                className={plan.featured ? 'btn btn-neon' : 'btn btn-primary'}
                style={{ width: '100%' }}
                onClick={() => { setSelectedPlan(plan.id); handleUpgrade() }}
              >
                {plan.featured ? '⚡ Mais Popular — Trial Grátis' : `Começar com ${plan.name}`}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Free Plan Comparison */}
      <div className="card" style={{ marginBottom: 32, opacity: 0.7 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 12, textAlign: 'center' }}>
          🌱 Free — Sem custo
        </div>
        <div className="content-grid-2">
          <div className="pricing-card-feature"><span className="check">✓</span> 1 banca disponível</div>
          <div className="pricing-card-feature"><span className="check">✓</span> 5 predições por semana</div>
          <div className="pricing-card-feature"><span className="check">✓</span> Relatórios de acurácia</div>
          <div className="pricing-card-feature"><span className="check">✓</span> Comunidade básica</div>
          <div className="pricing-card-feature"><span className="cross">✗</span> Prova Day</div>
          <div className="pricing-card-feature"><span className="cross">✗</span> AI Tutor completo</div>
          <div className="pricing-card-feature"><span className="cross">✗</span> Simulado adaptativo</div>
          <div className="pricing-card-feature"><span className="cross">✗</span> Todas as bancas</div>
        </div>
      </div>

      {/* Usage (Free) */}
      {!isPremium && (
        <div className="card" style={{ marginBottom: 32 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>📊 Seu uso esta semana</div>
          <div className="content-grid-2">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Predições</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
                  {user.predicoesUsadas}/{user.limitePredicoes}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill cyan"
                  style={{ width: `${(user.predicoesUsadas / user.limitePredicoes) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Bancas</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
                  {user.bancasUsadas}/{user.bancasDisponiveis}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill violet"
                  style={{ width: `${(user.bancasUsadas / user.bancasDisponiveis) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Program */}
      <div className="card" style={{ marginBottom: 32, background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(251,191,36,0.1))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: '3rem' }}>🎁</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)', marginBottom: 4 }}>
              Programa de Indicação
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Convide 3 amigos e ganhe <strong style={{ color: 'var(--gold)' }}>1 mês grátis</strong> de Premium!
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="progress-bar" style={{ flex: 1, maxWidth: 200 }}>
                <div
                  className="progress-bar-fill gold"
                  style={{ width: `${(referralCount / 3) * 100}%` }}
                />
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
                {referralCount}/3
              </span>
            </div>
          </div>
          <button className="btn btn-primary">
            📤 Convidar Amigos
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <div className="section-title">
          <span className="icon">❓</span>
          Perguntas Frequentes
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { q: 'Posso cancelar a qualquer momento?', a: 'Sim! Todos os planos Premium podem ser cancelados a qualquer momento sem multa. Você continua tendo acesso até o final do período pago. O plano anual (Vitorioso) permite cancelamento com reembolso proporcional nos primeiros 30 dias.' },
            { q: 'Como funciona o trial de 3 dias?', a: 'Você recebe acesso completo a todas as funcionalidades Premium por 3 dias, sem necessidade de cartão de crédito. Se não cancelar, pode escolher qualquer um dos 3 planos.' },
            { q: 'Qual a diferença entre os 3 planos?', a: 'Vitorioso (R$7,90/mês no plano anual) é o mais barato — ideal para quem está comprometido. Combatente (R$11,90/mês no semestral) é o equilíbrio. Sniper (R$19,90/mês) é sem compromisso, flexibilidade total.' },
            { q: 'Como funciona o cartão de crédito recorrente?', a: 'O Mercado Pago Pre-approval agenda cobranças automáticas no seu cartão. Você não precisa lembrar de pagar todo mês. Pode cancelar a qualquer momento direto no bot ou pelo app do Mercado Pago.' },
            { q: 'Quais formas de pagamento são aceitas?', a: 'PIX (qualquer plano) e Cartão de Crédito Recorrente (Vivo, Mastercard, Elo). O cartão recorrente é obrigatório para os planos Vitorioso e Combatente. O Sniper aceita PIX ou cartão.' },
            { q: 'O Prova Day está incluído no Premium?', a: 'Sim! O Prova Day completo está incluso em todos os planos Premium (Vitorioso, Combatente e Sniper).' },
          ].map((faq, idx) => (
            <FAQItem key={idx} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>

      {/* Footer version info */}
      <div style={{ textAlign: 'center', marginTop: 32, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        Gabaritou v3.1 — 12/04/2026 — BeConfident + Groq-Engine
      </div>
    </div>
  )
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="expandable">
      <button className="expandable-header" onClick={() => setOpen(!open)}>
        {question}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{open ? '▲' : '▼'}</span>
      </button>
      <div className={`expandable-content ${open ? 'open' : ''}`}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {answer}
        </p>
      </div>
    </div>
  )
}
