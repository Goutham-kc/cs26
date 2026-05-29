import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function SectionFilter({ onChange }) {
  const [sections, setSections] = useState([]);
  const [selected, setSelected] = useState([]);
  const [hovered, setHovered]   = useState(null);

  useEffect(() => {
    api.get('/sections').then(setSections).catch(console.error);
  }, []);

  const toggle = (id) => {
    const next = selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id];
    setSelected(next);
    onChange(next);
  };

  const clearAll = () => {
    setSelected([]);
    onChange([]);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: hovered ? 'absolute' : 'hidden',
        top: '100%', left: 0, zIndex: 100,
        fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-secondary)',
        padding: '8px 14px', background: 'var(--color-surface)',
        border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
        lineHeight: 1.6, maxWidth: 320, marginTop: 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        whiteSpace: 'normal', wordBreak: 'break-word'
      }}>
        {sections.find(s => s.sectionId === hovered)?.description}
      </div>
      <div className="filter-bar">
        {sections.map(s => (
          <button
            key={s.sectionId}
            onClick={() => toggle(s.sectionId)}
            onMouseEnter={() => setHovered(s.sectionId)}
            onMouseLeave={() => setHovered(null)}
            className={`filter-chip ${selected.includes(s.sectionId) ? 'active' : ''}`}
            style={selected.includes(s.sectionId) ? { borderColor: s.color, color: s.color, boxShadow: `0 0 0 1px ${s.color}33` } : {}}
          >
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: s.color, marginRight: 5, verticalAlign: 'middle' }} />
            {s.label}
          </button>
        ))}
        {selected.length > 0 && (
          <button className="filter-chip" onClick={clearAll} style={{ opacity: 0.5 }}>
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}
