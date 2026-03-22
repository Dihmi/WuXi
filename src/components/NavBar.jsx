import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function NavBar({
  title, subtitle, onBack, actions,
  /* home-screen extras */
  currentProfile, onThemeClick, onProfileClick, onLogout, onWall, onLeaderboard,
  onExport, onImport,
}) {
  const [dropOpen, setDropOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const dropRef = useRef(null);
  const importRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  const isHome = !onBack;

  return (
    <>
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

      {/* Home-screen right side controls */}
      {isHome && currentProfile && (
        <>
          {/* Leaderboard */}
          <button className="nav-icon-btn" onClick={onLeaderboard} title="Leaderboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2"  y="11" width="5" height="11" rx="1"/>
              <rect x="9"  y="6"  width="5" height="16" rx="1"/>
              <rect x="16" y="2"  width="5" height="20" rx="1"/>
            </svg>
          </button>

          {/* Hanzi Wall */}
          <button className="nav-icon-btn" onClick={onWall} title="Hanzi Wall">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>

          {/* Profile pill with dropdown */}
          <div className="nav-profile-wrap" ref={dropRef}>
            <button
              className="nav-profile-btn"
              onClick={() => setDropOpen(v => !v)}
            >
              {currentProfile.photoURL ? (
                <img
                  src={currentProfile.photoURL}
                  alt={currentProfile.name}
                  referrerPolicy="no-referrer"
                  style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <span className="nav-profile-avatar">{currentProfile.avatar}</span>
              )}
              <span className="nav-profile-name">{currentProfile.name}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {dropOpen && (
              <div className="profile-dropdown">
                <button
                  className="profile-dropdown-item"
                  onClick={() => { setDropOpen(false); onThemeClick(); }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                  </svg>
                  Change Theme
                </button>
                <div className="profile-dropdown-divider" />
                <input
                  ref={importRef}
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={(e) => { onImport(e); setDropOpen(false); }}
                />
                <button
                  className="profile-dropdown-item"
                  onClick={() => importRef.current?.click()}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Import Progress
                </button>
                <button
                  className="profile-dropdown-item"
                  onClick={() => { setDropOpen(false); onExport(); }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export Progress
                </button>
                <div className="profile-dropdown-divider" />
                <button
                  className="profile-dropdown-item danger"
                  onClick={() => { setDropOpen(false); setConfirmLogout(true); }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>

    {/* ── Logout confirmation modal ──────────────────────────── */}
    {confirmLogout && createPortal(
      <>
        <div className="modal-backdrop" onClick={() => setConfirmLogout(false)} />
        <div className="logout-confirm-dialog">
          <div className="logout-confirm-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <div className="logout-confirm-title">Log out?</div>
          <div className="logout-confirm-msg">
            Any unsaved changes will be lost.
          </div>
          <div className="logout-confirm-actions">
            <button className="btn btn-secondary" onClick={() => setConfirmLogout(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={() => { setConfirmLogout(false); onLogout(); }}>
              Log Out
            </button>
          </div>
        </div>
      </>,
      document.body
    )}
    </>
  );
}
