import React, { useState } from 'react'

export default function Settings({ onMenuClick }) {
  const [banca, setBanca] = useState('VUNESP')
  const [cargo, setCargo] = useState('Analista Judiciário')
  const [notificacoes, setNotificacoes] = useState(true)

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-menu" onClick={onMenuClick}>☰</button>
        <h1 className="page-title">⚙️ Configurações</h1>
      </div>

      <div className="card">
        <h3>🎯 Seu Perfil de Estudo</h3>
        <div className="form-group">
          <label>Banca Alvo</label>
          <select value={banca} onChange={e => setBanca(e.target.value)}>
            {['VUNESP', 'FGV', 'FCC', 'CEBRASPE'].map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Cargo Alvo</label>
          <input value={cargo} onChange={e => setCargo(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <h3>🔔 Notificações</h3>
        <div className="switch-group">
          <span>Receber avisos de micro-sessões</span>
          <button className={`btn btn-sm ${notificacoes ? 'btn-primary' : 'btn-outline'}`} onClick={() => setNotificacoes(!notificacoes)}>
            {notificacoes ? 'LIGADO' : 'DESLIGADO'}
          </button>
        </div>
      </div>

      <button className="btn btn-primary" style={{ width: '100%' }}>💾 Salvar Alterações</button>
    </div>
  )
}
