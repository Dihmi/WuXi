import { useMemo } from 'react';
import { LESSONS, MASTERY_LEVELS } from '../data/lessons';
import NavBar from '../components/NavBar';
import ProgressBar from '../components/ProgressBar';

export default function HomeScreen({ navigate, getLessonProgress }) {
  const allWords = useMemo(() => LESSONS.reduce((s, l) => s + l.words.length, 0), []);

  const { allSeen, allMastered, overallPct } = useMemo(() => {
    let seen = 0, mastered = 0, weightedScore = 0;
    LESSONS.forEach(l => {
      const { counts } = getLessonProgress(l);
      seen      += counts[1] + counts[2] + counts[3] + counts[4];
      mastered  += counts[4];
      weightedScore += counts[1]*1 + counts[2]*2 + counts[3]*3 + counts[4]*4;
    });
    const pct = allWords > 0 ? Math.round(weightedScore / (allWords * 4) * 100) : 0;
    return { allSeen: seen, allMastered: mastered, overallPct: pct };
  }, [getLessonProgress, allWords]);

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
              <div className="home-pill-num">{LESSONS.length}</div>
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

        {/* ── Lessons ──────────────────────────────────────────── */}
        <div className="section-title">Lessons</div>
        <div className="lesson-grid">
          {LESSONS.map(lesson => {
            const { pct, counts } = getLessonProgress(lesson);
            return (
              <div
                key={lesson.id}
                className="card lesson-card"
                onClick={() => navigate('lesson', { lesson })}
              >
                <div className="lesson-card-header">
                  <div>
                    <div className="lesson-title">{lesson.title}</div>
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

        <div style={{ padding: '32px 24px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
          <div style={{ marginBottom: 8, fontSize: 18 }}>📦</div>
          <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>Import Anki Decks</div>
          <div style={{ lineHeight: 1.6 }}>
            Upload{' '}
            <code style={{ background: 'var(--surface2)', padding: '1px 5px', borderRadius: 4 }}>
              .apkg
            </code>{' '}
            files to add your own lessons — coming soon
          </div>
        </div>
      </div>
    </>
  );
}
