import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Topbar({ view, onViewChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  const getViewFromPath = (pathname) => {
    if (pathname === '/') return 'oaq';
    return pathname.slice(1);
  };

  const currentView = view || getViewFromPath(location.pathname);

  const handleNavigate = (key) => {
    const path = key === 'oaq' ? '/' : `/${key}`;
    localStorage.setItem('lastRoute', path);
    onViewChange(key);
  };

  return (
    <header className="topbar" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
      <div className="topbar-brand">
        <button onClick={() => handleNavigate('oaq')} style={{ color: 'var(--color-text-primary)', fontWeight: 700, letterSpacing: '0.08em' }}>
          VICHARANASHALA <span>/</span> OAQ
        </button>
      </div>
      <div className="topbar-actions">
        <span className="topbar-user" style={{ color: 'var(--color-text-secondary)' }}>
          {user?.name || user?.email || 'User'} / {(user?.role || 'intern').toUpperCase()}
        </span>
        {[
          ['oaq', 'OAQ'],
          ['threads', 'Threads'],
          ['tracker', 'Tracker'],
          ['sp', 'SP Wallet'],
          ...((user?.role === 'admin' || user?.role === 'superadmin') ? [['admin', 'Admin']] : [])
        ].map(([key, label]) => (
          <button
            key={key}
            className="btn btn-sm"
            style={{ background: currentView === key ? 'var(--color-invert-bg)' : 'transparent', color: currentView === key ? 'var(--color-invert-text)' : 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
            onClick={() => handleNavigate(key)}
          >
            {label}
          </button>
        ))}
        <button onClick={toggle} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '6px 10px', cursor: 'pointer', fontSize: 14, color: 'var(--color-text-primary)' }}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button className="btn btn-sm" style={{ background: 'var(--color-invert-bg)', color: 'var(--color-invert-text)', borderColor: 'var(--color-invert-bg)' }} onClick={logout}>
          Sign Out
        </button>
      </div>
    </header>
  );
}
