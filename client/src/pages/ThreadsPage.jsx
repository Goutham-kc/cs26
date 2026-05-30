import { useState, useEffect } from 'react';
import { threads } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

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

function NestedReplies({ replies, threadId, onVote, onAccept, currentUser }) {
  return (
    <div style={{ marginLeft: 24, borderLeft: '2px solid var(--color-border)', paddingLeft: 12 }}>
      {replies.map(reply => (
        <div key={reply._id} style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <button onClick={() => onVote(threadId, reply._id, 'up')} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer', fontSize: 10, padding: '2px 5px', color: 'var(--color-text-muted)' }}>▲</button>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                {(reply.upvotes || 0) - (reply.downvotes || 0)}
              </span>
              <button onClick={() => onVote(threadId, reply._id, 'down')} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer', fontSize: 10, padding: '2px 5px', color: 'var(--color-text-muted)' }}>▼</button>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>
                {reply.repliedBy?.name || 'Unknown'} · {reply.isPromoted ? <span style={{ color: 'var(--color-teal)', fontWeight: 600 }}>✓ ANSWER</span> : ''}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{reply.replyText}</div>
              {reply.parentReplyId && (
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: 3 }}>
                  ↳ replying to a comment
                </div>
              )}
            </div>
          </div>
          {reply.isPromoted && currentUser && (currentUser.role === 'mentor' || currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
            <div style={{ marginTop: 4, marginLeft: 32 }}>
              <span style={{ fontSize: 10, color: 'var(--color-teal)' }}>✓ Accepted answer</span>
            </div>
          )}
          {!reply.isPromoted && currentUser && (currentUser.role === 'mentor' || currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
            <div style={{ marginTop: 4, marginLeft: 32 }}>
              <button onClick={() => onAccept(threadId, reply._id)} style={{ fontSize: 10, background: 'none', border: '1px solid var(--color-teal)', borderRadius: 3, cursor: 'pointer', color: 'var(--color-teal)', padding: '2px 6px' }}>
                Accept as answer
              </button>
            </div>
          )}
          {reply.replies?.length > 0 && (
            <NestedReplies replies={reply.replies} threadId={threadId} onVote={onVote} onAccept={onAccept} currentUser={currentUser} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ThreadsPage() {
  const [threadsList, setThreadsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedThread, setSelectedThread] = useState(null);
  const [filter, setFilter] = useState({ status: '', priority: '', category: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ title: '', body: '', categoryTag: '13', labels: '' });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const { user } = useAuth();
  const { socket } = useSocket();
  const { addToast } = useToast();

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const q = {};
      if (filter.status) q.status = filter.status;
      if (filter.priority) q.priority = filter.priority;
      if (filter.category) q.category = filter.category;
      q.page = page;
      q.limit = 15;
      const data = await threads.list(q);
      setThreadsList(data.threads);
      setTotal(data.total);
    } catch {
      addToast('Failed to load threads', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, filter]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on('thread:created', refresh);
    socket.on('thread:resolved', refresh);
    socket.on('thread:replied', refresh);
    return () => {
      socket.off('thread:created', refresh);
      socket.off('thread:resolved', refresh);
      socket.off('thread:replied', refresh);
    };
  }, [socket]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createData.title.trim() || !createData.body.trim()) return;
    setCreateSubmitting(true);
    try {
      const labels = createData.labels.split(',').map(l => l.trim()).filter(Boolean);
      await threads.create({ ...createData, labels });
      addToast('Thread created');
      setShowCreate(false);
      setCreateData({ title: '', body: '', categoryTag: '13', labels: '' });
      load();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleOpenThread = async (thread) => {
    try {
      const full = await threads.get(thread._id);
      setSelectedThread(full);
    } catch {
      addToast('Failed to load thread', 'error');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedThread) return;
    setReplySubmitting(true);
    try {
      const updated = await threads.reply(selectedThread._id, { replyText });
      setReplyText('');
      setSelectedThread(updated);
      addToast(`Reply posted (${updated.threadReplies?.length} replies)`);
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleVote = async (threadId, replyId, type) => {
    try {
      await threads.voteReply(threadId, replyId, type);
      if (selectedThread?._id === threadId) {
        const full = await threads.get(threadId);
        setSelectedThread(full);
      }
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleAccept = async (threadId, replyId) => {
    try {
      await threads.acceptReply(threadId, replyId);
      addToast('Reply accepted as answer');
      const full = await threads.get(threadId);
      setSelectedThread(full);
      load();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleUpvote = async (thread) => {
    try {
      await threads.upvote(thread._id);
      load();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleLock = async (thread) => {
    try {
      if (thread.isLocked) {
        await threads.unlock(thread._id);
        addToast('Thread unlocked');
        if (selectedThread?._id === thread._id) {
          const full = await threads.get(thread._id);
          setSelectedThread(full);
        }
      } else {
        const spRaw = prompt('Close thread — award SP to thread creator? (Enter SP amount or leave blank to close without SP)');
        if (spRaw === null) return;
        const spReward = parseInt(spRaw) || 0;
        await threads.close(thread._id, spReward, thread.raisedBy._id);
        addToast(spReward > 0 ? `Thread closed — ${spReward} SP awarded` : 'Thread closed');
        if (selectedThread?._id === thread._id) {
          const full = await threads.get(thread._id);
          setSelectedThread(full);
        }
      }
      load();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const buildReplyTree = (replies, parentId = null) => {
    return replies
      .filter(r => r.parentReplyId?.toString() === (parentId?.toString() || null))
      .map(r => ({ ...r, replies: buildReplyTree(replies, r._id) }));
  };

  return (
    <div className="app-shell">
      <main className="main-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              Threads
            </h1>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Discuss queries, issues, and problems — for threaded conversations only. Not for FCFS resolution (use Tracker for that).
            </p>
          </div>
          {user && (
            <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + New Thread
            </button>
          )}
        </div>

        <div className="tabs" style={{ marginBottom: 16 }}>
          {['', 'Open', 'Resolved', 'Locked'].map(s => (
            <button key={s} className={`tab-btn ${filter.status === s ? 'active' : ''}`} onClick={() => setFilter(f => ({ ...f, status: s }))}>
              {s || 'All'}
            </button>
          ))}
          <select style={{ marginLeft: 8, padding: '4px 8px', fontSize: 11, border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
            <option value="">All Sections</option>
            {Object.entries(SECTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select style={{ marginLeft: 8, padding: '4px 8px', fontSize: 11, border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priority</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>

        {loading && <div className="page-loading"><div className="spinner" /> Loading…</div>}

        {!loading && threadsList.length === 0 && (
          <div className="empty-state"><strong>No threads found</strong>Be the first to start a discussion.</div>
        )}

        {!loading && threadsList.map(thread => (
          <div key={thread._id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: 'var(--color-surface)', cursor: 'pointer' }} onClick={() => handleOpenThread(thread)}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>§{thread.categoryTag}</span>
                    {thread.isPinned && <span style={{ fontSize: 10, color: 'var(--color-primary)' }}>📌</span>}
                    {thread.isLocked && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>🔒</span>}
                    {thread.priority === 'HIGH' && <span className="badge badge-high">HIGH</span>}
                    <span className={`badge ${thread.status === 'Open' ? 'badge-open' : 'badge-resolved'}`}>{thread.status}</span>
                    {thread.labels?.map(l => <span key={l} style={{ fontSize: 10, padding: '1px 5px', border: '1px solid var(--color-border)', borderRadius: 3, color: 'var(--color-text-muted)' }}>{l}</span>)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{thread.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>
                    {thread.raisedBy?.name} · {timeAgo(thread.createdAt)} · ▲ {thread.upvoteCount} · 💬 {thread.threadReplies?.length || 0}
                    {thread.assignedTo && <span> · Assigned: {thread.assignedTo.name}</span>}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleUpvote(thread); }} className="upvote-btn">▲</button>
              </div>
            </div>
          </div>
        ))}

        {!loading && total > 15 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button className="btn btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '4px 12px' }}>Page {page}</span>
            <button className="btn btn-sm" disabled={threadsList.length < 15} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </main>

      {selectedThread && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 600, background: 'var(--color-bg)', borderLeft: '1px solid var(--color-border)', overflow: 'auto', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--color-surface)', position: 'sticky', top: 0 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>§{selectedThread.categoryTag}</span>
                <span className={`badge ${selectedThread.status === 'Open' ? 'badge-open' : 'badge-resolved'}`}>{selectedThread.status}</span>
                {selectedThread.priority === 'HIGH' && <span className="badge badge-high">HIGH</span>}
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>{selectedThread.title}</h2>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                {selectedThread.raisedBy?.name} · {timeAgo(selectedThread.createdAt)} · ▲ {selectedThread.upvoteCount} · 💬 {selectedThread.threadReplies?.length}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(user?.role === 'mentor' || user?.role === 'admin' || user?.role === 'superadmin') && (
                <button className="btn btn-sm" onClick={() => handleLock(selectedThread)}>
                  {selectedThread.isLocked ? 'Unlock' : 'Lock'}
                </button>
              )}
              <button className="btn btn-sm" onClick={() => setSelectedThread(null)} style={{ background: 'var(--color-border)' }}>✕</button>
            </div>
          </div>

          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>{selectedThread.body}</p>
            {selectedThread.labels?.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                {selectedThread.labels.map(l => <span key={l} style={{ fontSize: 10, padding: '2px 7px', border: '1px solid var(--color-border)', borderRadius: 3, color: 'var(--color-text-muted)' }}>{l}</span>)}
              </div>
            )}
            {selectedThread.resolvedBy && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--color-teal)' }}>
                ✓ Resolved by {selectedThread.resolvedBy.name}
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
            {selectedThread.threadReplies?.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 12 }}>
                No replies yet. Be the first to respond.
              </div>
            )}
            {buildReplyTree(selectedThread.threadReplies || []).map(reply => (
              <div key={reply._id}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <button onClick={() => handleVote(selectedThread._id, reply._id, 'up')} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer', fontSize: 11, padding: '2px 6px', color: 'var(--color-text-muted)' }}>▲</button>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{(reply.upvotes || 0) - (reply.downvotes || 0)}</span>
                    <button onClick={() => handleVote(selectedThread._id, reply._id, 'down')} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer', fontSize: 11, padding: '2px 6px', color: 'var(--color-text-muted)' }}>▼</button>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>
                      {reply.repliedBy?.name || 'Unknown'}
                      {reply.isPromoted && <span style={{ color: 'var(--color-teal)', fontWeight: 600, marginLeft: 6 }}>✓ ANSWER</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{reply.replyText}</div>
                    {!reply.isPromoted && (user?.role === 'mentor' || user?.role === 'admin' || user?.role === 'superadmin') && (
                      <button onClick={() => handleAccept(selectedThread._id, reply._id)} style={{ marginTop: 6, fontSize: 10, background: 'none', border: '1px solid var(--color-teal)', borderRadius: 3, cursor: 'pointer', color: 'var(--color-teal)', padding: '2px 8px' }}>
                        Accept as answer
                      </button>
                    )}
                  </div>
                </div>
                {reply.replies?.length > 0 && (
                  <NestedReplies replies={reply.replies} threadId={selectedThread._id} onVote={handleVote} onAccept={handleAccept} currentUser={user} />
                )}
              </div>
            ))}
          </div>

          {!selectedThread.isLocked && user && (
            <form onSubmit={handleReply} style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8, background: 'var(--color-surface)', position: 'sticky', bottom: 0 }}>
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
              />
              <button type="submit" disabled={replySubmitting || !replyText.trim()} style={{ padding: '8px 14px', background: replySubmitting || !replyText.trim() ? 'var(--color-border)' : 'var(--color-primary)', color: replySubmitting || !replyText.trim() ? 'var(--color-text-muted)' : 'var(--color-inv-text)', border: 'none', borderRadius: 'var(--radius)', fontSize: 12, cursor: replySubmitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                {replySubmitting ? '…' : 'Reply'}
              </button>
            </form>
          )}
        </div>
      )}

      {showCreate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleCreate} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '24px', width: 500, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>New Thread</h3>
            <input
              value={createData.title}
              onChange={e => setCreateData(d => ({ ...d, title: e.target.value }))}
              placeholder="Thread title…"
              style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
            />
            <textarea
              value={createData.body}
              onChange={e => setCreateData(d => ({ ...d, body: e.target.value }))}
              placeholder="Describe the issue or discussion topic…"
              rows={5}
              style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={createData.categoryTag}
                onChange={e => setCreateData(d => ({ ...d, categoryTag: e.target.value }))}
                style={{ padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 12, background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
              >
                {Object.entries(SECTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input
                value={createData.labels}
                onChange={e => setCreateData(d => ({ ...d, labels: e.target.value }))}
                placeholder="Labels (comma-separated)"
                style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm" onClick={() => setShowCreate(false)} style={{ background: 'var(--color-border)' }}>Cancel</button>
              <button type="submit" disabled={createSubmitting || !createData.title.trim() || !createData.body.trim()} className="btn btn-primary btn-sm">
                {createSubmitting ? 'Creating…' : 'Create Thread'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}