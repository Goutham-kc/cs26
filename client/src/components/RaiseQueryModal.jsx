import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const SECTION_LABELS = {
  '01': 'ViBe', '02': 'NOC', '03': 'Teams', '04': 'Onboarding',
  '05': 'Reports', '06': 'Finance', '07': 'Schedule', '08': 'Lab',
  '09': 'Eval', '10': 'SP', '11': 'Yaksha', '12': 'Resolver', '13': 'General'
};

export default function RaiseQueryModal({ onClose, onCreated }) {
  const { token } = useAuth();
  const [sections, setSections] = useState([]);
  const [queryText, setQueryText] = useState('');
  const [categoryTag, setCategoryTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const { addToast } = useToast();
  const simTimer = useRef(null);

  useEffect(() => {
    api.get('/sections').then(setSections).catch(console.error);
  }, []);

  useEffect(() => {
    if (queryText.trim().length < 6) { setSimilar([]); return; }
    clearTimeout(simTimer.current);
    simTimer.current = setTimeout(async () => {
      setSimilarLoading(true);
      try {
        const res = await fetch(`/api/oaq/check-duplicate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ queryText: queryText.trim() }),
        });
        const data = await res.json();
        setSimilar(data.duplicates || []);
      } catch { setSimilar([]); }
      finally { setSimilarLoading(false); }
    }, 400);
    return () => clearTimeout(simTimer.current);
  }, [queryText, token]);

  const handleSubmit = async () => {
    if (!queryText.trim() || !categoryTag) {
      addToast('Please fill in all fields', { type: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const issue = await api.post('/oaq', { queryText: queryText.trim(), categoryTag });
      addToast('Query raised! FCFS window is open.', { type: 'success' });
      onCreated(issue);
      onClose();
    } catch (err) {
      addToast(err.message, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <p className="modal-title">Raise New Query</p>
        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
          First check the 13 baseline entries and trending feed. If your question is genuinely new, raise it here — the FCFS window opens immediately.
        </p>

        <div className="form-group">
          <label className="form-label">Your Question</label>
          <textarea
            className="form-textarea"
            placeholder="Describe your query clearly and in detail..."
            value={queryText}
            onChange={e => setQueryText(e.target.value)}
          />
        </div>

        {similarLoading && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 12 }}>Checking for similar queries…</div>
        )}
        {!similarLoading && similar.length > 0 && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', borderLeft: '3px solid #f59e0b' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              ⚠ {similar.length} similar {similar.length === 1 ? 'query' : 'queries'} found — check before raising
            </div>
            {similar.map(s => (
              <div key={s._id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', flex: 1 }}>{s.queryText}</span>
                  {s.isBaseline && (
                    <span style={{ fontSize: 9, background: '#6366f1', color: '#fff', padding: '1px 5px', borderRadius: 3, marginLeft: 6, flexShrink: 0 }}>FAQ</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                    §{s.categoryTag} — {SECTION_LABELS[s.categoryTag] || s.categoryTag} &nbsp;·&nbsp; {s.status}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: s.matchScore >= 70 ? '#ef4444' : s.matchScore >= 50 ? '#f59e0b' : '#10b981'
                  }}>
                    {s.matchScore}% match
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Category Section</label>
          <select
            className="form-select"
            value={categoryTag}
            onChange={e => setCategoryTag(e.target.value)}
          >
            <option value="">— Select section —</option>
            {sections.map(s => (
              <option key={s.sectionId} value={s.sectionId}>
                §{s.sectionId} — {s.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Raising…' : 'Raise Query'}
          </button>
        </div>
      </div>
    </div>
  );
}
