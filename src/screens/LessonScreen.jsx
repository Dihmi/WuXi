import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { MASTERY_LEVELS, QUIZ_TYPE_OPTIONS } from '../data/lessons';
import { wordKey } from '../utils/helpers';
import NavBar from '../components/NavBar';
import MasteryBadge from '../components/MasteryBadge';

function MasteryHistogram({ counts }) {
  const maxCount = Math.max(...counts, 1);
  const CHART_H = 72;
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

function daysSince(ts) {
  if (!ts) return null;
  const diff = Date.now() - ts;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

const FILTER_OPTIONS = ['All', 'New', 'Learning', 'Familiar', 'Practiced', 'Mastered'];
const QUIZ_COUNT_OPTIONS = [5, 10, 20, 'All'];

export default function LessonScreen({ lesson, navigate, getWordMastery, getLessonProgress }) {
  const [filter,    setFilter]    = useState('All');
  const [dropOpen,  setDropOpen]  = useState(false);
  const [menuPos,   setMenuPos]   = useState(null);
  const [countOpen, setCountOpen] = useState(false);
  const [countPos,  setCountPos]  = useState(null);
  const [quizCount, setQuizCount] = useState(10);
  const [typeOpen,  setTypeOpen]  = useState(false);
  const [typePos,   setTypePos]   = useState(null);
  const [quizType,  setQuizType]  = useState('mix');

  const dropWrapRef  = useRef(null);
  const btnRef       = useRef(null);
  const countWrapRef = useRef(null);
  const countBtnRef  = useRef(null);
  const typeWrapRef  = useRef(null);
  const typeBtnRef   = useRef(null);

  const { pct, counts, totalReviews, lastReviewed } = getLessonProgress(lesson);

  /* ── Close dropdowns on outside click ──────────────────────── */
  useEffect(() => {
    if (!dropOpen && !countOpen && !typeOpen) return;
    const h = (e) => {
      if (dropWrapRef.current && !dropWrapRef.current.contains(e.target)) setDropOpen(false);
      if (countWrapRef.current && !countWrapRef.current.contains(e.target)) setCountOpen(false);
      if (typeWrapRef.current && !typeWrapRef.current.contains(e.target)) setTypeOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [dropOpen, countOpen, typeOpen]);

  /* ── Anchor filter menu ─────────────────────────────────────── */
  useLayoutEffect(() => {
    if (!dropOpen || !btnRef.current) { setMenuPos(null); return; }
    const r = btnRef.current.getBoundingClientRect();
    setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
  }, [dropOpen]);

  /* ── Anchor count menu ──────────────────────────────────────── */
  useLayoutEffect(() => {
    if (!countOpen || !countBtnRef.current) { setCountPos(null); return; }
    const r = countBtnRef.current.getBoundingClientRect();
    setCountPos({ top: r.bottom + 6, left: r.left });
  }, [countOpen]);

  /* ── Anchor type menu ───────────────────────────────────────── */
  useLayoutEffect(() => {
    if (!typeOpen || !typeBtnRef.current) { setTypePos(null); return; }
    const r = typeBtnRef.current.getBoundingClientRect();
    setTypePos({ top: r.bottom + 6, left: r.left });
  }, [typeOpen]);

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

  const effectiveQuizCount = quizCount === 'All' ? lesson.words.length : quizCount;
  const lastReviewedStr = daysSince(lastReviewed);

  function startQuiz() {
    navigate('quiz', { lesson, quizCount: effectiveQuizCount, quizType });
  }

  return (
    <>
      <NavBar
        onBack={() => navigate('home')}
        title={lesson.title}
        subtitle={`${lesson.words.length} words · ${pct}% mastered`}
      />
      <div className="screen">

        {/* ── Lesson header ─────────────────────────────────────── */}
        <div className="lesson-header">

          {/* Top row: icon + title + filter */}
          <div className="lesson-header-top">
            <div className="lesson-header-icon">{lesson.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <div className="lesson-header-title" style={{ marginBottom: 0 }}>{lesson.title}</div>

                {/* ── Filter dropdown ──────────────────────────── */}
                <div ref={dropWrapRef} className="wall-dd-wrap" style={{ flexShrink: 0, marginLeft: 'auto' }}>
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
                      style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
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

          {/* Histogram */}
          <MasteryHistogram counts={counts} />

          {/* Stats + Quiz action row */}
          <div className="lesson-info-row">
            {/* Stats */}
            <div className="lesson-stats">
              <div className="lesson-stat">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{lastReviewedStr ? `Last reviewed ${lastReviewedStr}` : 'Not reviewed yet'}</span>
              </div>
              <div className="lesson-stat">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <span>{totalReviews === 0 ? 'No reviews yet' : `${totalReviews} answer${totalReviews === 1 ? '' : 's'} given`}</span>
              </div>
            </div>

            {/* Quiz button + type + count dropdowns */}
            <div className="lesson-quiz-actions">
              <div ref={typeWrapRef} className="wall-dd-wrap">
                <button
                  ref={typeBtnRef}
                  className={`wall-dd-btn${typeOpen ? ' open' : ''}`}
                  onClick={() => setTypeOpen(v => !v)}
                  title="Quiz type"
                >
                  <span>{QUIZ_TYPE_OPTIONS.find(o => o.id === quizType)?.short ?? 'Mix'}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: typeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {typeOpen && typePos && createPortal(
                  <div
                    className="wall-dd-menu quiz-type-menu"
                    style={{ position: 'fixed', top: typePos.top, left: typePos.left, zIndex: 9999 }}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    {QUIZ_TYPE_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        className={`wall-dd-item${quizType === opt.id ? ' checked' : ''}`}
                        onClick={() => { setQuizType(opt.id); setTypeOpen(false); }}
                      >
                        <span className="wall-dd-check">
                          {quizType === opt.id && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </span>
                        <span style={{ flex: 1 }}>{opt.label}</span>
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </div>

              <div ref={countWrapRef} className="wall-dd-wrap">
                <button
                  ref={countBtnRef}
                  className={`wall-dd-btn${countOpen ? ' open' : ''}`}
                  onClick={() => setCountOpen(v => !v)}
                  title="Number of cards"
                >
                  <span>{quizCount === 'All' ? 'All' : quizCount}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: countOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {countOpen && countPos && createPortal(
                  <div
                    className="wall-dd-menu quiz-count-menu"
                    style={{ position: 'fixed', top: countPos.top, left: countPos.left, zIndex: 9999 }}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    {QUIZ_COUNT_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        className={`wall-dd-item${quizCount === opt ? ' checked' : ''}`}
                        onClick={() => { setQuizCount(opt); setCountOpen(false); }}
                      >
                        <span className="wall-dd-check">
                          {quizCount === opt && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </span>
                        <span style={{ flex: 1 }}>{opt === 'All' ? 'All cards' : `${opt} cards`}</span>
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
              </div>

              <button className="btn btn-primary" onClick={startQuiz}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Quiz
              </button>
            </div>
          </div>

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
