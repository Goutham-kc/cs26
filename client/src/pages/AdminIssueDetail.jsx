import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { admin, oaq } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/SharedModals';

const T = {
  bg:           'var(--color-bg)',
  surface:      'var(--color-surface)',
  surfaceHover: 'var(--color-surface-hover)',
  border:       'var(--color-border)',
  primary:      'var(--color-text-primary)',
  secondary:    'var(--color-text-secondary)',
  muted:        'var(--color-text-muted)',
  invBg:        'var(--color-invert-bg)',
  invText:      'var(--color-invert-text)',
  teal:         'var(--color-teal)',
  tealDark:     'var(--color-teal-dark)',
  tealLight:    'var(--color-teal-light)',
  navyDark:     'var(--color-navy-dark)',
  navyLight:    'var(--color-navy-light)',
  red:          'var(--color-red)',
  redDark:      'var(--color-red-dark)',
  redLight:     'var(--color-red-light)',
  radius:       'var(--radius)',
  mono:         'var(--font-mono)',
};

export default function AdminIssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customAnswer, setCustomAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmReplyTarget, setConfirmReplyTarget] = useState(null);

  const fetchIssue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await admin.getIssue(id);
      setIssue(data);
    } catch (err) {
      addToast(err.message || 'Failed to fetch issue details', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  const handlePromoteReply = async () => {
    if (!confirmReplyTarget) return;
    setSubmitting(true);
    try {
      await oaq.promoteReply(issue._id, confirmReplyTarget._id);
      addToast('Query resolved and 50 SP points awarded to the replier!', { type: 'success' });
      setConfirmReplyTarget(null);
      fetchIssue();
    } catch (err) {
      addToast(err.message || 'Failed to resolve issue', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomResolve = async (e) => {
    e.preventDefault();
    if (!customAnswer.trim()) return;
    setSubmitting(true);
    try {
      await admin.resolveIssue(issue._id, customAnswer.trim());
      addToast('Query resolved with custom answer!', { type: 'success' });
      setCustomAnswer('');
      fetchIssue();
    } catch (err) {
      addToast(err.message || 'Failed to resolve issue', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', background: T.bg }}>
        <div className="spinner" />
        <span style={{ marginLeft: 12, color: T.muted, fontFamily: T.mono }}>Loading query details...</span>
      </div>
    );
  }

  if (!issue) {
    return (
      <div style={{ padding: 24, textAlign: 'center', background: T.bg, minHeight: '80vh' }}>
        <h3 style={{ color: T.red, marginBottom: 12 }}>Issue Not Found</h3>
        <button onClick={() => navigate('/admin')} className="btn" style={{ background: T.invBg, color: T.invText }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', minHeight: 'calc(100vh - 52px)', background: T.bg }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        {/* Navigation header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button 
            onClick={() => navigate('/admin')} 
            className="btn btn-ghost" 
            style={{ padding: '6px 12px', color: T.secondary, fontSize: 13, border: `1px solid ${T.border}` }}
          >
            ← Back to Dashboard
          </button>
          <span style={{ color: T.muted, fontSize: 13, fontFamily: T.mono }}>Issue ID: #{issue.issueId}</span>
        </div>

        {/* Query details card */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ background: T.navyLight, color: T.navyDark, padding: '2px 8px', borderRadius: T.radius, fontSize: 11, fontWeight: 600 }}>
              Category: {issue.categoryTag}
            </span>
            <span style={{ 
              background: issue.priority === 'HIGH' ? T.redLight : T.surfaceHover, 
              color: issue.priority === 'HIGH' ? T.redDark : T.primary, 
              padding: '2px 8px', borderRadius: T.radius, fontSize: 11, fontWeight: 600 
            }}>
              {issue.priority} Priority
            </span>
            <span style={{ 
              background: issue.status === 'Resolved' ? T.tealLight : T.redLight, 
              color: issue.status === 'Resolved' ? T.tealDark : T.redDark, 
              padding: '2px 8px', borderRadius: T.radius, fontSize: 11, fontWeight: 600 
            }}>
              {issue.status}
            </span>
            <span style={{ color: T.muted, fontSize: 11, padding: '2px 4px', fontFamily: T.mono }}>
              ▲ {issue.upvoteCount} Votes
            </span>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 600, color: T.primary, lineHeight: 1.4, marginBottom: 16 }}>
            {issue.queryText}
          </h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: T.muted, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
            <div>Raised by: <strong style={{ color: T.secondary }}>{issue.raisedBy?.name || 'Unknown'}</strong> ({issue.raisedBy?.role})</div>
            <div style={{ fontFamily: T.mono }}>Created: {new Date(issue.createdAt).toLocaleString()}</div>
          </div>
        </div>

        {/* Resolution section if Resolved */}
        {issue.status === 'Resolved' && (
          <div style={{ background: T.tealLight, border: `1px solid ${T.teal}`, borderRadius: T.radius, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>✓</span>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.tealDark }}>Accepted Resolution</h3>
            </div>
            <p style={{ fontSize: 13, color: T.primary, whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: 12 }}>
              {issue.answer}
            </p>
            <div style={{ fontSize: 11, color: T.tealDark, fontStyle: 'italic' }}>
              Resolved by: {issue.resolvedBy?.name || 'Community'}
            </div>
          </div>
        )}

        {/* Community replies list */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: T.primary }}>
            Community Replies ({issue.communityReplies?.length || 0})
          </h3>

          {(!issue.communityReplies || issue.communityReplies.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: T.muted, fontStyle: 'italic', fontSize: 13 }}>
              No replies submitted yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {issue.communityReplies.map((reply) => {
                const isThisResolution = issue.status === 'Resolved' && issue.bestReplyId === reply._id;
                
                return (
                  <div 
                    key={reply._id} 
                    style={{ 
                      padding: 16, 
                      borderRadius: T.radius, 
                      border: `1px solid ${isThisResolution ? T.teal : T.border}`,
                      background: isThisResolution ? T.tealLight : T.bg,
                      transition: 'border-color 150ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: T.primary, fontSize: 13 }}>
                          {reply.repliedBy?.name || 'Unknown User'}
                        </span>
                        <span style={{ 
                          fontSize: 10, 
                          padding: '1px 6px', 
                          borderRadius: T.radius, 
                          background: reply.repliedBy?.role === 'mentor' ? T.tealLight : T.surface, 
                          color: reply.repliedBy?.role === 'mentor' ? T.tealDark : T.secondary,
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}>
                          {reply.repliedBy?.role || 'Intern'}
                        </span>
                        {isThisResolution && (
                          <span style={{ background: T.teal, color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: T.radius, fontWeight: 600 }}>
                            ★ Solution Answer
                          </span>
                        )}
                        {reply.isPromoted && !isThisResolution && (
                          <span style={{ border: `1px solid ${T.teal}`, color: T.tealDark, fontSize: 10, padding: '1px 6px', borderRadius: T.radius, fontWeight: 600 }}>
                            Promoted
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: T.muted, fontFamily: T.mono }}>
                        <span>▲ {reply.upvotes || 0} Votes</span>
                        <span>{new Date(reply.timestamp || reply.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: 13, color: T.primary, whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: 12 }}>
                      {reply.replyText}
                    </p>

                    {/* Action buttons (only if query is open) */}
                    {issue.status === 'Open' && (
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 10, borderTop: `1px dashed ${T.border}` }}>
                        <button
                          onClick={() => setConfirmReplyTarget(reply)}
                          disabled={submitting}
                          className="btn btn-sm"
                          style={{ background: T.tealLight, color: T.tealDark, borderColor: T.teal }}
                        >
                          Accept as Resolution (+50 SP)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom Resolution Form (only if query is open) */}
        {issue.status === 'Open' && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: T.primary }}>
              Resolve with Custom Answer
            </h3>
            <form onSubmit={handleCustomResolve}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <textarea
                  value={customAnswer}
                  onChange={(e) => setCustomAnswer(e.target.value)}
                  placeholder="Type the official answer to resolve this query directly..."
                  required
                  rows={4}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: 12,
                    fontSize: 13,
                    border: `1px solid ${T.border}`,
                    borderRadius: T.radius,
                    background: T.bg,
                    color: T.primary,
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: 1.5
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={submitting || !customAnswer.trim()}
                  className="btn btn-primary"
                  style={{ minWidth: 150 }}
                >
                  {submitting ? 'Resolving...' : 'Submit Custom Answer'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* Confirmation Modal */}
      {confirmReplyTarget && (
        <ConfirmModal
          title="Resolve Query with Community Reply"
          message={`Are you sure you want to resolve this query with the reply from ${confirmReplyTarget.repliedBy?.name || 'this user'}? This will mark the query as Resolved, set the reply as the official answer, and award them 50 SP points.`}
          confirmLabel={submitting ? 'Resolving...' : 'Confirm & Award SP'}
          onConfirm={handlePromoteReply}
          onClose={() => setConfirmReplyTarget(null)}
        />
      )}
    </div>
  );
}
