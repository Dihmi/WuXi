import { useMemo, useState } from 'react';
import { MASTERY_LEVELS } from '../data/lessons';
import NavBar      from '../components/NavBar';

const BUBBLE_MIN = 28, BUBBLE_MAX = 88;
const BUBBLE_LEVELS = [
  { name: 'New',       color: '#64748b', bg: 'rgba(100,116,139,0.13)' },
  { name: 'Learning',  color: '#3b82f6', bg: 'rgba(59,130,246,0.13)'  },
  { name: 'Familiar',  color: '#eab308', bg: 'rgba(234,179,8,0.13)'   },
  { name: 'Practiced', color: '#f97316', bg: 'rgba(249,115,22,0.13)'  },
  { name: 'Mastered',  color: '#22c55e', bg: 'rgba(34,197,94,0.13)'   },
];

function BubbleMosaic({ counts }) {
  const maxCount = Math.max(...counts, 1);
  return (
    <div className="bubble-mosaic">
      {BUBBLE_LEVELS.map((lv, i) => {
        const d = counts[i] === 0
          ? 15
          : Math.round(BUBBLE_MIN + Math.sqrt(counts[i] / maxCount) * (BUBBLE_MAX - BUBBLE_MIN));
        return (
          <div key={i} className="bubble-item"
            style={{ '--bd': `${d}px`, '--bc': lv.color, '--bbg': lv.bg, '--bdelay': `${i * 60}ms` }}>
            <div className="bubble-circle">
              {counts[i] > 0 && <>
                <span className="bubble-count">{counts[i]}</span>
                <span className="bubble-lbl">{lv.name}</span>
              </>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrendLine({ data }) {
  const W = 300, H = 44, pad = 2;
  const max = Math.max(...data, 1);
  const total = data.reduce((s, v) => s + v, 0);
  const hasActivity = total > 0;

  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * (W - pad * 2),
    pad + (1 - v / max) * (H - pad * 2),
  ]);

  // Smooth cubic bezier through all points
  let linePath = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1][0] + pts[i][0]) / 2;
    linePath += ` C ${cpx},${pts[i - 1][1]} ${cpx},${pts[i][1]} ${pts[i][0]},${pts[i][1]}`;
  }
  const areaPath = `${linePath} L ${pts[pts.length - 1][0]},${H} L ${pts[0][0]},${H} Z`;

  return (
    <div className="hero-trend">
      <div className="hero-trend-header">
        <span className="hero-trend-label">Daily reviews</span>
        <span className="hero-trend-meta">
          {hasActivity ? `${total} in 14 days` : 'No activity yet'}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="trend-svg"
        aria-hidden="true">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {hasActivity ? (
          <>
            <path d={areaPath} fill="url(#trendGrad)" />
            <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
            {/* Today marker dot */}
            <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]}
              r="3" fill="var(--accent)" />
          </>
        ) : (
          <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2}
            stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 4" />
        )}
      </svg>
      <div className="hero-trend-axis">
        <span>14 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

function LessonDonut({ counts, pct, size = 54 }) {
  const total = counts.reduce((s, c) => s + c, 0);
  const cx = size / 2, cy = size / 2;
  const sw = 5.5;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const gap = sw + 2;

  let cum = 0;
  const segs = [];
  MASTERY_LEVELS.forEach((ml, i) => {
    const rawLen = total > 0 ? (counts[i] / total) * circ : 0;
    if (rawLen < 1) { cum += rawLen; return; }
    segs.push({ color: ml.color, rawLen, start: cum });
    cum += rawLen;
  });

  const useGap = segs.length > 1;
  const drawnSegs = segs.map(s => {
    const drawnLen = useGap ? Math.max(s.rawLen - gap, sw) : circ;
    const start    = useGap ? s.start + gap / 2 : 0;
    const offset   = drawnLen + circ - start;
    return { color: s.color, drawnLen, offset };
  });

  const fs = Math.round(size * 0.20);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface3)" strokeWidth={sw} />
      {drawnSegs.map((seg, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={seg.color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${seg.drawnLen} ${circ}`}
          strokeDashoffset={seg.offset}
        />
      ))}
      <text x={cx} y={cy} transform={`rotate(90, ${cx}, ${cy})`}
        textAnchor="middle" dominantBaseline="central"
        fontSize={fs} fontWeight="800"
        fill={pct > 0 ? 'var(--accent)' : 'var(--text3)'}
        fontFamily="inherit"
      >{pct}%</text>
    </svg>
  );
}

export default function HomeScreen({
  lessons, deckStatus, deckErrors, navigate, getLessonProgress, dailyActivity,
  daysLearning, currentProfile, onThemeClick, onProfileClick, onLogout,
  onExport, onImport, onWall, onLeaderboard,
}) {
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const allWords = useMemo(() => lessons.reduce((s, l) => s + l.words.length, 0), [lessons]);

  const { allSeen, overallPct, levelCounts } = useMemo(() => {
    let seen = 0, weightedScore = 0;
    const levelCounts = [0, 0, 0, 0, 0];
    lessons.forEach(l => {
      const { counts } = getLessonProgress(l);
      seen += counts[1] + counts[2] + counts[3] + counts[4];
      weightedScore += counts[1]*1 + counts[2]*2 + counts[3]*3 + counts[4]*4;
      counts.forEach((c, i) => { levelCounts[i] += c; });
    });
    const pct = allWords > 0 ? Math.round(weightedScore / (allWords * 4) * 100) : 0;
    return { allSeen: seen, overallPct: pct, levelCounts };
  }, [lessons, getLessonProgress, allWords]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const l of lessons) {
      const g = l.group ?? 'Other';
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(l);
    }
    return [...map.entries()];
  }, [lessons]);

  const toggleGroup  = (name) => setCollapsedGroups(prev => ({ ...prev, [name]: !prev[name] }));
  const expandAll    = () => setCollapsedGroups(Object.fromEntries(groups.map(([n]) => [n, false])));
  const collapseAll  = () => setCollapsedGroups(Object.fromEntries(groups.map(([n]) => [n, true])));
  const allCollapsed = groups.every(([n]) => collapsedGroups[n]);
  const allExpanded  = groups.every(([n]) => !collapsedGroups[n]);

  return (
    <>
      <NavBar
        currentProfile={currentProfile}
        onThemeClick={onThemeClick}
        onProfileClick={onProfileClick}
        onLogout={onLogout}
        onWall={onWall}
        onLeaderboard={onLeaderboard}
        onExport={onExport}
        onImport={onImport}
      />
      <div className="screen">

        {/* ── Hero card ─────────────────────────────────────────── */}
        <div className="hero-card">
          <div className="hero-pct-row">
            <span className="hero-pct-num"
              style={{ color: overallPct > 0 ? 'var(--accent)' : 'var(--text3)' }}>
              {overallPct}%
            </span>
            <span className="hero-pct-lbl">overall mastery</span>
          </div>

          <BubbleMosaic counts={levelCounts} />

          <div className="hero-stats-row">
            <div className="hsr-item">
              <span className="hsr-val">{allWords}</span>
              <span className="hsr-lbl">Words</span>
            </div>
            <span className="hsr-sep">·</span>
            <div className="hsr-item">
              <span className="hsr-val">{lessons.length}</span>
              <span className="hsr-lbl">Lessons</span>
            </div>
            <span className="hsr-sep">·</span>
            <div className="hsr-item">
              <span className="hsr-val" style={{ color: 'var(--accent)' }}>{allSeen}</span>
              <span className="hsr-lbl">Seen</span>
            </div>
            <span className="hsr-sep">·</span>
            <div className="hsr-item">
              <span className="hsr-val" style={{ color: 'var(--gold)' }}>{daysLearning}</span>
              <span className="hsr-lbl">Days</span>
            </div>
          </div>

          {dailyActivity && <TrendLine data={dailyActivity} />}

        </div>

        {/* ── Deck errors ───────────────────────────────────────── */}
        {deckErrors.length > 0 && (
          <div className="deck-errors" style={{ margin: '12px 16px' }}>
            <div className="deck-errors-title">
              ⚠ Failed to load {deckErrors.length} deck{deckErrors.length > 1 ? 's' : ''}
            </div>
            {deckErrors.map((e, i) => {
              const colon = e.indexOf(': ');
              const file  = colon !== -1 ? e.slice(0, colon) : null;
              const msg   = colon !== -1 ? e.slice(colon + 2) : e;
              return (
                <div key={i} className="deck-errors-item">
                  {file && <span style={{ fontWeight: 700, color: 'var(--text2)' }}>{file}:</span>}{' '}
                  {msg}
                </div>
              );
            })}
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
          {groups.length > 0 && (
            <div className="home-toolbar-actions">
              <button
                className="toolbar-toggle-btn"
                onClick={allCollapsed ? expandAll : collapseAll}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: allCollapsed ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
                {allCollapsed ? 'Expand all' : 'Collapse all'}
              </button>
            </div>
          )}
        </div>

        {/* ── Lesson groups ──────────────────────────────────────── */}
        {groups.map(([groupName, groupLessons]) => {
          const collapsed = !!collapsedGroups[groupName];
          const groupCards = groupLessons.reduce((s, l) => s + l.words.length, 0);
          return (
            <div key={groupName} className="lesson-group">
              <button
                className="lesson-group-header"
                onClick={() => toggleGroup(groupName)}
              >
                <span className="lesson-group-name">{groupName}</span>
                <span className="lesson-group-count">
                  {groupLessons.length} decks · {groupCards} cards
                </span>
                <span className="lesson-group-sep" />
                <span className="lesson-group-toggle">
                  <svg
                    width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.18s' }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
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
                              <span className="lesson-card-count">{lesson.words.length}</span>
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
                          <LessonDonut counts={counts} pct={pct} />
                        </div>
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
