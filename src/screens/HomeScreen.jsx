import { useMemo } from 'react';
import { MASTERY_LEVELS } from '../data/lessons';
import NavBar      from '../components/NavBar';
import ProgressBar from '../components/ProgressBar';

export default function HomeScreen({ lessons, deckStatus, deckErrors, navigate, getLessonProgress }) {
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
      <NavBar />
      <div className="screen">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div className="home-hero">
          <div className="home-hero-deco">学</div>

          <div className="home-hero-tag">Mandarin · 普通话</div>
          <div className="home-hero-headline">
            Your vocabulary<br />journey
          </div>

          <div className="home-hero-pills">
            <div className="home-pill">
              <div className="home-pill-num">{lessons.length}</div>
              <div className="home-pill-label">Lessons</div>
            </div>
            <div className="home-pill">
              <div className="home-pill-num">{allWords}</div>
              <div className="home-pill-label">Words</div>
            </div>
            <div className="home-pill home-pill--orange">
              <div className="home-pill-num">{allSeen}</div>
              <div className="home-pill-label">Seen</div>
            </div>
            <div className="home-pill home-pill--green">
              <div className="home-pill-num">{allMastered}</div>
              <div className="home-pill-label">Mastered</div>
            </div>
          </div>

          <div className="home-hero-foot">
            <div className="home-hero-pct-row">
              <span>Overall progress</span>
              <span className="home-hero-pct-val">{overallPct}%</span>
            </div>
            <ProgressBar pct={overallPct} />
          </div>
        </div>

        {/* ── Deck import errors ────────────────────────────────── */}
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

        {/* ── Lesson list ───────────────────────────────────────── */}
        <div className="section-title">
          <span>Lessons</span>
          {deckStatus === 'loading' && (
            <span className="deck-loading-badge">
              <span className="deck-spinner" />
              Loading decks…
            </span>
          )}
        </div>

        <div className="lesson-grid">
          {lessons.map(lesson => {
            const { pct, counts } = getLessonProgress(lesson);
            return (
              <div
                key={lesson.id}
                className="card lesson-card"
                onClick={() => navigate('lesson', { lesson })}
              >
                <div className="lesson-card-header">
                  <div>
                    <div className="lesson-title">
                      {lesson.title}
                      {lesson.imported && <span className="imported-badge">IMPORTED</span>}
                    </div>
                    <div className="lesson-desc">{lesson.description}</div>
                  </div>
                  <div className="lesson-icon">{lesson.icon}</div>
                </div>
                <div className="lesson-meta">
                  <div className="word-count">{lesson.words.length} words</div>
                  <div className="mastery-pct">{pct}%</div>
                </div>
                <ProgressBar pct={pct} />
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
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

        {/* ── Import instructions ───────────────────────────────── */}
        <div className="import-hint">
          <div className="import-hint-icon">📦</div>
          <div className="import-hint-title">Import Anki Decks</div>
          <div className="import-hint-body">
            Drop <code>.apkg</code> files into <code>public/decks/</code>, then add each
            filename to <code>public/decks/manifest.json</code> and reload.
          </div>
        </div>

      </div>
    </>
  );
}
