import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';

const LS_NEW_ISSUES = 'oaq_new_issue_count';

export default function Topbar({ view, onViewChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { connected, socket } = useSocket();
  const [newIssueCount, setNewIssueCount] = useState(0);

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(LS_NEW_ISSUES) || '0', 10);
    if (stored > 0) setNewIssueCount(stored);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      const current = newIssueCount;
      const next = current + 1;
      setNewIssueCount(next);
      localStorage.setItem(LS_NEW_ISSUES, String(next));
    };
    socket.on('issue:created', handler);
    return () => socket.off('issue:created', handler);
  }, [socket, newIssueCount]);

  const getViewFromPath = (pathname) => {
    if (pathname === '/') return 'oaq';
    return pathname.slice(1);
  };

  const currentView = view || getViewFromPath(location.pathname);

  const handleNavigate = (key) => {
    const path = key === 'oaq' ? '/' : `/${key}`;
    localStorage.setItem('lastRoute', path);
    onViewChange(key);
    if (key === 'tracker') {
      setNewIssueCount(0);
      localStorage.setItem(LS_NEW_ISSUES, '0');
    }
  };

  return (
    <>
      {!connected && (
        <div style={{ background: '#F59E0B', color: '#fff', textAlign: 'center', padding: '6px 12px', fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
          ⚡ Reconnecting... (live updates paused)
        </div>
      )}
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
          ['tracker', 'Tracker', newIssueCount],
          ['sp', 'SP Wallet'],
          ...((user?.role === 'admin' || user?.role === 'superadmin') ? [['admin', 'Admin']] : [])
        ].map(([key, label, badge]) => (
          <button
            key={key}
            className="btn btn-sm"
            style={{ background: currentView === key ? 'var(--color-invert-bg)' : 'transparent', color: currentView === key ? 'var(--color-invert-text)' : 'var(--color-text-secondary)', borderColor: 'var(--color-border)', position: 'relative' }}
            onClick={() => handleNavigate(key)}
          >
            {label}
            {badge && badge > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--color-red)', color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', fontFamily: 'var(--font-mono)' }}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
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
    </>
  );
}
