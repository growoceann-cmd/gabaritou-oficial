import React from 'react'

export default function Privacy({ onMenuClick }) {
  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-menu" onClick={onMenuClick}>☰</button>
        <h1 className="page-title">🔒 Privacidade</h1>
      </div>

      <div className="card">
        <h3>🛡️ Seus Dados</h3>
        <p>No Gabaritou, levamos sua privacidade a sério. Seus dados são usados apenas para personalizar sua experiência de aprendizado.</p>
        <div style={{ marginTop: 24 }}>
          <button className="btn btn-outline" style={{ width: '100%' }}>📥 Exportar Meus Dados (JSON)</button>
          <button className="btn btn-danger" style={{ width: '100%', marginTop: 12 }}>❌ Excluir Minha Conta</button>
        </div>
      </div>

      <div className="card">
        <h3>📜 Termos de Uso</h3>
        <p>Ao utilizar o Gabaritou, você concorda com nossos termos de uso e política de privacidade. O uso indevido da plataforma pode resultar em suspensão do acesso.</p>
        <a href="#" className="btn-link">Ver Termos Completos</a>
      </div>
    </div>
  )
}
