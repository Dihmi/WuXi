import NavBar          from '../components/NavBar';
import useLeaderboard  from '../hooks/useLeaderboard';

/* ── Rank medal (top 3) ──────────────────────────────────────── */
const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

function Avatar({ name, photoURL, size = 32 }) {
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className="lb-avatar-fallback"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials || '?'}
    </div>
  );
}

function UserRow({ entry, isCurrentUser, dimmed }) {
  const medal = MEDALS[entry.rank];
  return (
    <div className={`lb-row${isCurrentUser ? ' lb-row-self' : ''}${dimmed ? ' lb-row-dimmed' : ''}`}>
      {/* Rank */}
      <div className="lb-rank">
        {medal
          ? <span className="lb-medal">{medal}</span>
          : <span className="lb-rank-num">{entry.rank}</span>
        }
      </div>

      {/* Avatar + name */}
      <Avatar name={entry.name} photoURL={entry.photoURL} />
      <div className="lb-name-col">
        <span className="lb-name">{entry.name}</span>
        {isCurrentUser && <span className="lb-you-badge">you</span>}
      </div>

      {/* Stats */}
      <div className="lb-stats">
        <div className="lb-stat">
          <span className="lb-stat-value">{entry.overallPct}%</span>
          <span className="lb-stat-label">mastery</span>
        </div>
        <div className="lb-stat">
          <span className="lb-stat-value">{entry.wordsLearned}</span>
          <span className="lb-stat-label">learned</span>
        </div>
        <div className="lb-stat">
          <span className="lb-stat-value">{entry.totalReviews}</span>
          <span className="lb-stat-label">reviews</span>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardScreen({ navigate, currentProfile, currentUid }) {
  const { top10, currentEntry, isInTop10, loading, error, refresh } =
    useLeaderboard(currentUid, currentProfile);

  return (
    <div className="screen">
      <NavBar
        title="Leaderboard"
        subtitle="Top learners"
        onBack={() => navigate('home')}
      />

      <div className="lb-container">

        {/* ── Loading ── */}
        {loading && (
          <div className="lb-loading">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"
              style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="lb-error">
            <p>{error}</p>
            <button className="btn btn-secondary" onClick={refresh}>Retry</button>
          </div>
        )}

        {/* ── Table ── */}
        {!loading && !error && (
          <>
            {top10.length === 0 ? (
              <div className="lb-empty">No learners yet — be the first!</div>
            ) : (
              <div className="lb-list">
                {top10.map(entry => (
                  <UserRow
                    key={entry.uid}
                    entry={entry}
                    isCurrentUser={entry.uid === currentUid}
                  />
                ))}

                {/* Current user below the fold if outside top 10 */}
                {!isInTop10 && currentEntry && (
                  <>
                    <div className="lb-ellipsis">· · ·</div>
                    <UserRow
                      entry={currentEntry}
                      isCurrentUser
                    />
                  </>
                )}

                {/* Not yet on the board */}
                {!isInTop10 && !currentEntry && (
                  <div className="lb-not-ranked">
                    Start studying to appear on the leaderboard!
                  </div>
                )}
              </div>
            )}

            <button className="lb-refresh-btn" onClick={refresh}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Refresh
            </button>
          </>
        )}
      </div>
    </div>
  );
}
