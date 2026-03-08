import { useMemo } from 'react';
import { LESSONS, MASTERY_LEVELS } from '../data/lessons';
import NavBar from '../components/NavBar';
import ProgressBar from '../components/ProgressBar';

export default function HomeScreen({ navigate, getLessonProgress }) {
  const allWords = useMemo(() => LESSONS.reduce((s, l) => s + l.words.length, 0), []);

  const allMastered = useMemo(() =>
    LESSONS.reduce((s, l) => {
      const { counts } = getLessonProgress(l);
      return s + counts[4];
    }, 0),
  [getLessonProgress]);

  const allPracticed = useMemo(() =>
    LESSONS.reduce((s, l) => {
      const { counts } = getLessonProgress(l);
      return s + counts[3] + counts[4];
    }, 0),
  [getLessonProgress]);

  return (
    <>
      <NavBar />
      <div className="screen">
        <div className="home-header">
          <div className="home-title">吴熙</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>WuXi</div>
          <div className="home-subtitle">
            Master Mandarin Chinese through spaced repetition and interactive quizzes.
          </div>
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-num">{LESSONS.length}</div>
              <div className="stat-label">Lessons</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">{allWords}</div>
              <div className="stat-label">Words</div>
            </div>
            <div className="stat-item">
              <div className="stat-num" style={{ color: 'var(--orange)' }}>{allPracticed}</div>
              <div className="stat-label">Practiced</div>
            </div>
            <div className="stat-item">
              <div className="stat-num" style={{ color: '#22c55e' }}>{allMastered}</div>
              <div className="stat-label">Mastered</div>
            </div>
          </div>
        </div>

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
                  <div className="mastery-pct">{pct}% mastered</div>
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
