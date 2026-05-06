import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Brain,
  CreditCard,
  Settings,
  Activity,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/usuarios', label: 'Usuários', icon: Users },
  { to: '/predicoes', label: 'Predições', icon: Brain },
  { to: '/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { to: '/config', label: 'Config', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">G</div>
        <div className="brand-text">
          <span className="brand-name">Gabaritou</span>
          <span className="brand-version">v3 — Admin</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={12} />
          <span>Sistema operacional</span>
        </div>
      </div>
    </aside>
  );
}
