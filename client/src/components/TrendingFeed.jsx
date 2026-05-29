import { useState, useEffect } from 'react';
import { api } from '../services/api';
import AccordionDrawer from './AccordionDrawer';

export default function TrendingFeed() {
  const [feed, setFeed]       = useState([]);
  const [open, setOpen]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionHistory, setSessionHistory] = useState([]);

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
    const next = open === i ? null : i;
    setOpen(next);
    if (next !== null) {
      setSessionHistory(prev => [...new Set([...prev, id])]);
    }
  };

  if (loading) return (
    <div className="page-loading"><div className="spinner" /> Loading top queries…</div>
  );

  if (feed.length === 0) return null;

  return (
    <section style={{ marginBottom: 32 }}>
      <p className="section-label">Top Queries — No Search Needed</p>
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
        {feed.map((entry, i) => (
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
              <span className="toggle">{open === i ? '−' : '+'}</span>
            </button>
            <AccordionDrawer
              entry={entry}
              isOpen={open === i}
              sessionHistory={sessionHistory.filter(id => id !== entry._id)}
              onViewRecRelated={() => {}}
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
