import { useState, useEffect } from 'react';
import { api } from '../services/api';
import AccordionDrawer from './AccordionDrawer';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function TrendingFeed({ filteredSections = [] }) {
  const [feed, setFeed]       = useState([]);
  const [open, setOpen]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [recEntry, setRecEntry] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/oaq/trending')
      .then(data => { setFeed(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(timer);
  }, []);

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
    <div className="page-loading"><div className="spinner" /> Loading top queries…</div>
  );

  if (feed.length === 0) return null;

  const visible = filteredSections.length > 0
    ? feed.filter(e => filteredSections.includes(e.categoryTag))
    : feed;

  if (visible.length === 0) return (
    <div className="empty-state">
      <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
      <strong>No trending queries for selected filters</strong>
      Clear section filters to see all trending items.
    </div>
  );

  return (
    <section style={{ marginBottom: 32 }}>
      <p className="section-label">Top Queries — No Search Needed</p>
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
        {visible.map((entry, i) => (
          <div key={entry._id} className="accordion-row">
            <button
              className="accordion-trigger"
              onClick={() => handleOpen(i, entry._id)}
            >
              <span className="rank">#{i + 1}</span>
              <span className="q-text">{entry.queryText}</span>
              <span className="tag">§{entry.categoryTag}</span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginRight: 4 }}>
                ▲{entry.upvoteCount}
              </span>
              {entry.updatedAt && (
                <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginRight: 4 }}>
                  · {timeAgo(entry.updatedAt)}
                </span>
              )}
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
      <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: 6, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
        Auto-refreshes every 5 min
      </p>
    </section>
  );
}
