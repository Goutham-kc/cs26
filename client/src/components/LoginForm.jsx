import { useState } from 'react';
import { login, register } from '../services/api';

const T = {
  primary: '#111111', muted: '#888888', border: '#CCCCCC',
  surface: '#F2F2F2', red: '#FF3333',
  mono: "'JetBrains Mono', 'Courier New', monospace",
  radius: '2px',
};

export default function LoginForm({ onAuth }) {
  const [mode,  setMode]  = useState('login');  // 'login' | 'register'
  const [form,  setForm]  = useState({ name: '', email: '', password: '', role: 'intern' });
  const [error, setError] = useState('');
  const [busy,  setBusy]  = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const data = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password, form.role);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '10px 12px',
    border: `1px solid ${T.border}`, borderRadius: T.radius,
    fontFamily: T.mono, fontSize: 13, background: T.surface,
    color: T.primary, marginBottom: 12, outline: 'none',
  };

  return (
    <div style={{ maxWidth: 380, margin: '80px auto', fontFamily: T.mono }}>
      <div style={{ borderBottom: `1.5px solid ${T.primary}`, paddingBottom: 16, marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>VICHARANASHALA / INTERNSHIP</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>OAQ SYSTEM</div>
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: `0.5px solid ${T.border}` }}>
        {['login', 'register'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            background: 'none', border: 'none', padding: '8px 16px 10px',
            fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', color: mode === m ? T.primary : T.muted,
            borderBottom: `2px solid ${mode === m ? T.primary : 'transparent'}`,
            fontFamily: T.mono,
          }}>{m}</button>
        ))}
      </div>

      <form onSubmit={submit}>
        {mode === 'register' && (
          <>
            <input
              style={inputStyle}
              placeholder="FULL NAME"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <select
              style={inputStyle}
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              <option value="intern">INTERN</option>
              <option value="mentor">MENTOR</option>
            </select>
          </>
        )}
        <input
          style={inputStyle}
          type="email"
          placeholder="EMAIL"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          style={inputStyle}
          type="password"
          placeholder="PASSWORD"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
        />
        {error && (
          <div style={{ fontSize: 11, color: T.red, marginBottom: 12, letterSpacing: '0.06em' }}>{error}</div>
        )}
        <button type="submit" disabled={busy} style={{
          width: '100%', padding: '12px', background: T.primary, color: '#FFF',
          border: 'none', borderRadius: T.radius, fontFamily: T.mono,
          fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
          cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1,
        }}>
          {busy ? 'PLEASE WAIT...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </button>
      </form>
    </div>
  );
}
