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

function Reply({ reply, threadId, onVote, onAccept, onReply, currentUser, depth = 0, isReplyingTo, inlineReplyText, onInlineReplyTextChange, onInlineReplySubmit, inlineReplySubmitting }) {
  const score = (reply.upvotes || 0) - (reply.downvotes || 0);
  const showInlineReply = isReplyingTo === reply._id;
  return (
    <div style={{ marginLeft: depth > 0 ? 20 : 0 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
            {reply.repliedBy?.name?.[0]?.toUpperCase() || '?'}
          </div>
          {depth > 0 && (
            <div style={{ width: 2, flex: 1, minHeight: 24, marginTop: 4, background: 'var(--color-border)', borderRadius: 1 }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingBottom: depth > 0 ? 12 : 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{reply.repliedBy?.name || 'Unknown'}</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>·</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{timeAgo(reply.timestamp)}</span>
            {reply.isPromoted && (
              <span style={{ fontSize: 10, color: 'var(--color-teal)', fontWeight: 600 }}>✓ Accepted</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{reply.replyText}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, alignItems: 'center' }}>
            <button
              onClick={() => onVote(threadId, reply._id, 'up')}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--color-text-primary)',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 600
              }}
            >
              ▲ {score}
            </button>
            <button
              onClick={() => onVote(threadId, reply._id, 'down')}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--color-text-primary)',
                padding: '4px 10px'
              }}
            >
              ▼
            </button>
            <button
              onClick={() => onReply(reply._id)}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                padding: '4px 10px'
              }}
            >
              Reply
            </button>
            {!reply.isPromoted && currentUser && (currentUser.role === 'mentor' || currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
              <button
                onClick={() => onAccept(threadId, reply._id)}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-teal)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--color-teal)',
                  padding: '4px 10px',
                  fontWeight: 600
                }}
              >
                Accept
              </button>
            )}
          </div>
          {showInlineReply && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <input
                value={inlineReplyText}
                onChange={e => onInlineReplyTextChange(e.target.value)}
                placeholder="Write a reply…"
                style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onInlineReplySubmit(reply._id)}
              />
              <button
                onClick={() => onInlineReplySubmit(reply._id)}
                disabled={inlineReplySubmitting || !inlineReplyText.trim()}
                style={{ padding: '8px 14px', background: inlineReplySubmitting || !inlineReplyText.trim() ? 'var(--color-border)' : 'var(--color-primary)', color: inlineReplySubmitting || !inlineReplyText.trim() ? 'var(--color-text-muted)' : 'var(--color-inv-text)', border: 'none', borderRadius: 'var(--radius)', fontSize: 12, cursor: inlineReplySubmitting ? 'not-allowed' : 'pointer' }}
              >
                {inlineReplySubmitting ? '…' : 'Reply'}
              </button>
              <button onClick={() => onReply(null)} style={{ padding: '8px 14px', background: 'var(--color-border)', border: 'none', borderRadius: 'var(--radius)', fontSize: 12, cursor: 'pointer' }}>✕</button>
            </div>
          )}
          {reply.replies?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {reply.replies.map(child => (
                <Reply
                  key={child._id}
                  reply={child}
                  threadId={threadId}
                  onVote={onVote}
                  onAccept={onAccept}
                  onReply={onReply}
                  currentUser={currentUser}
                  depth={depth + 1}
                  isReplyingTo={isReplyingTo}
                  inlineReplyText={inlineReplyText}
                  onInlineReplyTextChange={onInlineReplyTextChange}
                  onInlineReplySubmit={onInlineReplySubmit}
                  inlineReplySubmitting={inlineReplySubmitting}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ThreadsPage() {
  const [threadsList, setThreadsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadDetail, setThreadDetail] = useState(null);
  const [filter, setFilter] = useState({ status: '', priority: '', category: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ title: '', body: '', categoryTag: '13', labels: '' });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [inlineReplyText, setInlineReplyText] = useState('');
  const [inlineReplySubmitting, setInlineReplySubmitting] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveThread, setResolveThread] = useState(null);
  const [resolveSp, setResolveSp] = useState('');
  const [resolveUserId, setResolveUserId] = useState('');
  const [resolveSubmitting, setResolveSubmitting] = useState(false);
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

  const handleOpenThread = async (threadId) => {
    setSelectedThread(null);
    try {
      const full = await threads.get(threadId);
      setThreadDetail(full);
      window.scrollTo(0, 0);
    } catch {
      addToast('Failed to load thread', 'error');
    }
  };

  const handleBack = () => {
    setSelectedThread(null);
    setThreadDetail(null);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !threadDetail) return;
    setReplySubmitting(true);
    try {
      const updated = await threads.reply(threadDetail._id, { replyText });
      setReplyText('');
      setThreadDetail(updated);
      addToast(`Reply posted (${updated.threadReplies?.length} replies)`);
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleInlineReply = async (parentReplyId) => {
    if (!inlineReplyText.trim() || !threadDetail) return;
    setInlineReplySubmitting(true);
    try {
      const updated = await threads.reply(threadDetail._id, { replyText: inlineReplyText, parentReplyId });
      setInlineReplyText('');
      setReplyingTo(null);
      setThreadDetail(updated);
      addToast(`Reply posted (${updated.threadReplies?.length} replies)`);
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setInlineReplySubmitting(false);
    }
  };

  const handleVote = async (threadId, replyId, type) => {
    try {
      await threads.voteReply(threadId, replyId, type);
      if (threadDetail?._id === threadId) {
        const full = await threads.get(threadId);
        setThreadDetail(full);
      }
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleAccept = async (threadId, replyId) => {
    try {
      await threads.acceptReply(threadId, replyId);
      addToast('Reply accepted as answer');
      if (threadDetail?._id === threadId) {
        const full = await threads.get(threadId);
        setThreadDetail(full);
      }
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
        if (threadDetail?._id === thread._id) {
          const full = await threads.get(thread._id);
          setThreadDetail(full);
        }
      } else {
        const spRaw = prompt('Close thread — award SP to thread creator? (Enter SP amount or leave blank to close without SP)');
        if (spRaw === null) return;
        const spReward = parseInt(spRaw) || 0;
        await threads.close(thread._id, { spReward, rewardUserId: thread.raisedBy._id });
        addToast(spReward > 0 ? `Thread closed — ${spReward} SP awarded` : 'Thread closed');
        if (threadDetail?._id === thread._id) {
          const full = await threads.get(thread._id);
          setThreadDetail(full);
        }
      }
      load();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleResolve = async (thread) => {
    setResolveThread(thread);
    setResolveSp('');
    setResolveUserId(thread.raisedBy?._id || '');
    setShowResolveModal(true);
  };

  const handleResolveSubmit = async () => {
    if (!resolveThread) return;
    const spReward = parseInt(resolveSp) || 0;
    setResolveSubmitting(true);
    try {
      const result = await threads.resolve(resolveThread._id, { spReward, rewardUserId: resolveUserId || null });
      addToast(result.awarded ? `Thread resolved — ${result.awarded.sp} SP awarded` : 'Thread marked as resolved');
      setShowResolveModal(false);
      if (threadDetail?._id === resolveThread._id) {
        const full = await threads.get(resolveThread._id);
        setThreadDetail(full);
      }
      load();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setResolveSubmitting(false);
    }
  };

  const handleResolveAsOp = async (thread) => {
    try {
      const result = await threads.resolve(thread._id, { spReward: 0, rewardUserId: null });
      addToast('Thread marked as resolved');
      if (threadDetail?._id === thread._id) {
        const full = await threads.get(thread._id);
        setThreadDetail(full);
      }
      load();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const getThreadParticipants = () => {
    if (!threadDetail) return [];
    const users = new Map();
    if (threadDetail.raisedBy?._id) {
      users.set(threadDetail.raisedBy._id.toString(), { _id: threadDetail.raisedBy._id, name: threadDetail.raisedBy.name, role: threadDetail.raisedBy.role });
    }
    (threadDetail.threadReplies || []).forEach(r => {
      if (r.repliedBy?._id) {
        users.set(r.repliedBy._id.toString(), { _id: r.repliedBy._id, name: r.repliedBy.name, role: r.repliedBy.role });
      }
    });
    return Array.from(users.values());
  };

  const buildReplyTree = (replies, parentId = null) => {
    return replies
      .filter(r => {
        if (parentId == null) return r.parentReplyId == null;
        return r.parentReplyId && r.parentReplyId.toString() === parentId.toString();
      })
      .map(r => ({ ...r, replies: buildReplyTree(replies, r._id) }));
  };

  if (threadDetail) {
    return (
      <div className="app-shell">
        <main className="main-content">
          <div style={{ marginBottom: 24 }}>
            <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}>
              ← Back to threads
            </button>
          </div>

          <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--color-surface)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>§{threadDetail.categoryTag}</span>
                <span className={`badge ${threadDetail.status === 'Open' ? 'badge-open' : 'badge-resolved'}`}>{threadDetail.status}</span>
                {threadDetail.priority === 'HIGH' && <span className="badge badge-high">HIGH</span>}
                {threadDetail.isLocked && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>🔒</span>}
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{threadDetail.title}</h1>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{threadDetail.raisedBy?.name}</span>
                {user?._id === threadDetail.raisedBy?._id && (
                  <span style={{ background: 'var(--color-primary)', color: 'var(--color-inv-text)', padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>OP</span>
                )}
                <span>·</span>
                <span>{timeAgo(threadDetail.createdAt)}</span>
                <span>·</span>
                <span>▲ {threadDetail.upvoteCount}</span>
                <span>·</span>
                <span>💬 {threadDetail.threadReplies?.length}</span>
              </div>
            </div>

            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>{threadDetail.body}</p>
              {threadDetail.labels?.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap' }}>
                  {threadDetail.labels.map(l => <span key={l} style={{ fontSize: 11, padding: '2px 8px', border: '1px solid var(--color-border)', borderRadius: 3, color: 'var(--color-text-muted)' }}>{l}</span>)}
                </div>
              )}
              {threadDetail.resolvedBy && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-teal)' }}>
                  ✓ Resolved by {threadDetail.resolvedBy.name}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {(user?.role === 'mentor' || user?.role === 'admin' || user?.role === 'superadmin') && (
                  <button
                    onClick={() => handleLock(threadDetail)}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      color: 'var(--color-text-primary)',
                      padding: '6px 14px',
                      fontWeight: 500
                    }}
                  >
                    {threadDetail.isLocked ? 'Unlock' : 'Lock'}
                  </button>
                )}
                {user?._id === threadDetail.raisedBy?._id && threadDetail.status !== 'Resolved' && (
                  <button
                    onClick={() => handleResolveAsOp(threadDetail)}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      color: 'var(--color-text-secondary)',
                      padding: '6px 14px',
                      fontWeight: 500
                    }}
                  >
                    ✓ Mark Resolved
                  </button>
                )}
                {(user?.role === 'admin' || user?.role === 'superadmin') && threadDetail.status !== 'Resolved' && (
                  <button
                    onClick={() => handleResolve(threadDetail)}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-teal)',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      color: 'var(--color-teal)',
                      padding: '6px 14px',
                      fontWeight: 600
                    }}
                  >
                    ✓ Mark Resolved (Award SP)
                  </button>
                )}
                <button
                  onClick={() => handleUpvote(threadDetail)}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    color: 'var(--color-text-primary)',
                    padding: '6px 14px',
                    fontWeight: 600
                  }}
                >
                  ▲ Upvote
                </button>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>
                {threadDetail.threadReplies?.length || 0} Replies
              </h2>

              {threadDetail.threadReplies?.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
                  No replies yet. Be the first to respond.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {buildReplyTree(threadDetail.threadReplies || []).map(reply => (
                  <Reply
                    key={reply._id}
                    reply={reply}
                    threadId={threadDetail._id}
                    onVote={handleVote}
                    onAccept={handleAccept}
                    onReply={setReplyingTo}
                    currentUser={user}
                    depth={0}
                    isReplyingTo={replyingTo}
                    inlineReplyText={inlineReplyText}
                    onInlineReplyTextChange={setInlineReplyText}
                    onInlineReplySubmit={handleInlineReply}
                    inlineReplySubmitting={inlineReplySubmitting}
                  />
                ))}
              </div>
            </div>

            {!threadDetail.isLocked && user && (
              <form onSubmit={handleReply} style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 10, background: 'var(--color-surface)' }}>
                <input
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Write a reply…"
                  style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'var(--font-mono)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                />
                <button type="submit" disabled={replySubmitting || !replyText.trim()} style={{ padding: '10px 18px', background: replySubmitting || !replyText.trim() ? 'var(--color-border)' : 'var(--color-primary)', color: replySubmitting || !replyText.trim() ? 'var(--color-text-muted)' : 'var(--color-inv-text)', border: 'none', borderRadius: 'var(--radius)', fontSize: 13, cursor: replySubmitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                  {replySubmitting ? '…' : 'Reply'}
                </button>
              </form>
            )}
          </div>
        </main>

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

      {showResolveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '24px', width: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Mark as Resolved</h3>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4, display: 'block' }}>Award SP (optional)</label>
              <input
                type="number"
                value={resolveSp}
                onChange={e => setResolveSp(e.target.value)}
                placeholder="Enter SP amount or leave blank"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4, display: 'block' }}>Award SP to</label>
              <select
                value={resolveUserId}
                onChange={e => setResolveUserId(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 12, background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
              >
                {getThreadParticipants().map(u => (
                  <option key={u._id} value={u._id}>{u.name} {u.role ? `(${u.role})` : ''}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm" onClick={() => setShowResolveModal(false)} style={{ background: 'var(--color-border)' }}>Cancel</button>
              <button
                type="button"
                onClick={handleResolveSubmit}
                disabled={resolveSubmitting}
                className="btn btn-primary btn-sm"
              >
                {resolveSubmitting ? 'Resolving…' : 'Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
            <div style={{ padding: '12px 16px', background: 'var(--color-surface)', cursor: 'pointer' }} onClick={() => handleOpenThread(thread._id)}>
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
                    {thread.assignedTo?.name && <span> · Assigned: {thread.assignedTo.name}</span>}
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

      {showResolveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '24px', width: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Mark as Resolved</h3>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4, display: 'block' }}>Award SP (optional)</label>
              <input
                type="number"
                value={resolveSp}
                onChange={e => setResolveSp(e.target.value)}
                placeholder="Enter SP amount or leave blank"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4, display: 'block' }}>Award SP to</label>
              <select
                value={resolveUserId}
                onChange={e => setResolveUserId(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 12, background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
              >
                {getThreadParticipants().map(u => (
                  <option key={u._id} value={u._id}>{u.name} {u.role ? `(${u.role})` : ''}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-sm" onClick={() => setShowResolveModal(false)} style={{ background: 'var(--color-border)' }}>Cancel</button>
              <button
                type="button"
                onClick={handleResolveSubmit}
                disabled={resolveSubmitting}
                className="btn btn-primary btn-sm"
              >
                {resolveSubmitting ? 'Resolving…' : 'Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}