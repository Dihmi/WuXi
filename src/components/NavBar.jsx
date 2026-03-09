export default function NavBar({ title, subtitle, onBack, actions }) {
  return (
    <div className="nav-bar">
      {onBack ? (
        <button className="back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
      ) : (
        <div className="logo">吴熙</div>
      )}

      {title && (
        <div className="nav-title-block">
          <div className="nav-title">{title}</div>
          {subtitle && <div className="nav-subtitle">{subtitle}</div>}
        </div>
      )}

      {actions}
    </div>
  );
}
