import { useState, useRef } from 'react';

const AVATARS = ['🐉','🦊','🐼','🦁','🐯','🦅','🌸','⚡','🌙','🔥','🌊','🍵','🎋','🏮','🎴','🦋'];

export default function ProfileModal({ profiles, onCreate, onSelect, onDelete, onLoadFile }) {
  const [view,    setView]    = useState(profiles.length === 0 ? 'create' : 'list');
  const [name,    setName]    = useState('');
  const [avatar,  setAvatar]  = useState('🐉');
  const [confirm, setConfirm] = useState(null); // id to confirm delete
  const fileRef = useRef(null);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, avatar);
    setName(''); setAvatar('🐉');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onLoadFile(file);
    e.target.value = '';
  };

  return (
    <div className="profile-overlay">
      <div className="profile-panel slide-up">

        <div className="profile-panel-logo">吴熙</div>

        {view === 'list' ? (
          <>
            <p className="profile-panel-heading">Choose profile</p>

            <div className="profile-list">
              {profiles.map(p => (
                <div key={p.id} className="profile-list-row">
                  <button
                    className="profile-item"
                    onClick={() => onSelect(p.id)}
                  >
                    <span className="profile-item-avatar">{p.avatar}</span>
                    <span className="profile-item-name">{p.name}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                  {confirm === p.id ? (
                    <div className="profile-delete-confirm">
                      <span>Delete?</span>
                      <button className="profile-delete-yes" onClick={() => { onDelete(p.id); setConfirm(null); }}>Yes</button>
                      <button className="profile-delete-no"  onClick={() => setConfirm(null)}>No</button>
                    </div>
                  ) : (
                    <button className="profile-delete-btn" onClick={() => setConfirm(p.id)} title="Delete profile">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="profile-action-row">
              <button className="btn btn-secondary profile-new-btn" onClick={() => setView('create')}>
                + New Profile
              </button>
              <button className="btn btn-secondary profile-load-btn" onClick={() => fileRef.current?.click()}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Load from file
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="profile-panel-heading">New profile</p>

            {profiles.length > 0 && (
              <button className="back-btn profile-back" onClick={() => setView('list')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
            )}

            <div className="avatar-grid">
              {AVATARS.map(a => (
                <button
                  key={a}
                  className={`avatar-btn${avatar === a ? ' selected' : ''}`}
                  onClick={() => setAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>

            <input
              className="profile-name-input"
              placeholder="Your name"
              value={name}
              maxLength={24}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />

            <button
              className="btn btn-primary profile-create-btn"
              onClick={handleCreate}
              disabled={!name.trim()}
            >
              Start Learning →
            </button>

            <button className="profile-load-standalone" onClick={() => fileRef.current?.click()}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Load existing account from file
            </button>
          </>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

      </div>
    </div>
  );
}
