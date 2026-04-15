import React from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/plano', label: 'Plano de Estudos', icon: '📋' },
  { path: '/predicoes', label: 'Predições', icon: '🎯' },
  { path: '/acuracia', label: 'Acurácia', icon: '📈' },
  { path: '/comunidade', label: 'Comunidade', icon: '👥' },
  { path: '/tutor', label: 'AI Tutor', icon: '🧠' },
  { path: '/prova-day', label: 'Prova Day', icon: '⚡' },
  { path: '/simulado', label: 'Simulado', icon: '🎯' },
  { path: '/radar', label: 'Radar Elite', icon: '🚀' },
  { path: '/gps', label: 'GPS Aprovação', icon: '🛰️' },
  { path: '/mapa-mental', label: 'Mapa Mental', icon: '🧠' },
  { path: '/premium', label: 'Premium', icon: '💎' },
  { path: '/admin', label: 'Admin', icon: '🛡️' },
  { path: '/configuracoes', label: 'Configurar', icon: '⚙️' },
  { path: '/privacidade', label: 'Privacidade', icon: '🔒' },
]

export default function Sidebar({ isOpen, onClose }) {
  const userName = 'Concurseiro'
  const userPlan = 'Free'
  const userInitials = 'C'

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <span className="logo-icon">🎯</span>
        <span className="logo-text">Gabaritou</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={onClose}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.path === '/prova-day' && (
              <span className="nav-badge badge-premium">PRO</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-avatar">{userInitials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{userName}</div>
          <div className="sidebar-user-plan">
            <span className="badge badge-free">{userPlan}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
