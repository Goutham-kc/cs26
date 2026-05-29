import { useEffect, useRef, useState } from 'react';
import { executeOAQAudioTrackSync, stopAudio, isSupported } from '../services/audioController';
import RecommendationRail from './RecommendationRail';
import YakshaViewport from './YakshaViewport';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AccordionDrawer({ entry, isOpen, sessionHistory, onViewRecRelated }) {
  const [voiceActive, setVoiceActive] = useState(false);
  const [upvotes, setUpvotes] = useState(entry.upvoteCount || 0);
  const [upvoted, setUpvoted] = useState(false);
  const { user, token } = useAuth();
  const { addToast } = useToast();
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

  const handleUpvote = async () => {
    if (!user) { addToast('Sign in to upvote'); return; }
    if (upvoted) return;
    try {
      const updated = await api.patch(`/oaq/issues/${entry._id}/upvote`);
      setUpvotes(updated.upvoteCount);
      setUpvoted(true);
    } catch (err) {
      addToast(err.message);
    }
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
        <button className="upvote-btn" onClick={handleUpvote} disabled={upvoted}>
          ▲ {upvotes} {upvoted ? '(voted)' : 'Upvote'}
        </button>
        {entry.answer && (
          <button className={`voice-btn ${voiceActive ? 'active' : ''}`} onClick={handleVoice}>
            {voiceActive ? '◼ Stop' : '▶ Listen'} (en-IN)
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
