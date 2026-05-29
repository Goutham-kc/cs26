import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function RaiseQueryModal({ onClose, onCreated }) {
  const [sections, setSections] = useState([]);
  const [queryText, setQueryText] = useState('');
  const [categoryTag, setCategoryTag] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    api.get('/sections').then(setSections).catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!queryText.trim() || !categoryTag) {
      addToast('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const issue = await api.post('/oaq', { queryText: queryText.trim(), categoryTag });
      addToast('Query raised! FCFS window is open.');
      onCreated(issue);
      onClose();
    } catch (err) {
      addToast(err.message);
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
