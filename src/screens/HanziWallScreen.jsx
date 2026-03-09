import { useState, useMemo, useEffect, useRef } from 'react';
import { MASTERY_LEVELS } from '../data/lessons';
import { wordKey } from '../utils/helpers';
import NavBar from '../components/NavBar';

const SORT_OPTIONS = [
  { id: 'lesson', label: 'Lesson' },
  { id: 'level',  label: 'Level'  },
  { id: 'az',     label: 'A–Z'    },
];

const SIZES = [
  { id: 'sm', label: 'A',  title: 'Small' },
  { id: 'md', label: 'A',  title: 'Normal' },
  { id: 'lg', label: 'A',  title: 'Large' },
];

// lessonFilters: null = all, [] = none, [id, ...] = specific lessons
function lessonLabel(lessonFilters, lessons) {
  if (lessonFilters === null) return 'All Lessons';
  if (lessonFilters.length === 0) return 'No Lessons';
  if (lessonFilters.length === 1) {
    const l = lessons.find(x => x.id === lessonFilters[0]);
    return l ? `${l.icon} ${l.title}` : '1 Lesson';
  }
  return `${lessonFilters.length} Lessons`;
}

export default function HanziWallScreen({ lessons, navigate, getWordMastery }) {
  const [search,        setSearch]        = useState('');
  const [levelFilter,   setLevelFilter]   = useState(null);      // null = all
  const [lessonFilters, setLessonFilters] = useState(null);      // null = all
  const [sort,          setSort]          = useState('lesson');
  const [showPinyin,    setShowPinyin]    = useState(true);
  const [showMeaning,   setShowMeaning]   = useState(true);
  const [tileSize,      setTileSize]      = useState('md');
  const [dropOpen,      setDropOpen]      = useState(false);
  const dropRef = useRef(null);

  // Close lesson dropdown on outside click
  useEffect(() => {
    if (!dropOpen) return;
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [dropOpen]);

  // Flatten all words with metadata
  const allWords = useMemo(() => {
    const out = [];
    for (const lesson of lessons) {
      for (const word of lesson.words) {
        const key = wordKey(lesson.id, word.hanzi);
        const m   = getWordMastery(key);
        out.push({ word, lesson, mastery: m });
      }
    }
    return out;
  }, [lessons, getWordMastery]);

  // Filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allWords.filter(({ word, lesson, mastery }) => {
      if (levelFilter !== null && mastery.level !== levelFilter) return false;
      if (lessonFilters !== null) {
        if (lessonFilters.length === 0) return false;
        if (!lessonFilters.includes(lesson.id)) return false;
      }
      if (q && !word.hanzi.includes(q) && !word.pinyin.toLowerCase().includes(q) && !word.meaning.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allWords, levelFilter, lessonFilters, search]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === 'level') arr.sort((a, b) => b.mastery.level - a.mastery.level);
    else if (sort === 'az') arr.sort((a, b) => a.word.hanzi.localeCompare(b.word.hanzi, 'zh'));
    return arr;
  }, [filtered, sort]);

  // Lesson dropdown handlers
  const toggleLesson = (id) => {
    setLessonFilters(prev => {
      if (prev === null) return [id];
      const has = prev.includes(id);
      return has ? prev.filter(x => x !== id) : [...prev, id];
    });
  };
  const selectAllLessons  = () => { setLessonFilters(null);  };
  const selectNoLessons   = () => { setLessonFilters([]);    };

  return (
    <>
      <NavBar
        onBack={() => navigate('home')}
        title="Hanzi Wall"
        subtitle={`${sorted.length} characters`}
      />
      <div className="screen wall-screen">

        {/* ── Search ──────────────────────────────────────────────── */}
        <div className="wall-search-wrap">
          <svg className="wall-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="wall-search"
            placeholder="Search hanzi, pinyin, meaning…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="wall-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        {/* ── Level filter chips (with All) ────────────────────────── */}
        <div className="wall-filter-row">
          <span className="wall-filter-section-label">Level</span>
          <button
            className={`wall-chip${levelFilter === null ? ' active' : ''}`}
            onClick={() => setLevelFilter(null)}
          >
            All
          </button>
          {MASTERY_LEVELS.map(ml => (
            <button
              key={ml.id}
              className={`wall-chip${levelFilter === ml.id ? ' active' : ''}`}
              style={levelFilter === ml.id ? { background: ml.bg, borderColor: ml.color, color: ml.color } : {}}
              onClick={() => setLevelFilter(prev => prev === ml.id ? null : ml.id)}
            >
              {ml.name}
            </button>
          ))}
        </div>

        {/* ── Controls bar: Lesson dropdown + Sort + Toggles + Size ── */}
        <div className="wall-controls-bar">

          {/* Lesson dropdown */}
          <div className="wall-lesson-dropdown" ref={dropRef}>
            <button
              className={`wall-lesson-btn${lessonFilters !== null ? ' filtered' : ''}`}
              onClick={() => setDropOpen(v => !v)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h16M4 18h7"/>
              </svg>
              <span>{lessonLabel(lessonFilters, lessons)}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {dropOpen && (
              <div className="wall-lesson-menu">
                <div className="wall-lesson-menu-actions">
                  <button className="wall-lesson-menu-action" onClick={selectAllLessons}>All</button>
                  <button className="wall-lesson-menu-action" onClick={selectNoLessons}>None</button>
                </div>
                <div className="wall-lesson-menu-divider" />
                {lessons.map(l => {
                  const checked = lessonFilters === null || lessonFilters.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      className={`wall-lesson-menu-item${checked ? ' checked' : ''}`}
                      onClick={() => toggleLesson(l.id)}
                    >
                      <span className="wall-lesson-menu-check">
                        {checked && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </span>
                      <span className="wall-lesson-menu-icon">{l.icon}</span>
                      <span>{l.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="wall-ctrl-group">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`wall-sort-btn${sort === opt.id ? ' active' : ''}`}
                onClick={() => setSort(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Display toggles */}
          <div className="wall-ctrl-group">
            <button className={`wall-toggle-btn${showPinyin ? ' on' : ''}`} onClick={() => setShowPinyin(v => !v)} title="Toggle pinyin">拼</button>
            <button className={`wall-toggle-btn${showMeaning ? ' on' : ''}`} onClick={() => setShowMeaning(v => !v)} title="Toggle meaning">En</button>
          </div>

          {/* Tile size */}
          <div className="wall-ctrl-group wall-size-group">
            <button className={`wall-size-btn sm${tileSize === 'sm' ? ' active' : ''}`} onClick={() => setTileSize('sm')} title="Small">A</button>
            <button className={`wall-size-btn md${tileSize === 'md' ? ' active' : ''}`} onClick={() => setTileSize('md')} title="Normal">A</button>
            <button className={`wall-size-btn lg${tileSize === 'lg' ? ' active' : ''}`} onClick={() => setTileSize('lg')} title="Large">A</button>
          </div>

          <span className="wall-count">{sorted.length}</span>
        </div>

        {/* ── Character grid ───────────────────────────────────────── */}
        {sorted.length === 0 ? (
          <div className="wall-empty">No characters match your filters.</div>
        ) : (
          <div className={`char-grid char-grid-${tileSize}`}>
            {sorted.map(({ word, lesson, mastery }) => {
              const ml = MASTERY_LEVELS[mastery.level];
              return (
                <button
                  key={`${lesson.id}-${word.hanzi}`}
                  className={`char-card char-card-${tileSize}${!showPinyin && !showMeaning ? ' char-card-hanzi-only' : ''}`}
                  onClick={() => navigate('word', { lesson, word })}
                  title={`${word.hanzi} · ${word.pinyin} · ${word.meaning}`}
                >
                  <div className="char-hanzi">{word.hanzi}</div>
                  {showPinyin  && <div className="char-pinyin">{word.pinyin}</div>}
                  {showMeaning && <div className="char-meaning">{word.meaning}</div>}
                  <div className="char-level-bar" style={{ background: ml.color }} />
                </button>
              );
            })}
          </div>
        )}

      </div>
    </>
  );
}
