import React from 'react'

export default function Radar({ onMenuClick }) {
  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
        <button className="btn btn-icon btn-outline" onClick={onMenuClick} style={{ marginRight: 12 }}>☰</button>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>🚀 Radar</h1>
      </div>

      <div className="card card-glow" style={{ marginBottom: 24, borderLeft: '4px solid var(--violet)' }}>
        <div style={{ padding: '8px 0' }}>
          <h3 style={{ color: 'var(--violet)', marginBottom: 8 }}>O que é o Radar?</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            O Radar é o nosso sistema de monitoramento em tempo real. 
            Ele rastreia novos editais, retificações e tendências de cobrança das bancas antes mesmo de virarem notícia.
          </p>
        </div>
      </div>

      <div className="content-grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📡 Atividade Recente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="alert alert-info">Edital TJ-SP Publicado - Tendência VUNESP alta. (14/04)</div>
            <div className="alert alert-info">Novo tópico de Direito Administrativo em alta. (12/04)</div>
            <div className="alert alert-info">Banca FGV alterou perfil de cobrança em Português. (10/04)</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
          <h3 style={{ marginBottom: 8 }}>Assinatura Radar</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Tenha acesso total ao monitoramento por apenas R$ 3,00/mês.</p>
          <a 
            href="https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=52048695-45026c7b-d054-45ee-ba4a-448fb4865e13" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Ativar Radar (R$ 3,00)
          </a>
        </div>
      </div>
    </div>
  )
}
