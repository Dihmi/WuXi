import { useMemo, useRef, useState } from 'react';
import { MASTERY_LEVELS } from '../data/lessons';
import NavBar      from '../components/NavBar';
import ProgressBar from '../components/ProgressBar';

export default function HomeScreen({
  lessons, deckStatus, deckErrors, navigate, getLessonProgress,
  currentProfile, onThemeClick, onProfileClick, onLogout,
  onExport, onImport, onWall,
}) {
  const importRef = useRef(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});

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

  // Group lessons preserving insertion order
  const groups = useMemo(() => {
    const map = new Map();
    for (const l of lessons) {
      const g = l.group ?? 'Other';
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(l);
    }
    return [...map.entries()]; // [[groupName, lessons[]], …]
  }, [lessons]);

  const toggleGroup = (name) =>
    setCollapsedGroups(prev => ({ ...prev, [name]: !prev[name] }));

  return (
    <>
      <NavBar
        currentProfile={currentProfile}
        onThemeClick={onThemeClick}
        onProfileClick={onProfileClick}
        onLogout={onLogout}
        onWall={onWall}
      />
      <div className="screen">

        {/* ── Hero progress strip ───────────────────────────────── */}
        <div className="hero-strip">
          <div className="hero-pct-block">
            <div className="hero-pct">
              {overallPct}<span className="hero-pct-sign">%</span>
            </div>
            <div className="hero-pct-label">overall</div>
          </div>
          <div className="hero-right">
            <ProgressBar pct={overallPct} />
            <div className="hero-meta">
              <span className="hero-meta-item">
                <span className="hero-meta-num">{lessons.length}</span> lessons
              </span>
              <span className="hero-sep">·</span>
              <span className="hero-meta-item">
                <span className="hero-meta-num">{allWords}</span> words
              </span>
              <span className="hero-sep">·</span>
              <span className="hero-meta-item clr-accent">
                <span className="hero-meta-num">{allSeen}</span> seen
              </span>
              <span className="hero-sep">·</span>
              <span className="hero-meta-item clr-success">
                <span className="hero-meta-num">{allMastered}</span> mastered
              </span>
            </div>
          </div>
        </div>

        {/* ── Deck errors ───────────────────────────────────────── */}
        {deckErrors.length > 0 && (
          <div className="deck-errors" style={{ margin: '12px 20px' }}>
            <div className="deck-errors-title">
              ⚠ Failed to load {deckErrors.length} deck{deckErrors.length > 1 ? 's' : ''}
            </div>
            {deckErrors.map((e, i) => (
              <div key={i} className="deck-errors-item">{e}</div>
            ))}
          </div>
        )}

        {/* ── Toolbar ───────────────────────────────────────────── */}
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

          <input
            ref={importRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={onImport}
          />
          <button
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '5px 11px' }}
            onClick={() => importRef.current?.click()}
            title="Import progress from a WuXi JSON file"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import
          </button>
          <button
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '5px 11px' }}
            onClick={onExport}
            title="Export progress as JSON"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </div>

        {/* ── Lesson groups ──────────────────────────────────────── */}
        {groups.map(([groupName, groupLessons]) => {
          const collapsed = !!collapsedGroups[groupName];
          return (
            <div key={groupName} className="lesson-group">
              <button
                className="lesson-group-header"
                onClick={() => toggleGroup(groupName)}
              >
                <span className="lesson-group-name">{groupName}</span>
                <span className="lesson-group-count">{groupLessons.length}</span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.18s', flexShrink: 0, marginLeft: 'auto' }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {!collapsed && (
                <div className="lesson-grid">
                  {groupLessons.map(lesson => {
                    const { pct, counts } = getLessonProgress(lesson);
                    const hasTags = counts.some((c, i) => i > 0 && c > 0);
                    return (
                      <div
                        key={lesson.id}
                        className="card lesson-card clickable"
                        onClick={() => navigate('lesson', { lesson })}
                      >
                        <div className="lesson-card-top">
                          <div className="lesson-icon">{lesson.icon}</div>
                          <div className="lesson-card-info">
                            <div className="lesson-title-row">
                              <span className="lesson-title">{lesson.title}</span>
                              {lesson.imported && <span className="imported-badge">IMPORTED</span>}
                            </div>
                            <div className="lesson-tags">
                              {hasTags
                                ? MASTERY_LEVELS.map(ml =>
                                    counts[ml.id] > 0 && (
                                      <span
                                        key={ml.id}
                                        style={{
                                          fontSize: 9, color: ml.color, background: ml.bg,
                                          border: `1px solid ${ml.color}33`, borderRadius: 20,
                                          padding: '1px 6px', fontWeight: 600,
                                        }}
                                      >
                                        {counts[ml.id]} {ml.name}
                                      </span>
                                    )
                                  )
                                : <span className="lesson-new-label">Not started</span>
                              }
                            </div>
                          </div>
                          <span className="lesson-pct">{pct}%</span>
                        </div>
                        <ProgressBar pct={pct} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

      </div>
    </>
  );
}
