import { useState, useEffect } from 'react';
import { users } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UserProfileModal({ userId, onClose }) {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOwn = currentUser?._id === userId || currentUser?.id === userId;

  useEffect(() => {
    users.getProfile(userId).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading profile…</div>
      </div>
    </div>
  );

  if (!data) return null;

  const { user, breakdown, rank, totalInterns, badges } = data;
  const totalSP = user.sp || 0;
  const bdMax = Math.max(totalSP, 1);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{user.name}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
              {user.role} · Joined {new Date(user.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-muted)', padding: 0 }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'var(--color-invert-bg)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>SP Balance</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-invert-text)', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{user.sp}</div>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>Rank</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>#{rank} <span style={{ fontSize: 13, fontWeight: 400 }}>of {totalInterns}</span></div>
          </div>
        </div>

        {badges && badges.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>Badges</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {badges.map((b, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                  background: b.color === '#0D9488' ? 'var(--color-teal-light)' : 'var(--color-navy-light)',
                  color: b.color === '#0D9488' ? 'var(--color-teal-dark)' : 'var(--color-navy-dark)',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                }}>{b.label}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>SP Breakdown</div>
          {[
            { label: 'FCFS Wins',         value: breakdown.FCFS_WIN || 0,         color: 'var(--color-teal)' },
            { label: 'Query Bonuses',      value: breakdown.QUERY_BONUS || 0,      color: 'var(--color-text-secondary)' },
            { label: 'Escalation Bonuses', value: breakdown.ESCALATION_BONUS || 0, color: 'var(--color-text-muted)' },
            { label: 'Penalties',          value: Math.abs(breakdown.PENALTY || 0),color: 'var(--color-red)', neg: true },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 10, width: 140, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{row.label}</div>
              <div style={{ flex: 1, height: 4, background: 'var(--color-surface)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((row.value / bdMax) * 100, 100)}%`, height: '100%', background: row.color }} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: row.neg ? 'var(--color-red)' : 'var(--color-text-primary)', minWidth: 36, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                {row.neg ? `−${row.value}` : `+${row.value}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}