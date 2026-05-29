export default function YakshaViewport({ activeText, auditStatus }) {
  return (
    <div className="yaksha-viewport">
      <span className="yaksha-label">◈ YAKSHA-MINI · AUDIT ENGINE</span>
      <p className="yaksha-text">{activeText || 'Awaiting input...'}</p>
      {auditStatus && (
        <span className={`audit-badge ${auditStatus}`}>
          {auditStatus === 'pass' ? '✓ VALIDATED' : '✗ FLAGGED'}
        </span>
      )}
    </div>
  );
}
