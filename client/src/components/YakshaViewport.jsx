export default function YakshaViewport({ activeText, auditStatus, auditReason }) {
  return (
    <div className="yaksha-viewport">
      <span className="yaksha-label">◈ YAKSHA-MINI · AUDIT ENGINE</span>
      <p className="yaksha-text">{activeText || 'Awaiting input...'}</p>
      {auditStatus && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <span className={`audit-badge ${auditStatus}`} style={{ marginTop: 0 }}>
            {auditStatus === 'pass' ? '✓ VALIDATED' : '✗ FLAGGED'}
          </span>
          {auditStatus === 'fail' && auditReason && (
            <span style={{ fontSize: 11, color: 'var(--color-red)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
              ({auditReason})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
