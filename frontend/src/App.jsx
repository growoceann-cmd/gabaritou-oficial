import { Routes, Route, Navigate, useState } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Predictions from './pages/Predictions';
import Payments from './pages/Payments';
import Config from './pages/Config';

/**
 * Auth guard: redirects to /login if no admin_secret is configured.
 * In production, this would validate the secret against the backend.
 */
function AuthGuard({ children }) {
  const secret = localStorage.getItem('admin_secret');

  if (!secret) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary, #0a0015)',
        color: 'var(--text-primary, #fff)',
        fontFamily: 'Inter, sans-serif',
        gap: 16,
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>🔒 Acesso Restrito</h1>
        <p style={{ color: 'var(--text-muted, #888)', fontSize: 14 }}>
          Insira a chave de administrador para acessar o painel.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = e.target.elements.secret.value?.trim();
            if (val) {
              localStorage.setItem('admin_secret', val);
              window.location.reload();
            }
          }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input
            name="secret"
            type="password"
            placeholder="Chave de administrador"
            required
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid var(--border, #333)',
              background: 'var(--bg-input, #1a1a2e)',
              color: '#fff',
              fontSize: 14,
              width: 280,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent, #7c3aed)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <AuthGuard>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/usuarios" element={<Users />} />
            <Route path="/predicoes" element={<Predictions />} />
            <Route path="/pagamentos" element={<Payments />} />
            <Route path="/config" element={<Config />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthGuard>
  );
}
