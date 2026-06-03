import { useState, useEffect } from 'react';
import { api } from '../services/api';
import AccordionDrawer from './AccordionDrawer';

const SECTION_NAMES = {
  '01': 'ViBe Platform', '02': 'NOC System', '03': 'Team Formation',
  '04': 'Onboarding', '05': 'Reports & Submissions', '06': 'Stipend & Finance',
  '07': 'Schedule & Attendance', '08': 'Lab Infrastructure', '09': 'Evaluation & Grading',
  '10': 'SP & Gamification', '11': 'Yaksha-mini', '12': 'OAQ Resolver', '13': 'General / Other'
};

const SORT_OPTIONS = [
  { value: 'id',      label: 'By ID (Default)' },
  { value: 'popular', label: 'Most Upvoted' },
  { value: 'alpha',   label: 'A → Z' },
  { value: 'newest',  label: 'Newest First' },
  { value: 'oldest',  label: 'Oldest First' },
];

export default function BaselineOAQ({ filteredSections }) {
  const [entries,     setEntries]     = useState([]);
  const [open,        setOpen]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [sort,        setSort]        = useState('id');
  const [recEntry,    setRecEntry]    = useState(null);

  useEffect(() => {
    api.get('/oaq/baseline')
      .then(data => { setEntries(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const visible = (() => {
    let list = filteredSections && filteredSections.length > 0
      ? entries.filter(e => filteredSections.includes(e.categoryTag))
      : entries;

    if (sort === 'popular') list = [...list].sort((a, b) => b.upvoteCount - a.upvoteCount);
    if (sort === 'alpha')   list = [...list].sort((a, b) => a.queryText.localeCompare(b.queryText));
    if (sort === 'newest')  list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === 'oldest')  list = [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return list;
  })();

  const handleOpen = (i, id) => {
    setRecEntry(null);
    const next = open === i ? null : i;
    setOpen(next);
    if (next !== null) {
      setSessionHistory(prev => [...new Set([...prev, id])]);
    }
  };

  const handleViewRecRelated = async (relatedId) => {
    try {
      const full = await api.get(`/oaq/${relatedId}`);
      setRecEntry(full);
      setSessionHistory(prev => [...new Set([...prev, full._id])]);
      setOpen(-1);
    } catch {}
  };

  if (loading) return (
    <div className="page-loading"><div className="spinner" /> Loading baseline OAQ…</div>
  );

  if (visible.length === 0) return (
    <div className="empty-state">
      <div style={{ fontSize: 36, marginBottom: 8 }}>📂</div>
      <strong>No entries for selected filters</strong>
      Clear section filters to see all 13 baseline entries.
    </div>
  );

  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <p className="section-label" style={{ margin: 0 }}>
          OAQ Library — {visible.length} of {entries.length} Entries · Always Visible · No Login Required
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '4px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', fontSize: 11, fontFamily: 'var(--font-mono)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
        {visible.map((entry, i) => (
          <div key={entry._id} className="accordion-row">
            <button
              className="accordion-trigger"
              onClick={() => handleOpen(i, entry._id)}
            >
              <span className="rank">
                {String(entry.issueId).padStart(2, '0')}
              </span>
              <span className="q-text">{entry.queryText}</span>
              <span className="tag">
                {SECTION_NAMES[entry.categoryTag] || `§${entry.categoryTag}`}
              </span>
              <span className="toggle">{open === i ? '−' : '+'}</span>
            </button>
            <AccordionDrawer
              entry={open === -1 ? recEntry : entry}
              isOpen={open === -1 ? (i === 0) : open === i}
              sessionHistory={open === -1 ? sessionHistory : sessionHistory.filter(id => id !== entry._id)}
              onViewRecRelated={handleViewRecRelated}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
