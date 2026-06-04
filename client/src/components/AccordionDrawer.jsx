import { useEffect, useRef, useState } from 'react';
import { executeOAQAudioTrackSync, stopAudio, isSupported } from '../services/audioController';
import RecommendationRail from './RecommendationRail';
import YakshaViewport from './YakshaViewport';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AccordionDrawer({ entry, isOpen, sessionHistory, onViewRecRelated }) {
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const [voiceActive, setVoiceActive] = useState(false);
  const [upvotes, setUpvotes] = useState(entry.upvoteCount || 0);
  const [userVote, setUserVote] = useState(() => {
    const userId = user?._id;
    if (!userId) return null;
    if (entry.upvotedBy?.some(id => id === userId || id?._id === userId)) return 'up';
    if (entry.downvotedBy?.some(id => id === userId || id?._id === userId)) return 'down';
    return null;
  });
  const didRecord = useRef(false);

  // Record co-occurrence for recommendation engine
  useEffect(() => {
    if (isOpen && user && !didRecord.current && sessionHistory.length > 0) {
      didRecord.current = true;
      api.post(`/oaq/${entry._id}/view`, { sessionHistory }).catch(() => {});
    }
  }, [isOpen]);

  // Voice playback
  useEffect(() => {
    if (isOpen && voiceActive && entry.answer) {
      executeOAQAudioTrackSync(entry.answer);
    }
    if (!isOpen || !voiceActive) {
      stopAudio();
    }
    return () => stopAudio();
  }, [isOpen, voiceActive]);

  const handleVoice = () => {
    if (!isSupported()) { addToast('Voice not supported in this browser'); return; }
    setVoiceActive(v => !v);
  };

  const handleVote = async (type) => {
    if (!user) { addToast('Sign in to vote'); return; }
    try {
      const updated = await api.patch(`/oaq/issues/${entry._id}/vote`, { type: 'up' });
      setUpvotes(updated.upvoteCount);
      setUserVote(prev => prev === 'up' ? null : 'up');
    } catch (err) {
      addToast(err.message, { type: 'error' });
    }
  };

  const handleCopy = () => {
    if (!entry.answer) return;
    navigator.clipboard.writeText(entry.answer).then(() => {
      addToast('Answer copied!', { type: 'success' });
    }).catch(() => {
      addToast('Copy failed', { type: 'error' });
    });
  };

  if (!isOpen) return null;

  return (
    <div className="accordion-drawer">
      <p style={{ lineHeight: 1.7 }}>{entry.answer || <em style={{ color: 'var(--color-text-muted)' }}>No answer yet — be the first to resolve this in the Resolver.</em>}</p>

      {entry.answer && (
        <YakshaViewport
          activeText={entry.answer.slice(0, 120) + (entry.answer.length > 120 ? '…' : '')}
          auditStatus="pass"
        />
      )}

      <div className="accordion-drawer-meta">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={() => handleVote('up')}
            style={{
              background: userVote === 'up' ? 'var(--color-teal)' : 'transparent',
              color: userVote === 'up' ? 'var(--color-inv-text)' : 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 8px',
              fontFamily: 'var(--font-mono)',
              transition: 'all 0.2s ease',
              minWidth: '28px',
              textAlign: 'center',
            }}
            title={userVote === 'up' ? "Remove vote" : "Upvote"}
          >
            {upvotes}
          </button>
        </div>
        {entry.answer && (
          <button className={`voice-btn ${voiceActive ? 'active' : ''}`} onClick={handleVoice}>
            {voiceActive ? '◼ Stop' : '▶ Listen'} (en-IN)
          </button>
        )}
        {entry.answer && (
          <button className="upvote-btn" onClick={handleCopy} title="Copy answer">
            📋 Copy
          </button>
        )}
        {entry.categoryTag && (
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            §{entry.categoryTag}
          </span>
        )}
        {entry.resolvedBy?.name && (
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Resolved by {entry.resolvedBy.name}
          </span>
        )}
      </div>

      <RecommendationRail issueId={entry._id} onSelect={onViewRecRelated} />
    </div>
  );
}
