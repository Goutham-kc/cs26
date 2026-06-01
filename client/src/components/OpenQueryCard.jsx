import { useState, useEffect, useRef } from 'react';
import { oaq, api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function OpenQueryCard({ issue, currentUser, onVote }) {
  const { addToast } = useToast();
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState(null);
  const [showDup, setShowDup] = useState(false);
  const [dupQ, setDupQ] = useState('');
  const [dupResults, setDupResults] = useState([]);
  const [dupLoading, setDupLoading] = useState(false);
  const [markingDup, setMarkingDup] = useState(false);

  const hasAnswered = issue.communityReplies?.some(
    r => r.repliedBy?._id === currentUser?._id || r.repliedBy === currentUser?._id
  );

  const handleVote = async (replyId, type) => {
    if (votingId) return;
    setVotingId(replyId);
    try {
      const result = await oaq.voteReply(issue._id, replyId, type);
      if (result.code === 'AUTO_PROMOTED') addToast('Answer promoted to resolved! +50 SP awarded', { type: 'success' });
      onVote();
    } catch (e) {
      addToast(e.message, { type: 'error' });
    } finally {
      setVotingId(null);
    }
  };

  const isAuthor = issue.raisedBy?._id === currentUser?._id || issue.raisedBy === currentUser?._id;

  const handleMarkDuplicate = async (targetId) => {
    setMarkingDup(true);
    try {
      await oaq.markDuplicate(issue._id, targetId);
      addToast('Marked as duplicate', { type: 'success' });
      setShowDup(false);
      setDupQ('');
      setDupResults([]);
      onVote();
    } catch (e) {
      addToast(e.message, { type: 'error' });
    } finally {
      setMarkingDup(false);
    }
  };

  const dupTimer = useRef(null);
  useEffect(() => {
    if (!dupQ.trim() || dupQ.length < 3) { setDupResults([]); return; }
    clearTimeout(dupTimer.current);
    dupTimer.current = setTimeout(async () => {
      setDupLoading(true);
      try {
        const results = await api.get(`/oaq/search?q=${encodeURIComponent(dupQ)}`);
        setDupResults(results.filter(r => r._id !== issue._id).slice(0, 5));
      } catch { setDupResults([]); }
      finally { setDupLoading(false); }
    }, 400);
    return () => clearTimeout(dupTimer.current);
  }, [dupQ, issue._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const result = await oaq.submitReply(issue._id, replyText);
      if (result.code === 'AUTO_PROMOTED') addToast('Answer auto-promoted to resolved!', { type: 'success' });
      else addToast('Answer submitted', { type: 'success' });
      setReplyText('');
      onVote();
    } catch (e) {
      addToast(e.message, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', background: 'var(--color-surface)' }}>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>§{issue.categoryTag} · <button onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('oaq:show-user-profile', { detail: issue.raisedBy._id || issue.raisedBy })); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}>{issue.raisedBy?.name || 'Unknown'}</button> · {new Date(issue.createdAt).toLocaleDateString()}</span>
          {hasAnswered && (
            <span style={{ background: 'var(--color-teal)', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 3, fontWeight: 600, letterSpacing: '0.08em' }}>✓ YOU ANSWERED</span>
          )}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{issue.queryText}</div>
      </div>

      {issue.communityReplies.map(reply => {
        const score = (reply.upvotes || 0) - (reply.downvotes || 0);
        return (
          <div key={reply._id} style={{ padding: '10px 18px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 30 }}>
              <button onClick={() => handleVote(reply._id, 'up')} disabled={votingId === reply._id} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer', fontSize: 11, padding: '2px 5px', color: 'var(--color-text-muted)' }}>▲</button>
              <span style={{ fontSize: 12, fontWeight: 700, color: score > 0 ? 'var(--color-teal)' : score < 0 ? 'var(--color-red)' : 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{score}</span>
              <button onClick={() => handleVote(reply._id, 'down')} disabled={votingId === reply._id} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer', fontSize: 11, padding: '2px 5px', color: 'var(--color-text-muted)' }}>▼</button>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 3, fontFamily: 'var(--font-mono)' }}>
                <button onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('oaq:show-user-profile', { detail: reply.repliedBy?._id || reply.repliedBy })); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}>{reply.repliedBy?.name || 'Unknown'}</button>
                {reply.isPromoted && <span style={{ color: 'var(--color-teal)', marginLeft: 6, fontWeight: 600 }}>✓ PROMOTED</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{reply.replyText}</div>
            </div>
          </div>
        );
      })}

      {currentUser && (
        hasAnswered ? (
          <div style={{ padding: '10px 18px', borderTop: '1px solid var(--color-border)', fontSize: 11, color: 'var(--color-teal)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
            ✓ You submitted an answer to this issue
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '10px 18px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
            <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Submit your answer…" style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
            <button type="submit" disabled={submitting || !replyText.trim()} style={{ padding: '6px 14px', background: submitting || !replyText.trim() ? 'var(--color-border)' : 'var(--color-primary)', color: submitting || !replyText.trim() ? 'var(--color-text-muted)' : 'var(--color-inv-text)', border: 'none', borderRadius: 'var(--radius)', fontSize: 12, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              {submitting ? '…' : 'Submit'}
            </button>
          </form>
        )
      )}

      {isAuthor && (
        <div style={{ padding: '10px 18px', borderTop: '1px solid var(--color-border)' }}>
          {!showDup ? (
            <button onClick={() => setShowDup(true)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer', fontSize: 11, padding: '4px 10px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              + Mark as Duplicate
            </button>
          ) : (
            <div>
              <input
                value={dupQ}
                onChange={e => setDupQ(e.target.value)}
                placeholder="Search duplicate query..."
                style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', marginBottom: 6 }}
              />
              {dupLoading && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>...</div>}
              {dupResults.length > 0 && (
                <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  {dupResults.map(r => (
                    <button key={r._id} onClick={() => handleMarkDuplicate(r._id)} disabled={markingDup} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid var(--color-border)', cursor: markingDup ? 'not-allowed' : 'pointer', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                      {r.queryText}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}