import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function RaiseQueryModal({ onClose, onCreated }) {
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
        const results = await api.get(`/oaq/search?q=${encodeURIComponent(queryText)}`);
        setSimilar(results.slice(0, 3));
      } catch { setSimilar([]); }
      finally { setSimilarLoading(false); }
    }, 500);
    return () => clearTimeout(simTimer.current);
  }, [queryText]);

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
            <div style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>⚠ Similar queries already exist</div>
            {similar.map(s => (
              <div key={s._id} style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4, lineHeight: 1.4 }}>
                §{s.categoryTag} — {s.queryText}
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
