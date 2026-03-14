import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { MASTERY_LEVELS } from '../data/lessons';
import { wordKey } from '../utils/helpers';
import NavBar from '../components/NavBar';
import MasteryBadge from '../components/MasteryBadge';

function MasteryHistogram({ counts }) {
  const maxCount = Math.max(...counts, 1);
  const CHART_H = 80;
  return (
    <div className="mastery-histogram">
      <div className="histogram-bars">
        {MASTERY_LEVELS.map((ml, i) => {
          const barH = counts[i] > 0
            ? Math.max((counts[i] / maxCount) * CHART_H, 8)
            : 4;
          return (
            <div key={ml.id} className="histogram-col">
              <div className="histogram-bar-area">
                {counts[i] > 0 && (
                  <span className="histogram-count-above" style={{ color: ml.color }}>
                    {counts[i]}
                  </span>
                )}
                <div
                  className="histogram-vbar"
                  style={{
                    height: barH,
                    background: counts[i] > 0 ? ml.color : 'var(--surface3)',
                    opacity: counts[i] === 0 ? 0.35 : 1,
                  }}
                />
              </div>
              <span
                className="histogram-col-label"
                style={{ color: counts[i] > 0 ? ml.color : 'var(--text3)' }}
              >
                {ml.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const FILTER_OPTIONS = ['All', 'New', 'Learning', 'Familiar', 'Practiced', 'Mastered'];

export default function LessonScreen({ lesson, navigate, getWordMastery, getLessonProgress }) {
  const [filter, setFilter] = useState('All');
  const [dropOpen, setDropOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const dropWrapRef = useRef(null);
  const btnRef = useRef(null);
  const { pct, counts } = getLessonProgress(lesson);

  // Close on outside click
  useEffect(() => {
    if (!dropOpen) return;
    const h = (e) => {
      if (dropWrapRef.current && !dropWrapRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [dropOpen]);

  // Anchor menu below button using fixed positioning
  useLayoutEffect(() => {
    if (!dropOpen || !btnRef.current) { setMenuPos(null); return; }
    const r = btnRef.current.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 6, left: r.left });
  }, [dropOpen]);

  const filteredWords = useMemo(() => {
    if (filter === 'All') return lesson.words;
    const levelIdx = MASTERY_LEVELS.findIndex(m => m.name === filter);
    return lesson.words.filter(w => getWordMastery(wordKey(lesson.id, w.hanzi)).level === levelIdx);
  }, [filter, lesson, getWordMastery]);

  const filterCount = (name) => {
    if (name === 'All') return lesson.words.length;
    const levelIdx = MASTERY_LEVELS.findIndex(m => m.name === name);
    return counts[levelIdx] || 0;
  };

  const activeLevel = filter !== 'All' ? MASTERY_LEVELS.find(m => m.name === filter) : null;

  return (
    <>
      <NavBar
        onBack={() => navigate('home')}
        title={lesson.title}
        subtitle={`${lesson.words.length} words · ${pct}% mastered`}
        actions={
          <button className="btn btn-primary" onClick={() => navigate('quiz', { lesson })}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Quick
          </button>
        }
      />
      <div className="screen">

        {/* ── Lesson header ─────────────────────────────────────── */}
        <div className="lesson-header">
          <div className="lesson-header-top">
            <div className="lesson-header-icon">{lesson.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <div className="lesson-header-title" style={{ marginBottom: 0 }}>{lesson.title}</div>

                {/* ── Filter dropdown ──────────────────────────── */}
                <div ref={dropWrapRef} className="wall-dd-wrap" style={{ flexShrink: 0 }}>
                  <button
                    ref={btnRef}
                    className={`wall-dd-btn${filter !== 'All' ? ' filtered' : ''}${dropOpen ? ' open' : ''}`}
                    onClick={() => setDropOpen(v => !v)}
                  >
                    <span style={activeLevel ? { color: activeLevel.color } : {}}>
                      {filter === 'All' ? 'All' : filter}
                    </span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {dropOpen && menuPos && createPortal(
                    <div
                      className="wall-dd-menu"
                      style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
                      onMouseDown={e => e.stopPropagation()}
                    >
                      {FILTER_OPTIONS.map(f => {
                        const lvl = MASTERY_LEVELS.find(m => m.name === f);
                        const cnt = filterCount(f);
                        return (
                          <button
                            key={f}
                            className={`wall-dd-item${filter === f ? ' checked' : ''}`}
                            onClick={() => { setFilter(f); setDropOpen(false); }}
                          >
                            <span className="wall-dd-check" style={lvl ? { color: lvl.color } : {}}>
                              {filter === f
                                ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                : lvl
                                  ? <span className="wall-dd-dot" style={{ background: lvl.color }} />
                                  : null
                              }
                            </span>
                            <span style={{ flex: 1 }}>{f}</span>
                            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{cnt}</span>
                          </button>
                        );
                      })}
                    </div>,
                    document.body
                  )}
                </div>
              </div>
              <div className="lesson-header-desc">{lesson.description}</div>
            </div>
          </div>
          <MasteryHistogram counts={counts} />
        </div>

        {/* ── Word grid ─────────────────────────────────────────── */}
        {filteredWords.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>No words in this category yet.<br />Start quizzing to build mastery!</p>
          </div>
        ) : (
          <div className="word-grid">
            {filteredWords.map(w => {
              const m = getWordMastery(wordKey(lesson.id, w.hanzi));
              const ml = MASTERY_LEVELS[m.level];
              return (
                <div
                  key={w.hanzi}
                  className="card word-card"
                  style={{ borderColor: `${ml.color}28` }}
                  onClick={() => navigate('word', { lesson, word: w })}
                >
                  <div className="word-card-hanzi">{w.hanzi}</div>
                  <div className="word-card-pinyin">{w.pinyin}</div>
                  <div className="word-card-meaning">{w.meaning}</div>
                  <div className="word-card-footer">
                    <MasteryBadge level={m.level} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
