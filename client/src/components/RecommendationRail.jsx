import { useState, useEffect } from 'react';
import { api } from '../services/api';

const SECTION_LABELS = {
  '01': 'ViBe', '02': 'NOC', '03': 'Teams', '04': 'Onboarding',
  '05': 'Reports', '06': 'Finance', '07': 'Schedule', '08': 'Lab',
  '09': 'Eval', '10': 'SP', '11': 'Yaksha', '12': 'Tracker', '13': 'General'
};

export default function RecommendationRail({ issueId, onSelect }) {
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (!issueId) return;
    api.get(`/oaq/${issueId}/related`)
      .then(setRelated)
      .catch(() => setRelated([]));
  }, [issueId]);

  if (related.length === 0) return null;

  return (
    <div className="rec-rail">
      <div className="rec-rail-title">People also asked</div>
      {related.map(item => (
        <div
          key={item._id}
          className="rec-item"
          onClick={() => onSelect && onSelect(item._id)}
        >
          <span style={{ color: 'var(--color-text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
            [{SECTION_LABELS[item.categoryTag] || item.categoryTag}]
          </span>
          <span>{item.queryText}</span>
          <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--color-text-muted)' }}>
            ↑{item.upvoteCount}
          </span>
        </div>
      ))}
    </div>
  );
}
