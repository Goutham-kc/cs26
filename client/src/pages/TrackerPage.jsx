import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import ResolveModal from '../components/ResolveModal';
import RaiseQueryModal from '../components/RaiseQueryModal';

const SECTION_LABELS = {
  '01': 'ViBe', '02': 'NOC', '03': 'Teams', '04': 'Onboarding',
  '05': 'Reports', '06': 'Finance', '07': 'Schedule', '08': 'Lab',
  '09': 'Eval', '10': 'SP', '11': 'Yaksha', '12': 'Tracker', '13': 'General'
};

function timeAgo(dateStr) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TrackerPage() {
  const [issues, setIssues]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [showRaise, setShowRaise] = useState(false);
  const [filter, setFilter]     = useState('all');
  const { user }    = useAuth();
  const { socket }  = useSocket();
  const { addToast } = useToast();

  const load = () => {
    setLoading(true);
    api.get('/oaq/tracker')
      .then(data => { setIssues(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on('issue:created',       refresh);
    socket.on('issue:resolved',      refresh);
    socket.on('issue:priorityChanged', refresh);
    socket.on('issue:upvoted',       refresh);
    return () => {
      socket.off('issue:created',        refresh);
      socket.off('issue:resolved',       refresh);
      socket.off('issue:priorityChanged',refresh);
      socket.off('issue:upvoted',        refresh);
    };
  }, [socket]);

  const handleUpvote = async (issue) => {
    if (!user) { addToast('Sign in to upvote'); return; }
    try {
      await api.patch(`/oaq/issues/${issue._id}/upvote`);
      load();
    } catch (err) { addToast(err.message); }
  };

  const handleMentorSignoff = async (issue) => {
    try {
      await api.patch(`/oaq/issues/${issue._id}/mentor-signoff`);
      addToast('Issue marked as resolved');
      load();
    } catch (err) { addToast(err.message); }
  };

  const filtered = issues.filter(i => {
    if (filter === 'open') return i.status === 'Open';
    if (filter === 'resolved') return i.status === 'Resolved';
    if (filter === 'high') return i.priority === 'HIGH';
    return true;
  });

  return (
    <div className="app-shell">
      <main className="main-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              OAQ Tracker
            </h1>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              FCFS · First-Come First-Served · Open issues earn resolution rights
            </p>
          </div>
          {user && (
            <button className="btn btn-primary" onClick={() => setShowRaise(true)}>
              + Raise Query
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="tabs">
          {['all', 'open', 'resolved', 'high'].map(f => (
            <button
              key={f}
              className={`tab-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? `All (${issues.length})` :
               f === 'open' ? `Open (${issues.filter(i => i.status === 'Open').length})` :
               f === 'resolved' ? `Resolved (${issues.filter(i => i.status === 'Resolved').length})` :
               `High Priority (${issues.filter(i => i.priority === 'HIGH').length})`}
            </button>
          ))}
        </div>

        {loading && (
          <div className="page-loading"><div className="spinner" /> Loading tracker…</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <strong>No issues here</strong>
            {filter === 'open' ? 'All queries have been resolved.' : 'Nothing to display.'}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <table className="tracker-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Query</th>
                <th>Section</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Votes</th>
                <th>Raised by</th>
                <th>Age</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(issue => (
                <tr key={issue._id}>
                  <td className="issue-id">#{issue.issueId}</td>
                  <td style={{ maxWidth: 300 }}>
                    <span style={{ fontSize: 12, lineHeight: 1.5 }}>{issue.queryText}</span>
                    {issue.communityReplies?.length > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginTop: 2 }}>
                        {issue.communityReplies.length} repl{issue.communityReplies.length === 1 ? 'y' : 'ies'}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="tag" style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 6px', border: '1px solid var(--color-border)', borderRadius: '2px' }}>
                      {SECTION_LABELS[issue.categoryTag] || issue.categoryTag}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${issue.status === 'Open' ? 'badge-open' : 'badge-resolved'}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td>
                    {issue.priority === 'HIGH' && (
                      <span className="badge badge-high">HIGH ⚡</span>
                    )}
                    {issue.priority === 'NORMAL' && (
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Normal</span>
                    )}
                  </td>
                  <td>
                    <button className="upvote-btn" onClick={() => handleUpvote(issue)}>
                      ▲ {issue.upvoteCount}
                    </button>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {issue.raisedBy?.name || '—'}
                  </td>
                  <td style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {timeAgo(issue.createdAt)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {issue.status === 'Open' && user && (
                        <button className="btn btn-sm btn-primary" onClick={() => setSelected(issue)}>
                          Resolve
                        </button>
                      )}
                      {issue.status === 'Open' && (user?.role === 'mentor' || user?.role === 'admin') && (
                        <button className="btn btn-sm" onClick={() => handleMentorSignoff(issue)}>
                          Sign Off
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {selected && (
        <ResolveModal
          issue={selected}
          onClose={() => setSelected(null)}
          onResolved={() => { setSelected(null); load(); }}
        />
      )}
      {showRaise && (
        <RaiseQueryModal
          onClose={() => setShowRaise(false)}
          onCreated={() => { setShowRaise(false); load(); }}
        />
      )}
    </div>
  );
}
