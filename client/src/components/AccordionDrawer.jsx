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
    if (!user) { addToast(`Sign in to ${type}vote`); return; }
    try {
      const updated = await api.patch(`/oaq/issues/${entry._id}/vote`, { type });
      setUpvotes(updated.upvoteCount);
      if (type === 'up') {
        setUserVote(prev => prev === 'up' ? null : 'up');
      } else {
        setUserVote(prev => prev === 'down' ? null : 'down');
      }
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
      <p style={{ lineHeight: 1.7 }}>{entry.answer || <em style={{ color: 'var(--color-text-muted)' }}>No answer yet — be the first to resolve this in the Tracker.</em>}</p>

      {entry.answer && (
        <YakshaViewport
          activeText={entry.answer.slice(0, 120) + (entry.answer.length > 120 ? '…' : '')}
          auditStatus="pass"
        />
      )}

      <div className="accordion-drawer-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--color-surface-hover)', borderRadius: 'var(--radius)', padding: '2px 6px', border: '1px solid var(--color-border)' }}>
          <button 
            className="upvote-btn" 
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: userVote === 'up' ? 'var(--color-teal)' : 'var(--color-text-muted)', fontWeight: userVote === 'up' ? 'bold' : 'normal' }}
            onClick={() => handleVote('up')}
          >
            ▲ Upvote
          </button>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: upvotes > 0 ? 'var(--color-teal)' : upvotes < 0 ? 'var(--color-red)' : 'var(--color-text-muted)', padding: '0 4px' }}>
            {upvotes}
          </span>
          <button 
            className="upvote-btn" 
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: userVote === 'down' ? 'var(--color-red)' : 'var(--color-text-muted)', fontWeight: userVote === 'down' ? 'bold' : 'normal' }}
            onClick={() => handleVote('down')}
          >
            ▼ Downvote
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
