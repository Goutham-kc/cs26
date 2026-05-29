import { useState, useEffect, useCallback } from 'react';
import { getWallet, getLedger, getLeaderboard } from '../services/api';
import { useSocket } from '../hooks/useSocket';

// ── Monochrome design tokens (spec §12) ──────────────────────────────────────
const T = {
  bg:         '#FFFFFF',
  surface:    '#F2F2F2',
  border:     '#E5E5E5',
  primary:    '#111111',
  secondary:  '#444444',
  muted:      '#888888',
  invBg:      '#000000',
  invText:    '#FFFFFF',
  red:        '#DC2626',
  teal:       '#0D9488',
  tealDark:   '#0F766E',
  tealLight:  '#CCFBF1',
  navyDark:   '#1E3A5F',
  navyLight:  '#DBEAFE',
  radius:     '4px',
  mono:       "'JetBrains Mono', 'Courier New', monospace",
};

const EVENT_META = {
  FCFS_WIN:         { label: 'FCFS WIN',    bg: T.invBg,  color: T.invText },
  QUERY_BONUS:      { label: 'QUERY',       bg: T.surface,color: T.primary },
  ESCALATION_BONUS: { label: 'ESCALATION',  bg: '#E0E0E0',color: T.primary },
  PENALTY:          { label: 'PENALTY',     bg: T.red,    color: T.invText },
};

function fmt(iso) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, invert }) {
  return (
    <div style={{
      background: invert ? T.invBg : T.surface,
      border: invert ? 'none' : `1px solid ${T.border}`,
      borderRadius: T.radius,
      padding: '18px 20px',
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, fontFamily: T.mono, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: invert ? T.invText : T.primary, fontFamily: T.mono, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SPBar({ value, max }) {
  return (
    <div style={{ height: 5, background: T.border, borderRadius: T.radius, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: '100%', background: T.primary, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function Badge({ event }) {
  const m = EVENT_META[event] || { label: event, bg: T.surface, color: T.primary };
  return (
    <span style={{
      fontSize: 9, padding: '2px 6px', borderRadius: T.radius,
      background: m.bg, color: m.color, letterSpacing: '0.08em',
      fontWeight: 700, fontFamily: T.mono, whiteSpace: 'nowrap',
    }}>{m.label}</span>
  );
}

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', padding: '10px 20px 12px',
      fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
      cursor: 'pointer', color: active ? T.primary : T.muted,
      borderBottom: `2px solid ${active ? T.primary : 'transparent'}`,
      fontFamily: T.mono, transition: 'color 0.15s',
    }}>{label}</button>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? T.invBg : T.surface,
      color: active ? T.invText : T.secondary,
      border: `1px solid ${active ? T.invBg : T.border}`,
      borderRadius: T.radius, padding: '4px 12px',
      fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
      cursor: 'pointer', fontFamily: T.mono, transition: 'all 0.15s',
    }}>{label}</button>
  );
}

// ── Live SP flash banner ──────────────────────────────────────────────────────

function LiveBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{
      background: T.invBg, color: T.invText, padding: '10px 20px',
      fontFamily: T.mono, fontSize: 12, letterSpacing: '0.08em',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 16, borderRadius: T.radius,
    }}>
      <span>⚡ {message}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontFamily: T.mono, fontSize: 12 }}>×</button>
    </div>
  );
}

// ── SP Trend Bar Chart ─────────────────────────────────────────────────────────

function TrendChart({ trend }) {
  if (!trend || trend.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: T.muted, fontSize: 11, letterSpacing: '0.1em' }}>
        NO TREND DATA YET
      </div>
    );
  }
  const max = Math.max(...trend.map(d => d.daily), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
      {trend.map((d, i) => {
        const h = Math.max(4, Math.abs((d.daily / max) * 80));
        const isNeg = d.daily < 0;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', height: h, background: T.teal, borderRadius: '2px 2px 0 0' }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Badge Card ────────────────────────────────────────────────────────────────

function BadgeCard({ badges = [], spToTop50 }) {
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '20px 20px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, marginBottom: 14 }}>BADGES</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {badges.map((b, i) => (
          <span key={i} style={{
            display: 'inline-block', fontSize: 11, fontWeight: 600,
            padding: '4px 12px', borderRadius: 20,
            background: b.color === '#0D9488' ? T.tealLight : T.navyLight,
            color: b.color === '#0D9488' ? T.tealDark : T.navyDark,
            fontFamily: T.mono, letterSpacing: '0.05em',
          }}>{b.label}</span>
        ))}
        {badges.length === 0 && (
          <span style={{ fontSize: 11, color: T.muted }}>No badges yet</span>
        )}
      </div>
      {spToTop50 > 0 && (
        <div style={{ marginTop: 16, padding: '10px 14px', background: T.surface, borderRadius: T.radius }}>
          <span style={{ fontSize: 11, color: T.secondary, fontFamily: T.mono }}>
            {spToTop50} SP needed to enter Top 50
          </span>
        </div>
      )}
    </div>
  );
}

