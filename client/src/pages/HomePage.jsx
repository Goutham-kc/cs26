import { useState, useEffect, useRef } from 'react';
import TrendingFeed from '../components/TrendingFeed';
import BaselineOAQ from '../components/BaselineOAQ';
import SectionFilter from '../components/SectionFilter';
import RaiseQueryModal from '../components/RaiseQueryModal';
import { api, oaq, getMyIssues } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

function ActivitySummary({ stats }) {
  if (!stats) return null;
  const items = [
    { label: 'Queries Raised', value: stats.raised },
    { label: 'Resolved (FCFS Wins)', value: stats.resolved },
    { label: 'Pending Review', value: stats.pendingReview },
    { label: 'Upvotes Received', value: stats.totalUpvotesReceived },
  ];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
      marginBottom: 24, padding: '16px 20px',
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius)'
    }}>
      {items.map(it => (
        <div key={it.label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{it.value}</div>
          <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [tab, setTab]           = useState('baseline');
  const [openQueries, setOpenQueries] = useState([]);
  const [sections, setSections] = useState([]);
  const [searchQ, setSearchQ]   = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showRaise, setShowRaise] = useState(false);
  const [recentlyCreated, setRecentlyCreated] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const { user }  = useAuth();
  const { socket } = useSocket();
  const { addToast } = useToast();
  const searchTimer = useRef(null);

  // Real-time socket alerts
  useEffect(() => {
    if (!socket) return;
    socket.on('issue:resolved', ({ queryText }) => {
      addToast(`✓ Resolved: "${queryText?.slice(0, 50)}…"`);
    });
    socket.on('issue:escalated', ({ queryText }) => {
      addToast(`⚡ Escalated to HIGH: "${queryText?.slice(0, 50)}…"`);
    });
    socket.on('issue:replied', () => {
      if (tab === 'open') loadOpenQueries();
    });
    return () => {
      socket.off('issue:resolved');
      socket.off('issue:escalated');
      socket.off('issue:replied');
    };
  }, [socket, tab]);

  const loadOpenQueries = () => {
    oaq.getOpenQueries().then(setOpenQueries).catch(console.error);
  };

  useEffect(() => {
    if (tab === 'open') loadOpenQueries();
  }, [tab]);

  useEffect(() => {
    if (!user) return;
    getMyIssues().then(setMyStats).catch(() => {});
  }, [user]);

  // Debounced search
  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults(null); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const params = new URLSearchParams({ q: searchQ });
        if (sections.length > 0) params.set('sections', sections.join(','));
        const results = await api.get(`/oaq/search?${params}`);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [searchQ, sections]);

  return (
    <div className="app-shell">
      <main className="main-content">
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>
            Once Asked Questions
          </h1>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: 600 }}>
            Every query the team answers once becomes a permanent asset.
            Every subsequent intern gets that answer in under three seconds without human involvement.
          </p>
        </div>

        {/* Search */}
        <div className="search-wrap">
          <input
            className="search-input"
            placeholder="Search all OAQ entries…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          {user && (
            <button className="btn btn-primary" onClick={() => setShowRaise(true)}>
              + Raise Query
            </button>
          )}
        </div>

        {/* Section filter */}
        <SectionFilter onChange={setSections} />

        {/* Activity Summary — only show when not searching */}
        {user && !searchQ.trim() && <ActivitySummary stats={myStats} />}

        {/* Search results */}
        {searchQ.trim() && (
          <section style={{ marginBottom: 28 }}>
            <p className="section-label">
              Search Results {searchLoading ? '— Searching…' : searchResults ? `— ${searchResults.length} found` : ''}
            </p>
            {searchLoading && <div className="page-loading"><div className="spinner" /></div>}
            {!searchLoading && searchResults?.length === 0 && (
              <div className="empty-state">
                <strong>No results found</strong>
                If this is a genuinely new query, raise it in the Tracker.
                {user && <><br /><button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowRaise(true)}>+ Raise Query</button></>}
              </div>
            )}
            {!searchLoading && searchResults && searchResults.length > 0 && (
              <div style={{ border: '1px solid var(--color-border)' }}>
                {searchResults.map((entry) => (
                  <div key={entry._id} className="accordion-row">
                    <div style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', paddingTop: 2 }}>§{entry.categoryTag}</span>
                        <strong style={{ fontSize: 13, flex: 1 }}>{entry.queryText}</strong>
                        <span className={`badge ${entry.status === 'Open' ? 'badge-open' : 'badge-resolved'}`}>{entry.status}</span>
                      </div>
                      {entry.answer && (
                        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', paddingLeft: 28, lineHeight: 1.6 }}>
                          {entry.answer.slice(0, 200)}{entry.answer.length > 200 ? '…' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tabs */}
        {!searchQ.trim() && (
          <>
            <div className="tabs">
              <button className={`tab-btn ${tab === 'baseline' ? 'active' : ''}`} onClick={() => setTab('baseline')}>
                Baseline OAQ
              </button>
              <button className={`tab-btn ${tab === 'trending' ? 'active' : ''}`} onClick={() => setTab('trending')}>
                Top-15 Trending
              </button>
              <button className={`tab-btn ${tab === 'open' ? 'active' : ''}`} onClick={() => setTab('open')}>
                Open Queries {openQueries.length > 0 && `(${openQueries.length})`}
              </button>
            </div>

            {tab === 'baseline' && <BaselineOAQ filteredSections={sections} />}
            {tab === 'trending' && <TrendingFeed />}
            {tab === 'open' && (
              <div>
                <p className="section-label" style={{ marginBottom: 16 }}>
                  Open Queries with Community Answers — upvote the best reply to auto-resolve (+50 SP)
                </p>
                {openQueries.length === 0 && (
                  <div className="empty-state">
                    <strong>No open queries with answers yet</strong>
                    Be the first to submit an answer in the Tracker tab.
                  </div>
                )}
                {openQueries.map(issue => (
                  <OpenQueryCard key={issue._id} issue={issue} currentUser={user} onVote={() => loadOpenQueries()} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showRaise && (
        <RaiseQueryModal
          onClose={() => setShowRaise(false)}
          onCreated={(issue) => {
            setRecentlyCreated(issue);
            setSearchQ('');
          }}
        />
      )}
    </div>
  );
}
