import { useState, useMemo, useEffect, useRef } from 'react';
import { MASTERY_LEVELS } from '../data/lessons';
import { wordKey } from '../utils/helpers';
import NavBar from '../components/NavBar';

const SORT_OPTIONS = [
  { id: 'lesson', label: 'Lesson' },
  { id: 'level',  label: 'Level'  },
  { id: 'az',     label: 'A–Z'    },
];

// ── Shared dropdown button ───────────────────────────────────────────────────
function WallDropdown({ id, label, active, open, onToggle, children }) {
  return (
    <div className="wall-dd-wrap">
      <button
        className={`wall-dd-btn${active ? ' filtered' : ''}${open ? ' open' : ''}`}
        onClick={() => onToggle(id)}
      >
        <span>{label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div className="wall-dd-menu">{children}</div>}
    </div>
  );
}

// ── Dropdown item types ──────────────────────────────────────────────────────
function DDItem({ checked, color, dot, onClick, children }) {
  return (
    <button className={`wall-dd-item${checked ? ' checked' : ''}`} onClick={onClick}>
      <span className="wall-dd-check" style={color ? { color } : {}}>
        {checked
          ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          : dot
            ? <span className="wall-dd-dot" style={{ background: dot }} />
            : null
        }
      </span>
      {children}
    </button>
  );
}

function DDDivider() {
  return <div className="wall-dd-divider" />;
}

// ── Label helpers ────────────────────────────────────────────────────────────
function levelLabel(levelFilter) {
  if (levelFilter === null) return 'All Levels';
  return MASTERY_LEVELS[levelFilter]?.name ?? 'Level';
}

function lessonLabel(lessonFilters, lessons) {
  if (lessonFilters === null) return 'All Lessons';
  if (lessonFilters.length === 0) return 'No Lessons';
  if (lessonFilters.length === 1) {
    const l = lessons.find(x => x.id === lessonFilters[0]);
    return l ? `${l.icon} ${l.title}` : '1 Lesson';
  }
  return `${lessonFilters.length} Lessons`;
}

function sortLabel(sort) {
  return SORT_OPTIONS.find(o => o.id === sort)?.label ?? 'Sort';
}

function displayLabel(showPinyin, showMeaning, tileSize) {
  const parts = [];
  if (showPinyin)  parts.push('拼');
  if (showMeaning) parts.push('En');
  const sizeMap = { sm: 'S', md: 'M', lg: 'L' };
  parts.push(sizeMap[tileSize] ?? 'M');
  return parts.join(' · ');
}

// ── Main component ───────────────────────────────────────────────────────────
export default function HanziWallScreen({ lessons, navigate, getWordMastery }) {
  const [search,        setSearch]        = useState('');
  const [levelFilter,   setLevelFilter]   = useState(null);   // null = all
  const [lessonFilters, setLessonFilters] = useState(null);   // null = all, [] = none
  const [sort,          setSort]          = useState('lesson');
  const [showPinyin,    setShowPinyin]    = useState(true);
  const [showMeaning,   setShowMeaning]   = useState(true);
  const [tileSize,      setTileSize]      = useState('md');
  const [openDrop,      setOpenDrop]      = useState(null);   // 'level'|'lesson'|'sort'|'display'|null
  const barRef = useRef(null);

  // Close all dropdowns on outside click
  useEffect(() => {
    if (!openDrop) return;
    const h = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) setOpenDrop(null);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [openDrop]);

  const toggleDrop = (id) => setOpenDrop(prev => prev === id ? null : id);

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

  // Lesson filter helpers
  const toggleLesson = (id) => {
    setLessonFilters(prev => {
      if (prev === null) return [id];
      const has = prev.includes(id);
      return has ? prev.filter(x => x !== id) : [...prev, id];
    });
  };

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

        {/* ── Dropdown toolbar ─────────────────────────────────────── */}
        <div className="wall-controls-bar" ref={barRef}>

          {/* Level */}
          <WallDropdown
            id="level"
            label={levelLabel(levelFilter)}
            active={levelFilter !== null}
            open={openDrop === 'level'}
            onToggle={toggleDrop}
          >
            <DDItem checked={levelFilter === null} onClick={() => setLevelFilter(null)}>All Levels</DDItem>
            <DDDivider />
            {MASTERY_LEVELS.map(ml => (
              <DDItem
                key={ml.id}
                checked={levelFilter === ml.id}
                color={ml.color}
                dot={levelFilter !== ml.id ? ml.color : undefined}
                onClick={() => setLevelFilter(prev => prev === ml.id ? null : ml.id)}
              >
                {ml.name}
              </DDItem>
            ))}
          </WallDropdown>

          {/* Lesson */}
          <WallDropdown
            id="lesson"
            label={lessonLabel(lessonFilters, lessons)}
            active={lessonFilters !== null}
            open={openDrop === 'lesson'}
            onToggle={toggleDrop}
          >
            <div className="wall-dd-actions">
              <button className="wall-dd-action" onClick={() => setLessonFilters(null)}>All</button>
              <button className="wall-dd-action" onClick={() => setLessonFilters([])}>None</button>
            </div>
            <DDDivider />
            {lessons.map(l => {
              const checked = lessonFilters === null || lessonFilters.includes(l.id);
              return (
                <DDItem key={l.id} checked={checked} onClick={() => toggleLesson(l.id)}>
                  <span style={{ marginRight: 4 }}>{l.icon}</span>{l.title}
                </DDItem>
              );
            })}
          </WallDropdown>

          {/* Sort */}
          <WallDropdown
            id="sort"
            label={`${sortLabel(sort)}`}
            active={sort !== 'lesson'}
            open={openDrop === 'sort'}
            onToggle={toggleDrop}
          >
            {SORT_OPTIONS.map(opt => (
              <DDItem key={opt.id} checked={sort === opt.id} onClick={() => setSort(opt.id)}>
                {opt.label}
              </DDItem>
            ))}
          </WallDropdown>

          {/* Display */}
          <WallDropdown
            id="display"
            label={displayLabel(showPinyin, showMeaning, tileSize)}
            active={!showPinyin || !showMeaning || tileSize !== 'md'}
            open={openDrop === 'display'}
            onToggle={toggleDrop}
          >
            <DDItem checked={showPinyin}  onClick={() => setShowPinyin(v => !v)}>Pinyin</DDItem>
            <DDItem checked={showMeaning} onClick={() => setShowMeaning(v => !v)}>Meaning</DDItem>
            <DDDivider />
            <div className="wall-dd-size-row">
              <button className={`wall-size-btn sm${tileSize === 'sm' ? ' active' : ''}`} onClick={() => setTileSize('sm')} title="Small">A</button>
              <button className={`wall-size-btn md${tileSize === 'md' ? ' active' : ''}`} onClick={() => setTileSize('md')} title="Normal">A</button>
              <button className={`wall-size-btn lg${tileSize === 'lg' ? ' active' : ''}`} onClick={() => setTileSize('lg')} title="Large">A</button>
            </div>
          </WallDropdown>

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
