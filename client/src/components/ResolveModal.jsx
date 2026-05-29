import { useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import YakshaViewport from './YakshaViewport';

// Basic client-side Yaksha preview (mirrors backend logic)
function localYakshaCheck(text) {
  const blocklist = ['spam', 'test123', 'asdf', 'idk', 'dunno'];
  const clean = text.trim().toLowerCase();
  if (clean.length < 20) return { passed: false, reason: 'Too short (min 20 chars)' };
  if (blocklist.some(w => clean.includes(w))) return { passed: false, reason: 'Blocked content' };
  const tokens = clean.split(/\s+/);
  if (new Set(tokens).size / tokens.length < 0.6) return { passed: false, reason: 'Too repetitive' };
  return { passed: true };
}

export default function ResolveModal({ issue, onClose, onResolved }) {
  const [answer, setAnswer]   = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const preview = answer.length > 0 ? localYakshaCheck(answer) : null;

  const handleSubmit = async () => {
    if (!answer.trim()) { addToast('Write an answer first'); return; }
    setLoading(true);
    try {
      const result = await api.post(`/oaq/issues/${issue._id}/resolve`, { answer });
      if (result.code === 'FCFS_WIN') {
        addToast('FCFS WIN — You resolved the issue first!');
        onResolved(result.issue);
        onClose();
      }
    } catch (err) {
      if (err.message.includes('FCFS_COLLISION')) {
        addToast('FCFS LOCKED — Another user resolved this first.');
      } else if (err.message.includes('YAKSHA')) {
        addToast('Yaksha rejected your answer. Revise and try again.');
      } else {
        addToast(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <p className="modal-title">Resolve Issue #{issue.issueId}</p>
        <p style={{ fontSize: '12px', marginBottom: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          {issue.queryText}
        </p>

        <div className="form-group">
          <label className="form-label">Your Answer (Yaksha-audited)</label>
          <textarea
            className="form-textarea"
            style={{ minHeight: 120 }}
            placeholder="Write a clear, detailed answer (min 20 chars)..."
            value={answer}
            onChange={e => setAnswer(e.target.value)}
          />
        </div>

        {preview && (
          <YakshaViewport
            activeText={answer.slice(0, 100) + (answer.length > 100 ? '…' : '')}
            auditStatus={preview.passed ? 'pass' : 'fail'}
          />
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting…' : 'Submit (FCFS)'}
          </button>
        </div>
      </div>
    </div>
  );
}
