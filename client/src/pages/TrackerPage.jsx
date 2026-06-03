import { useState, useEffect, Fragment } from 'react';
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
  if (!dateStr) return 'N/A';
  const parsed = new Date(dateStr).getTime();
  if (isNaN(parsed)) return 'N/A';
  const ms = Date.now() - parsed;
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isStale(issue) {
  const hoursSinceUpdate = (Date.now() - new Date(issue.updatedAt || issue.createdAt).getTime()) / 3600000;
  return hoursSinceUpdate > 48 && (!issue.communityReplies || issue.communityReplies.length === 0);
}

export default function TrackerPage() {
  const [issues, setIssues]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [showRaise, setShowRaise] = useState(false);
  const [filter, setFilter]     = useState('all');
  const [expandedIssues, setExpandedIssues] = useState({});
  const { user }    = useAuth();
  const { socket }  = useSocket();
  const { addToast } = useToast();

  const toggleExpand = (issueId) => {
    setExpandedIssues(prev => ({
      ...prev,
      [issueId]: !prev[issueId]
    }));
  };

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

  const handleVoteQuery = async (issueId, type) => {
    if (!user) { addToast('Sign in to vote'); return; }
    try {
      await api.patch(`/oaq/issues/${issueId}/vote`, { type });
      load();
    } catch (err) { addToast(err.message); }
  };

  const handleReplyVote = async (issueId, replyId, type) => {
    if (!user) { addToast('Sign in to vote'); return; }
    try {
      const result = await api.patch(`/oaq/issues/${issueId}/replies/${replyId}/vote`, { type });
      if (result.code === 'AUTO_PROMOTED') {
        addToast('Answer promoted to resolved! +50 SP awarded', { type: 'success' });
      }
      load();
    } catch (err) {
      addToast(err.message, { type: 'error' });
    }
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
            <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
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
              {filtered.map(issue => {
                const stale = isStale(issue);
                const isExpanded = !!expandedIssues[issue._id];
                const rowStyle = {
                  cursor: 'pointer',
                  ...(stale ? { background: 'var(--color-amber-bg)', borderLeft: '3px solid var(--color-amber)' } : {}),
                  ...(isExpanded ? { borderBottom: 'none' } : {})
                };
                return (
                  <Fragment key={issue._id}>
                    <tr style={rowStyle} onClick={() => toggleExpand(issue._id)}>
                      <td className="issue-id">#{issue.issueId}</td>
                      <td style={{ maxWidth: 300 }}>
                        <span style={{ fontSize: 12, lineHeight: 1.5, fontWeight: isExpanded ? 600 : 400 }}>{issue.queryText}</span>
                        {issue.communityReplies?.length > 0 && (
                          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginTop: 2 }}>
                            {issue.communityReplies.length} repl{issue.communityReplies.length === 1 ? 'y' : 'ies'} {isExpanded ? '▲' : '▼'}
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
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <button 
                            className="upvote-btn" 
                            style={{ padding: '2px 6px', fontSize: 10, background: 'none', border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleVoteQuery(issue._id, 'up'); }}
                          >
                            ▲
                          </button>
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: issue.upvoteCount > 0 ? 'var(--color-teal)' : issue.upvoteCount < 0 ? 'var(--color-red)' : 'var(--color-text-muted)' }}>
                            {issue.upvoteCount}
                          </span>
                          <button 
                            className="upvote-btn" 
                            style={{ padding: '2px 6px', fontSize: 10, background: 'none', border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer' }}
                            onClick={(e) => { e.stopPropagation(); handleVoteQuery(issue._id, 'down'); }}
                          >
                            ▼
                          </button>
                        </div>
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
                            <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); setSelected(issue); }}>
                              Resolve
                            </button>
                          )}
                          {issue.status === 'Open' && (user?.role === 'mentor' || user?.role === 'admin') && (
                            <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleMentorSignoff(issue); }}>
                              Sign Off
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ background: 'var(--color-surface-hover)' }}>
                        <td colSpan={9} style={{ padding: '16px 20px', borderTop: 'none', borderBottom: '1px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {issue.status === 'Resolved' && issue.answer && (
                              <div style={{ padding: '12px 16px', background: 'var(--color-surface)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                                <div style={{ fontSize: 10, color: 'var(--color-teal)', fontFamily: 'var(--font-mono)', fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Approved Answer</div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>{issue.answer}</div>
                              </div>
                            )}
                            
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Community Replies ({(issue.communityReplies || []).length})
                              </div>
                              {(issue.communityReplies || []).length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {(issue.communityReplies || []).map(reply => {
                                    const score = (reply.upvotes || 0) - (reply.downvotes || 0);
                                    return (
                                      <div key={reply._id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 30 }}>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleReplyVote(issue._id, reply._id, 'up'); }} 
                                            style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer', fontSize: 10, padding: '2px 4px', color: 'var(--color-text-muted)' }}
                                          >
                                            ▲
                                          </button>
                                          <span style={{ fontSize: 12, fontWeight: 700, color: score > 0 ? 'var(--color-teal)' : score < 0 ? 'var(--color-red)' : 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                                            {score}
                                          </span>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleReplyVote(issue._id, reply._id, 'down'); }} 
                                            style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer', fontSize: 10, padding: '2px 4px', color: 'var(--color-text-muted)' }}
                                          >
                                            ▼
                                          </button>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                                            <strong>{reply.repliedBy?.name || 'Unknown User'}</strong>
                                            <span>{reply.timestamp && !isNaN(new Date(reply.timestamp).getTime()) ? new Date(reply.timestamp).toLocaleDateString() : 'N/A'}</span>
                                          </div>
                                          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                            {reply.replyText}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic', paddingLeft: 4 }}>
                                  No community replies submitted yet.
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
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
