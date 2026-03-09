import { THEMES } from '../hooks/useTheme';

export default function ThemeSelector({ currentTheme, onSelect, onClose }) {
  const dark  = THEMES.filter(t => t.group === 'dark');
  const light = THEMES.filter(t => t.group === 'light');

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="theme-modal slide-up">
        <div className="theme-modal-header">
          <span className="theme-modal-title">Appearance</span>
          <button className="btn btn-ghost theme-modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="theme-group-label">Dark</div>
        <div className="theme-grid theme-grid-dark">
          {dark.map(t => <ThemeCard key={t.id} t={t} active={currentTheme === t.id} onSelect={onSelect} onClose={onClose} />)}
        </div>

        <div className="theme-group-label" style={{ marginTop: 16 }}>Light</div>
        <div className="theme-grid theme-grid-light">
          {light.map(t => <ThemeCard key={t.id} t={t} active={currentTheme === t.id} onSelect={onSelect} onClose={onClose} />)}
        </div>
      </div>
    </>
  );
}

function ThemeCard({ t, active, onSelect, onClose }) {
  return (
    <button
      className={`theme-card${active ? ' active' : ''}`}
      onClick={() => { onSelect(t.id); onClose(); }}
    >
      <div className="theme-swatches">
        {t.swatch.map((c, i) => (
          <div
            key={i}
            className="theme-swatch"
            style={{
              background: c,
              border: i === 1 ? '1.5px solid rgba(128,128,128,0.3)' : 'none',
            }}
          />
        ))}
      </div>
      <div className="theme-card-name">{t.name}</div>
      <div className="theme-card-desc">{t.desc}</div>
      {active && (
        <div className="theme-card-check">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
}
