import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';

// Persists wall UI state in localStorage so it survives navigation.
// Handles both direct values and function updaters (e.g. setX(prev => ...)).
function usePersisted(key, def) {
  const [val, setValRaw] = useState(() => {
    try {
      const s = localStorage.getItem('wall_' + key);
      return s !== null ? JSON.parse(s) : def;
    } catch { return def; }
  });
  const set = (v) => {
    setValRaw(current => {
      const next = typeof v === 'function' ? v(current) : v;
      try { localStorage.setItem('wall_' + key, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  return [val, set];
}
import { createPortal } from 'react-dom';
import { MASTERY_LEVELS } from '../data/lessons';
import { wordKey } from '../utils/helpers';
import NavBar from '../components/NavBar';

const SORT_OPTIONS = [
  { id: 'lesson', label: 'Lesson' },
  { id: 'level',  label: 'Level'  },
  { id: 'az',     label: 'A–Z'    },
];

// Available inner width (tile minWidth minus horizontal padding) per size variant.
// Used to scale down font so multi-char hanzi always fits on one line.
const HANZI_AVAIL = { sm: 48, md: 70, lg: 96 };
const HANZI_BASE  = { sm: 20, md: 26, lg: 36 };

function hanziFontSize(hanzi, tileSize) {
  const n = [...hanzi].length;        // proper Unicode-aware char count
  if (n <= 2) return undefined;       // CSS handles short words fine
  const avail = HANZI_AVAIL[tileSize] ?? 70;
  const base  = HANZI_BASE[tileSize]  ?? 26;
  return Math.max(10, Math.min(base, Math.floor(avail / n)));
}

// ── Shared dropdown button ───────────────────────────────────────────────────
// Menu is portaled into the .screen scroll-container with position:absolute so
// it lives in the same coordinate space as the buttons and scrolls with them.
function WallDropdown({ id, label, active, open, onToggle, children, screenRef }) {
  const btnRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current || !screenRef?.current) { setMenuPos(null); return; }
    const btn = btnRef.current.getBoundingClientRect();
    const scr = screenRef.current.getBoundingClientRect();
    setMenuPos({
      top:  btn.bottom - scr.top  + screenRef.current.scrollTop  + 6,
      left: btn.left   - scr.left + screenRef.current.scrollLeft,
    });
  }, [open, screenRef]);

  return (
    <div className="wall-dd-wrap">
      <button
        ref={btnRef}
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
      {open && menuPos && screenRef?.current && createPortal(
        <div
          className="wall-dd-menu"
          style={{ position: 'absolute', top: menuPos.top, left: menuPos.left }}
          onMouseDown={e => e.stopPropagation()}
        >
          {children}
        </div>,
        screenRef.current
      )}
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
function groupLabel(groupFilter) {
  return groupFilter === null ? 'All Groups' : groupFilter;
}

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

function displayLabel(showPinyin, showMeaning, tileSize, hoverAnim) {
  const parts = [];
  if (showPinyin)  parts.push('拼');
  if (showMeaning) parts.push('En');
  const sizeMap = { sm: 'S', md: 'M', lg: 'L' };
  parts.push(sizeMap[tileSize] ?? 'M');
  if (hoverAnim) parts.push('✦');
  return parts.join(' · ');
}

// Font size for the pop-up overlay (wider panel, so longer hanzi can stay larger)
function popupHanziFontSize(hanzi) {
  const n = [...hanzi].length;
  const avail = 140;
  const base  = 34;
  if (n <= 2) return base;
  return Math.max(14, Math.min(base, Math.floor(avail / n)));
}

// ── Main component ───────────────────────────────────────────────────────────
export default function HanziWallScreen({ lessons, navigate, getWordMastery, setWordFlag }) {
  const [search,        setSearch]        = usePersisted('search',        '');
  const [levelFilter,   setLevelFilter]   = usePersisted('levelFilter',   null);
  const [lessonFilters, setLessonFilters] = usePersisted('lessonFilters', null);
  const [groupFilter,   setGroupFilter]   = usePersisted('groupFilter',   null);
  const [flagFilter,    setFlagFilter]    = usePersisted('flagFilter',    null);  // null | 'favorites' | 'reported'
  const [sort,          setSort]          = usePersisted('sort',          'lesson');
  const [showPinyin,    setShowPinyin]    = usePersisted('showPinyin',    true);
  const [showMeaning,   setShowMeaning]   = usePersisted('showMeaning',   true);
  const [tileSize,      setTileSize]      = usePersisted('tileSize',      'md');
  const [hoverAnim,     setHoverAnim]     = usePersisted('hoverAnim',     false);
  const [openDrop,      setOpenDrop]      = useState(null);   // 'level'|'group'|'lesson'|'sort'|'display'|'flag'|null
  const screenRef = useRef(null);
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

  // Unique groups across all lessons (insertion order)
  const allGroups = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const l of lessons) {
      const g = l.group ?? 'Other';
      if (!seen.has(g)) { seen.add(g); out.push(g); }
    }
    return out;
  }, [lessons]);

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
      if (groupFilter !== null && (lesson.group ?? 'Other') !== groupFilter) return false;
      if (levelFilter !== null && mastery.level !== levelFilter) return false;
      if (lessonFilters !== null) {
        if (lessonFilters.length === 0) return false;
        if (!lessonFilters.includes(lesson.id)) return false;
      }
      if (flagFilter === 'favorites' && !mastery.favorite) return false;
      if (flagFilter === 'reported'  && !mastery.reported) return false;
      if (q && !word.hanzi.includes(q) && !word.pinyin.toLowerCase().includes(q) && !word.meaning.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allWords, groupFilter, levelFilter, lessonFilters, flagFilter, search]);

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
      <div className="screen wall-screen" ref={screenRef}>

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

          {/* Group */}
          {allGroups.length > 1 && (
            <WallDropdown
              id="group"
              label={groupLabel(groupFilter)}
              active={groupFilter !== null}
              open={openDrop === 'group'}
              onToggle={toggleDrop}
              screenRef={screenRef}
            >
              <DDItem checked={groupFilter === null} onClick={() => setGroupFilter(null)}>All Groups</DDItem>
              <DDDivider />
              {allGroups.map(g => (
                <DDItem key={g} checked={groupFilter === g} onClick={() => setGroupFilter(prev => prev === g ? null : g)}>
                  {g}
                </DDItem>
              ))}
            </WallDropdown>
          )}

          {/* Level */}
          <WallDropdown
            id="level"
            label={levelLabel(levelFilter)}
            active={levelFilter !== null}
            open={openDrop === 'level'}
            onToggle={toggleDrop}
            screenRef={screenRef}
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
            screenRef={screenRef}
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

          {/* Flags */}
          <WallDropdown
            id="flag"
            label={flagFilter === 'favorites' ? '★ Favorites' : flagFilter === 'reported' ? '⚑ Reported' : 'Flags'}
            active={flagFilter !== null}
            open={openDrop === 'flag'}
            onToggle={toggleDrop}
            screenRef={screenRef}
          >
            <DDItem checked={flagFilter === null}        onClick={() => setFlagFilter(null)}>All</DDItem>
            <DDDivider />
            <DDItem checked={flagFilter === 'favorites'} onClick={() => setFlagFilter(prev => prev === 'favorites' ? null : 'favorites')}>★ Favorites</DDItem>
            <DDItem checked={flagFilter === 'reported'}  onClick={() => setFlagFilter(prev => prev === 'reported'  ? null : 'reported')}>⚑ Reported</DDItem>
          </WallDropdown>

          {/* Sort */}
          <WallDropdown
            id="sort"
            label={`${sortLabel(sort)}`}
            active={sort !== 'lesson'}
            open={openDrop === 'sort'}
            onToggle={toggleDrop}
            screenRef={screenRef}
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
            label={displayLabel(showPinyin, showMeaning, tileSize, hoverAnim)}
            active={!showPinyin || !showMeaning || tileSize !== 'md' || hoverAnim}
            open={openDrop === 'display'}
            onToggle={toggleDrop}
            screenRef={screenRef}
          >
            <DDItem checked={showPinyin}  onClick={() => setShowPinyin(v => !v)}>Pinyin</DDItem>
            <DDItem checked={showMeaning} onClick={() => setShowMeaning(v => !v)}>Meaning</DDItem>
            <DDItem checked={hoverAnim}   onClick={() => setHoverAnim(v => !v)}>Pop-up on hover</DDItem>
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
              const ml         = MASTERY_LEVELS[mastery.level];
              const fs         = hanziFontSize(word.hanzi, tileSize);
              const pfs        = popupHanziFontSize(word.hanzi);
              const key        = wordKey(lesson.id, word.hanzi);
              const isFavorite = !!mastery.favorite;
              const isReported = !!mastery.reported;
              return (
                <div
                  key={`${lesson.id}-${word.hanzi}`}
                  className={`char-card-wrap${hoverAnim ? ' char-card-anim' : ''}`}
                >
                  <button
                    className={`char-card char-card-${tileSize}${!showPinyin && !showMeaning ? ' char-card-hanzi-only' : ''}${isReported ? ' char-card-reported' : ''}`}
                    onClick={() => navigate('word', { lesson, word, from: 'wall' })}
                    title={`${word.hanzi} · ${word.pinyin} · ${word.meaning}`}
                  >
                    <div className="char-hanzi" style={fs ? { fontSize: fs } : undefined}>{word.hanzi}</div>
                    {showPinyin  && <div className="char-pinyin">{word.pinyin}</div>}
                    {showMeaning && <div className="char-meaning">{word.meaning}</div>}
                    <div className="char-level-bar" style={{ background: ml.color }} />
                  </button>

                  {/* Favorite toggle button */}
                  {setWordFlag && (
                    <button
                      className={`char-fav-btn${isFavorite ? ' active' : ''}`}
                      onClick={e => { e.stopPropagation(); setWordFlag(key, 'favorite', !isFavorite); }}
                      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      ★
                    </button>
                  )}

                  {hoverAnim && (
                    <div
                      className="char-popup"
                      onClick={() => navigate('word', { lesson, word, from: 'wall' })}
                    >
                      <div className="char-popup-hanzi" style={{ fontSize: pfs }}>{word.hanzi}</div>
                      <div className="char-popup-pinyin">{word.pinyin}</div>
                      <div className="char-popup-meaning">{word.meaning}</div>
                      {word.examples?.[0] && (
                        <div className="char-popup-example">
                          <div className="char-popup-ex-hanzi">{word.examples[0].hanzi}</div>
                          <div className="char-popup-ex-pinyin">{word.examples[0].pinyin}</div>
                          <div className="char-popup-ex-meaning">{word.examples[0].meaning}</div>
                        </div>
                      )}
                      <div className="char-popup-lesson">{lesson.icon} {lesson.title}</div>
                      <div className="char-level-bar" style={{ background: ml.color }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </>
  );
}
