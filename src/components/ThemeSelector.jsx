import { THEMES } from '../hooks/useTheme';

export default function ThemeSelector({ currentTheme, onSelect, onClose }) {
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

        <div className="theme-grid">
          {THEMES.map(t => (
            <button
              key={t.id}
              className={`theme-card${currentTheme === t.id ? ' active' : ''}`}
              onClick={() => { onSelect(t.id); onClose(); }}
            >
              <div className="theme-swatches">
                {t.swatch.map((c, i) => (
                  <div key={i} className="theme-swatch" style={{ background: c }} />
                ))}
              </div>
              <div className="theme-card-name">{t.name}</div>
              <div className="theme-card-desc">{t.desc}</div>
              {currentTheme === t.id && (
                <div className="theme-card-check">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
