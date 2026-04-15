import React from 'react'

export default function GPSAprovacao({ onMenuClick }) {
  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
        <button className="btn btn-icon btn-outline" onClick={onMenuClick} style={{ marginRight: 12 }}>☰</button>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>🛰️ GPS de Aprovação</h1>
      </div>

      <div className="card card-glow" style={{ marginBottom: 24, borderLeft: '4px solid var(--violet)' }}>
        <div style={{ padding: '8px 0' }}>
          <h3 style={{ color: 'var(--violet)', marginBottom: 8 }}>Auditoria de Edital com IA</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            O GPS de Aprovação analisa o edital e cruza com a tendência histórica da banca.
            O resultado é um plano cirúrgico: o que você deve focar e o que pode ignorar.
          </p>
        </div>
      </div>

      <div className="content-grid-2">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📊</div>
          <h3 style={{ marginBottom: 8 }}>Gerar Auditoria GPS</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Liberte sua auditoria de edital personalizada por R$ 2,00.</p>
          <a 
            href="https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=52048695-a869ac0e-f7f6-49b2-a493-58fd4437cb6e" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Pagar R$ 2,00 no Mercado Pago
          </a>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📑 Suas Auditorias</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontWeight: 700 }}>TJ-SP (VUNESP) — 2026</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Gerado em: 14/04/2026</div>
              <button className="btn btn-sm btn-outline" style={{ marginTop: 8 }}>Visualizar PDF</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
