export default function NavBar({ title, subtitle, onBack, actions }) {
  return (
    <div className="nav-bar">
      {onBack && (
        <button className="back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
      )}
      {!onBack && <div className="logo">吴熙</div>}
      {title && (
        <div style={{ flex: 1, paddingLeft: onBack ? 4 : 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{subtitle}</div>
          )}
        </div>
      )}
      {actions}
    </div>
  );
}
