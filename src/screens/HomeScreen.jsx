import { useMemo, useRef } from 'react';
import { MASTERY_LEVELS } from '../data/lessons';
import NavBar      from '../components/NavBar';
import ProgressBar from '../components/ProgressBar';

export default function HomeScreen({
  lessons, deckStatus, deckErrors, navigate, getLessonProgress,
  currentProfile, onThemeClick, onProfileClick, onLogout,
  onExport, onImport,
}) {
  const importRef = useRef(null);

  const allWords = useMemo(() => lessons.reduce((s, l) => s + l.words.length, 0), [lessons]);

  const { allSeen, allMastered, overallPct } = useMemo(() => {
    let seen = 0, mastered = 0, weightedScore = 0;
    lessons.forEach(l => {
      const { counts } = getLessonProgress(l);
      seen          += counts[1] + counts[2] + counts[3] + counts[4];
      mastered      += counts[4];
      weightedScore += counts[1]*1 + counts[2]*2 + counts[3]*3 + counts[4]*4;
    });
    const pct = allWords > 0 ? Math.round(weightedScore / (allWords * 4) * 100) : 0;
    return { allSeen: seen, allMastered: mastered, overallPct: pct };
  }, [lessons, getLessonProgress, allWords]);

  return (
    <>
      <NavBar
        currentProfile={currentProfile}
        onThemeClick={onThemeClick}
        onProfileClick={onProfileClick}
        onLogout={onLogout}
      />
      <div className="screen">

        {/* ── Stats bar ─────────────────────────────────────────── */}
        <div className="home-stats-bar">
          <div className="home-stat">
            <div className="home-stat-num">{lessons.length}</div>
            <div className="home-stat-label">Lessons</div>
          </div>
          <div className="home-stat">
            <div className="home-stat-num">{allWords}</div>
            <div className="home-stat-label">Words</div>
          </div>
          <div className="home-stat">
            <div className="home-stat-num clr-accent">{allSeen}</div>
            <div className="home-stat-label">Seen</div>
          </div>
          <div className="home-stat">
            <div className="home-stat-num clr-success">{allMastered}</div>
            <div className="home-stat-label">Mastered</div>
          </div>
        </div>

        {/* ── Overall progress ──────────────────────────────────── */}
        <div className="overall-progress">
          <div className="overall-progress-row">
            <span className="overall-progress-label">Overall progress</span>
            <span className="overall-progress-pct">{overallPct}%</span>
          </div>
          <ProgressBar pct={overallPct} />
        </div>

        {/* ── Deck errors ───────────────────────────────────────── */}
        {deckErrors.length > 0 && (
          <div className="deck-errors">
            <div className="deck-errors-title">
              ⚠ Failed to load {deckErrors.length} deck{deckErrors.length > 1 ? 's' : ''}
            </div>
            {deckErrors.map((e, i) => (
              <div key={i} className="deck-errors-item">{e}</div>
            ))}
          </div>
        )}

        {/* ── Lessons header + toolbar ───────────────────────────── */}
        <div className="home-toolbar">
          <span className="home-toolbar-label">
            Lessons
            {deckStatus === 'loading' && (
              <span className="deck-loading-badge" style={{ marginLeft: 8 }}>
                <span className="deck-spinner" />
                Loading…
              </span>
            )}
          </span>

          {/* Import */}
          <input
            ref={importRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={onImport}
          />
          <button
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '6px 12px' }}
            onClick={() => importRef.current?.click()}
            title="Import progress from a WuXi JSON file"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import
          </button>

          {/* Export */}
          <button
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '6px 12px' }}
            onClick={onExport}
            title="Export progress as JSON"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </div>

        {/* ── Lesson grid ───────────────────────────────────────── */}
        <div className="lesson-grid">
          {lessons.map(lesson => {
            const { pct, counts } = getLessonProgress(lesson);
            return (
              <div
                key={lesson.id}
                className="card lesson-card"
                onClick={() => navigate('lesson', { lesson })}
              >
                <div className="lesson-card-top">
                  <div className="lesson-icon">{lesson.icon}</div>
                  <div>
                    <div className="lesson-title">
                      {lesson.title}
                      {lesson.imported && <span className="imported-badge">IMPORTED</span>}
                    </div>
                    <div className="lesson-desc">{lesson.description}</div>
                  </div>
                </div>
                <div className="lesson-foot">
                  <div className="lesson-word-count">{lesson.words.length} words</div>
                  <div className="lesson-pct">{pct}%</div>
                </div>
                <ProgressBar pct={pct} />
                <div className="lesson-tags">
                  {MASTERY_LEVELS.map(ml =>
                    counts[ml.id] > 0 && (
                      <span
                        key={ml.id}
                        style={{
                          fontSize: 10, color: ml.color, background: ml.bg,
                          border: `1px solid ${ml.color}33`, borderRadius: 20,
                          padding: '2px 7px', fontWeight: 600,
                        }}
                      >
                        {counts[ml.id]} {ml.name}
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Import hint ───────────────────────────────────────── */}
        <div className="import-hint">
          <div className="import-hint-icon">📦</div>
          <div className="import-hint-title">Import Anki Decks</div>
          <div className="import-hint-body">
            Drop <code>.apkg</code> files into <code>public/decks/</code>, add each filename
            to <code>public/decks/manifest.json</code> and reload.
          </div>
        </div>

      </div>
    </>
  );
}
