import { useState } from 'react';

export function ConfirmModal({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onClose }) {

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-muted)', padding: 0 }}>×</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-sm" onClick={onClose} style={{ background: 'var(--color-border)' }}>Cancel</button>
          <button
            className="btn btn-sm"
            onClick={() => { onConfirm(); onClose(); }}
            style={danger
              ? { background: 'var(--color-red)', color: '#fff', borderColor: 'var(--color-red)' }
              : { background: 'var(--color-invert-bg)', color: 'var(--color-invert-text)' }
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function InputModal({ title, label, placeholder, defaultValue = '', type = 'text', onSubmit, onClose }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-muted)', padding: 0 }}>×</button>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>{label}</label>
          <input
            type={type}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none' }}
            onKeyDown={e => e.key === 'Enter' && value.trim() && (onSubmit(value.trim()), onClose())}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-sm" onClick={onClose} style={{ background: 'var(--color-border)' }}>Cancel</button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => { if (value.trim()) { onSubmit(value.trim()); onClose(); } }}
            disabled={!value.trim()}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export function SPAdjustModal({ userName, currentSp, onSubmit, onClose }) {
  const [sp, setSp] = useState(String(currentSp));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Adjust SP</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-muted)', padding: 0 }}>×</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>Adjust SP for <strong>{userName}</strong> (current: {currentSp})</p>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>New SP Value</label>
          <input
            type="number"
            value={sp}
            onChange={e => setSp(e.target.value)}
            autoFocus
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none', fontFamily: 'var(--font-mono)' }}
            onKeyDown={e => e.key === 'Enter' && sp && (onSubmit(parseInt(sp)), onClose())}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-sm" onClick={onClose} style={{ background: 'var(--color-border)' }}>Cancel</button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => { const v = parseInt(sp); if (!isNaN(v)) { onSubmit(v); onClose(); } }}
            disabled={!sp || isNaN(parseInt(sp))}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

export function ThreadCloseModal({ threadTitle, threadCreatorName, onSubmit, onClose }) {
  const [spReward, setSpReward] = useState('');

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Close Thread</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-muted)', padding: 0 }}>×</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Close thread: <strong>"{threadTitle?.slice(0, 50)}"</strong> by {threadCreatorName}?
        </p>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>Award SP to thread creator (optional)</label>
          <input
            type="number"
            value={spReward}
            onChange={e => setSpReward(e.target.value)}
            placeholder="Enter SP amount or leave blank"
            autoFocus
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none', fontFamily: 'var(--font-mono)' }}
            onKeyDown={e => e.key === 'Enter' && (onSubmit(parseInt(spReward) || 0), onClose())}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-sm" onClick={onClose} style={{ background: 'var(--color-border)' }}>Cancel</button>
          <button
            className="btn btn-sm"
            onClick={() => { onSubmit(parseInt(spReward) || 0); onClose(); }}
            style={{ background: 'var(--color-invert-bg)', color: 'var(--color-invert-text)' }}
          >
            Close Thread
          </button>
        </div>
      </div>
    </div>
  );
}