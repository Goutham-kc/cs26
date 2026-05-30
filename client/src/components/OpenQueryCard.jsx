import { useState } from 'react';
import { oaq } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function OpenQueryCard({ issue, currentUser, onVote }) {
  const { addToast } = useToast();
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState(null);

  const handleVote = async (replyId, type) => {
    if (votingId) return;
    setVotingId(replyId);
    try {
      const result = await oaq.voteReply(issue._id, replyId, type);
      if (result.code === 'AUTO_PROMOTED') addToast('Answer promoted to resolved! +50 SP awarded');
      onVote();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setVotingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const result = await oaq.submitReply(issue._id, replyText);
      if (result.code === 'AUTO_PROMOTED') addToast('Answer auto-promoted to resolved!');
      else addToast('Answer submitted');
      setReplyText('');
      onVote();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', background: 'var(--color-surface)' }}>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
          §{issue.categoryTag} · {issue.raisedBy?.name || 'Unknown'} · {new Date(issue.createdAt).toLocaleDateString()}
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
                {reply.repliedBy?.name || 'Unknown'}
                {reply.isPromoted && <span style={{ color: 'var(--color-teal)', marginLeft: 6, fontWeight: 600 }}>✓ PROMOTED</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{reply.replyText}</div>
            </div>
          </div>
        );
      })}

      {currentUser && (
        <form onSubmit={handleSubmit} style={{ padding: '10px 18px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
          <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Submit your answer…" style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }} />
          <button type="submit" disabled={submitting || !replyText.trim()} style={{ padding: '6px 14px', background: submitting || !replyText.trim() ? 'var(--color-border)' : 'var(--color-primary)', color: submitting || !replyText.trim() ? 'var(--color-text-muted)' : 'var(--color-inv-text)', border: 'none', borderRadius: 'var(--radius)', fontSize: 12, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
            {submitting ? '…' : 'Submit'}
          </button>
        </form>
      )}
    </div>
  );
}