// ── What To Do Next ───────────────────────────────────────────────────────────

function WhatToDoNext({ spToTop50, total }) {
  const items = [];
  if (spToTop50 > 0) items.push(`Earn ${spToTop50} more SP to enter the Top 50`);
  items.push('Resolve open issues via FCFS for +50 SP each');
  items.push('Raise unique queries for +10 SP bonus');
  items.push('Upvote helpful issues — authors earn +5 SP on escalation');

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '20px 20px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, marginBottom: 14 }}>WHAT TO DO NEXT</div>
      <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 12, color: T.secondary, fontFamily: T.mono, lineHeight: 1.5 }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// ── SP Bank Statement ─────────────────────────────────────────────────────────

function SPBankStatement({ entries }) {
  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.primary, marginBottom: 12 }}>SP BANK STATEMENT</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {['SP Bank', 'Chats', 'Polls', 'Top 50'].map(btn => (
          <button key={btn} style={{
            padding: '6px 14px', border: `1px solid ${T.border}`,
            borderRadius: T.radius, background: T.bg,
            fontSize: 10, fontFamily: T.mono, letterSpacing: '0.08em',
            textTransform: 'uppercase', cursor: 'pointer', color: T.secondary,
          }}>{btn}</button>
        ))}
      </div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', background: T.surface, padding: '10px 16px', fontSize: 10, letterSpacing: '0.08em', color: T.muted, textTransform: 'uppercase', gap: 8 }}>
          <span>Description</span><span style={{ textAlign: 'right' }}>Debit</span><span style={{ textAlign: 'right' }}>Credit</span>
        </div>
        {(!entries || entries.length === 0) && (
          <div style={{ padding: '24px 16px', fontSize: 11, color: T.muted, textAlign: 'center', fontFamily: T.mono }}>NO STATEMENT ENTRIES</div>
        )}
        {entries && entries.slice(0, 5).map((e, i) => (
          <div key={e._id || i} style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 80px',
            padding: '12px 16px', gap: 8,
            background: i % 2 === 0 ? T.bg : T.surface,
            borderTop: `0.5px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 11, color: T.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.reason || '—'}</span>
            <span style={{ fontSize: 11, textAlign: 'right', color: e.delta < 0 ? T.red : T.muted }}>{e.delta < 0 ? Math.abs(e.delta) : '—'}</span>
            <span style={{ fontSize: 11, textAlign: 'right', color: e.delta > 0 ? T.teal : T.muted }}>{e.delta > 0 ? `+${e.delta}` : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function SPDashboard({ user }) {
  const [tab,        setTab]        = useState('overview');
  const [wallet,     setWallet]     = useState(null);
  const [ledger,     setLedger]     = useState({ entries: [], total: 0 });
  const [leaderboard,setLeaderboard]= useState([]);
  const [filter,     setFilter]     = useState('ALL');
  const [loading,    setLoading]    = useState(true);
  const [banner,     setBanner]     = useState(null);
  const [spAnim,     setSpAnim]     = useState(0);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [w, l, lb] = await Promise.all([
        getWallet(),
        getLedger({ limit: 30 }),
        getLeaderboard(10)
      ]);
      setWallet(w);
      setLedger(l);
      setLeaderboard(lb);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Animate SP counter on wallet load
  useEffect(() => {
    if (!wallet) return;
    const end = wallet.user.sp;
    let val = 0;
    const step = Math.max(1, Math.ceil(end / 40));
    const t = setInterval(() => {
      val = Math.min(val + step, end);
      setSpAnim(val);
      if (val >= end) clearInterval(t);
    }, 18);
    return () => clearInterval(t);
  }, [wallet?.user?.sp]);

  // ── Socket.io real-time ────────────────────────────────────────────────────

  useSocket({
    onResolved: ({ issueId }) => {
      setBanner(`Issue resolved — FCFS winner minted +50 SP`);
      fetchAll();  // re-fetch wallet + ledger to reflect the new state
    },
    onEscalated: ({ issueId }) => {
      setBanner(`Issue escalated to HIGH priority — +5 SP awarded to query author`);
    }
  });

  // ── Filtered ledger entries ────────────────────────────────────────────────

  const filteredEntries = filter === 'ALL'
    ? ledger.entries
    : ledger.entries.filter(e => e.event === filter);

  // ── Breakdown helpers ──────────────────────────────────────────────────────

  const bd    = wallet?.breakdown || {};
  const total = wallet?.user?.sp || 0;
  const maxSP = Math.max(...leaderboard.map(u => u.sp), 1);

  const wins      = ledger.entries.filter(e => e.event === 'FCFS_WIN').length;
  const penalties = ledger.entries.filter(e => e.event === 'PENALTY').length;
  const bonuses   = ledger.entries.filter(e => e.event === 'QUERY_BONUS' || e.event === 'ESCALATION_BONUS').length;

  if (loading) {
    return (
      <div style={{ fontFamily: T.mono, color: T.muted, padding: '40px 0', textAlign: 'center', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        LOADING SP DATA...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: T.mono, maxWidth: 720, margin: '0 auto', color: T.primary, paddingBottom: 48 }}>

      <LiveBanner message={banner} onDismiss={() => setBanner(null)} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 20, borderBottom: `1.5px solid ${T.primary}`, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>VICHARANASHALA / OAQ</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>SP WALLET</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: T.secondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{wallet?.user?.name || user?.name}</div>
          <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{wallet?.user?.role}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `0.5px solid ${T.border}`, marginBottom: 28 }}>
        {['overview', 'ledger', 'leaderboard'].map(t => (
          <TabBtn key={t} label={t} active={tab === t} onClick={() => setTab(t)} />
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div>
          {/* Total SP display */}
          <div style={{ textAlign: 'center', padding: '28px 0 24px', borderBottom: `0.5px solid ${T.border}`, marginBottom: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>TOTAL SKILL POINTS</div>
            <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: '-3px', lineHeight: 1 }}>{spAnim} <span style={{ fontSize: 36, fontWeight: 400 }}>SP</span></div>
          </div>

          {/* SP Balance + metrics row */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, marginBottom: 24 }}>
            {/* Black SP Balance card */}
            <div style={{ background: T.invBg, borderRadius: T.radius, padding: '20px 20px' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted, marginBottom: 8 }}>SP BALANCE</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: T.invText, lineHeight: 1 }}>{total}</div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 8 }}>Running total</div>
            </div>

            {/* Right side: 3 metric boxes + SP Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* FCFS Wins, Bonuses, Penalties */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <StatCard label="FCFS Wins"  value={wins}     sub="+50 SP each" />
                <StatCard label="Bonuses"    value={bonuses}  sub="Query + escalation" />
                <StatCard label="Penalties"  value={penalties} sub="−20 SP each" />
              </div>

              {/* SP Breakdown bars */}
              <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '16px 20px' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, marginBottom: 12 }}>SP BREAKDOWN</div>
                {[
                  { label: 'FCFS Wins',         value: bd.FCFS_WIN || 0,         max: Math.max(total, 1), color: T.teal },
                  { label: 'Query Bonuses',      value: bd.QUERY_BONUS || 0,      max: Math.max(total, 1), color: T.secondary },
                  { label: 'Escalation Bonuses', value: bd.ESCALATION_BONUS || 0, max: Math.max(total, 1), color: T.muted },
                  { label: 'Penalties',          value: Math.abs(bd.PENALTY || 0),max: Math.max(total, 1), color: T.red, neg: true },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 10, width: 160, color: T.secondary, flexShrink: 0 }}>{row.label}</div>
                    <div style={{ flex: 1, height: 4, background: T.surface, borderRadius: T.radius, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min((row.value / row.max) * 100, 100)}%`, height: '100%', background: row.color }} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: row.neg ? T.red : T.primary, minWidth: 36, textAlign: 'right' }}>
                      {row.neg ? `−${row.value}` : `+${row.value}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Badges + What To Do Next row */}
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, marginBottom: 24 }}>
            <BadgeCard badges={wallet?.badges || []} spToTop50={wallet?.spToTop50 || 0} />
            <WhatToDoNext spToTop50={wallet?.spToTop50 || 0} total={total} />
          </div>

          {/* SP Trend + Recent Activity row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* SP Trend */}
            <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '20px 20px' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, marginBottom: 16 }}>SP TREND</div>
              <TrendChart trend={wallet?.trend || []} />
            </div>

            {/* Recent Activity */}
            <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '20px 20px' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, marginBottom: 16 }}>RECENT ACTIVITY</div>
              {ledger.entries.slice(0, 5).map((entry, i) => {
                const { date } = fmt(entry.createdAt);
                return (
                  <div key={entry._id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 10, borderBottom: `0.5px solid ${T.surface}`, marginBottom: 10 }}>
                    <Badge event={entry.event} />
                    <div style={{ flex: 1, fontSize: 11, color: T.secondary, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.reason}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: entry.delta > 0 ? T.teal : T.red, minWidth: 32, textAlign: 'right' }}>
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                    </div>
                  </div>
                );
              })}
              <button onClick={() => setTab('ledger')} style={{ background: 'none', border: 'none', fontSize: 10, color: T.muted, cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', padding: 0, fontFamily: T.mono }}>
                VIEW FULL LEDGER →
              </button>
            </div>
          </div>

          {/* SP Bank Statement */}
          <SPBankStatement entries={ledger.entries} />
        </div>
      )}

      {/* ── LEDGER ── */}
      {tab === 'ledger' && (
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {['ALL', 'FCFS_WIN', 'QUERY_BONUS', 'ESCALATION_BONUS', 'PENALTY'].map(f => (
              <FilterChip key={f} label={f.replace('_', ' ')} active={filter === f} onClick={() => setFilter(f)} />
            ))}
          </div>

          <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 88px', background: T.invBg, padding: '10px 20px', fontSize: 10, letterSpacing: '0.1em', color: T.muted, textTransform: 'uppercase', gap: 8 }}>
              <span>Event</span><span>Reason</span><span style={{ textAlign: 'center' }}>Δ SP</span><span style={{ textAlign: 'right' }}>Date</span>
            </div>
            {filteredEntries.length === 0 && (
              <div style={{ padding: '24px 20px', fontSize: 11, color: T.muted, textAlign: 'center', letterSpacing: '0.1em' }}>NO ENTRIES</div>
            )}
            {filteredEntries.map((entry, i) => {
              const { date, time } = fmt(entry.createdAt);
              return (
                <div key={entry._id || i} style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr 60px 88px',
                  padding: '12px 20px', alignItems: 'start', gap: 8,
                  background: i % 2 === 0 ? T.bg : T.surface,
                  borderTop: `0.5px solid ${T.border}`,
                }}>
                  <div><Badge event={entry.event} /></div>
                  <div style={{ fontSize: 11, color: T.secondary, lineHeight: 1.5 }}>{entry.reason}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: entry.delta > 0 ? T.primary : T.red, textAlign: 'center' }}>
                    {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: T.muted }}>{date}</div>
                    <div style={{ fontSize: 10, color: T.border }}>{time}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16, padding: '14px 20px', background: T.invBg, borderRadius: T.radius, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>CURRENT BALANCE</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: T.invText }}>{total} SP</span>
          </div>
        </div>
      )}

      {/* ── LEADERBOARD ── */}
      {tab === 'leaderboard' && (
        <div>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 80px 60px', background: T.invBg, padding: '10px 20px', fontSize: 10, letterSpacing: '0.1em', color: T.muted, textTransform: 'uppercase', gap: 8 }}>
              <span>#</span><span>Intern</span><span style={{ textAlign: 'right' }}>SP</span><span style={{ textAlign: 'right' }}>Wins</span>
            </div>
            {leaderboard.map((entry, i) => (
              <div key={entry._id || i} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 80px 60px',
                padding: '14px 20px', alignItems: 'center', gap: 8,
                background: entry.isYou ? T.surface : i % 2 === 0 ? T.bg : '#FAFAFA',
                borderTop: `0.5px solid ${T.border}`,
                borderLeft: `3px solid ${entry.isYou ? T.primary : 'transparent'}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: entry.rank <= 3 ? T.primary : T.border }}>{entry.rank}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: entry.isYou ? 700 : 400 }}>
                    {entry.name}
                    {entry.isYou && <span style={{ fontSize: 9, marginLeft: 8, color: T.muted, letterSpacing: '0.08em' }}>YOU</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{entry.sp}</div>
                  <div style={{ fontSize: 9, color: T.muted }}>SP</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: T.secondary }}>{entry.wins}</div>
                  <div style={{ fontSize: 9, color: T.muted }}>FCFS</div>
                </div>
              </div>
            ))}
          </div>

          {/* Cohort bar chart */}
          <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, padding: '20px 24px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted, marginBottom: 16 }}>COHORT DISTRIBUTION</div>
            {leaderboard.map(entry => (
              <div key={entry._id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 10, width: 80, color: entry.isYou ? T.primary : T.muted, fontWeight: entry.isYou ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.isYou ? 'YOU' : entry.name.split(' ')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, height: 5, background: T.surface, borderRadius: T.radius, overflow: 'hidden' }}>
                  <div style={{ width: `${(entry.sp / maxSP) * 100}%`, height: '100%', background: entry.isYou ? T.primary : T.border, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: entry.isYou ? 700 : 400, color: entry.isYou ? T.primary : T.muted, minWidth: 36, textAlign: 'right' }}>{entry.sp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: `0.5px solid ${T.border}`, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: T.border, letterSpacing: '0.08em', textTransform: 'uppercase' }}>OAQ SP LEDGER · v2.0</span>
        <span style={{ fontSize: 10, color: T.border, letterSpacing: '0.08em' }}>FCFS · ATOMIC · SOCKET.IO</span>
      </div>
    </div>
  );
}
