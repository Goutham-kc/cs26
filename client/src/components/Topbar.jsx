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
  const [showHelpModal, setShowHelpModal] = useState(false);

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
            {badge > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--color-red)', color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', fontFamily: 'var(--font-mono)' }}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </button>
        ))}
        <button onClick={toggle} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '6px 10px', cursor: 'pointer', fontSize: 14, color: 'var(--color-text-primary)' }}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button 
          onClick={() => setShowHelpModal(true)} 
          title="Platform Guide & Workflows" 
          style={{ 
            background: 'none', 
            border: '1px solid var(--color-border)', 
            borderRadius: 'var(--radius)', 
            padding: '6px 10px', 
            cursor: 'pointer', 
            fontSize: 14, 
            color: 'var(--color-text-primary)' 
          }}
        >
          ❓
        </button>
        <button className="btn btn-sm" style={{ background: 'var(--color-invert-bg)', color: 'var(--color-invert-text)', borderColor: 'var(--color-invert-bg)' }} onClick={logout}>
          Sign Out
        </button>
      </div>
    </header>

    {showHelpModal && (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowHelpModal(false)}>
        <div className="modal" style={{ maxWidth: 600, maxHeight: '85vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform Guide & Workflows</h3>
            <button onClick={() => setShowHelpModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-muted)', padding: 0 }}>×</button>
          </div>
          
          <div style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
            
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-teal-dark)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>1. Core Workflow</h4>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Raise Query (+10 SP) ➔ Community Answers (+5 SP FCFS) ➔ Upvotes / Quality Audit ➔ Resolution (+50 SP on Promotion).
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-teal-dark)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>2. User Roles</h4>
              <ul style={{ paddingLeft: 16, color: 'var(--color-text-secondary)' }}>
                <li><strong>Interns</strong>: Ask questions, reply to others, view wallet SP & leaderboard rankings.</li>
                <li><strong>Mentors</strong>: Answer queries, flag/promote replies, sign off.</li>
                <li><strong>Admins</strong>: Manage issues/users, promote replies to resolve queries, or submit custom resolution answers.</li>
              </ul>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-teal-dark)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>3. SP Gamification Rules</h4>
              <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Action</th>
                      <th style={{ textAlign: 'center', padding: '6px 10px', fontWeight: 600 }}>SP Value</th>
                      <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Recipient</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '6px 10px' }}>Raise unique query</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: 'var(--color-teal-dark)' }}>+10</td>
                      <td style={{ padding: '6px 10px' }}>Query Creator</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '6px 10px' }}>Submit reply (FCFS)</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: 'var(--color-teal-dark)' }}>+5</td>
                      <td style={{ padding: '6px 10px' }}>Replier</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '6px 10px' }}>Reply promoted to answer</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: 'var(--color-teal-dark)' }}>+50</td>
                      <td style={{ padding: '6px 10px' }}>Replier</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '6px 10px' }}>Query upvoted by peer</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: 'var(--color-teal-dark)' }}>+5</td>
                      <td style={{ padding: '6px 10px' }}>Query Creator</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 10px' }}>Yaksha Audit Rejection</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 600, color: 'var(--color-red)' }}>-20</td>
                      <td style={{ padding: '6px 10px' }}>Replier</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-teal-dark)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>4. Yaksha Audit Quality Control</h4>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                All replies are audited: replies must be relevant, at least 20+ chars, 3+ words, and contain no random gibberish or spam. Rejections incur a <strong>-20 SP</strong> penalty.
              </p>
            </div>

          </div>
          
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-sm btn-primary" onClick={() => setShowHelpModal(false)}>Got It</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
