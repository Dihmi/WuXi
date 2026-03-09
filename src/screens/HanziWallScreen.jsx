import { useState, useMemo } from 'react';
import { MASTERY_LEVELS } from '../data/lessons';
import { wordKey } from '../utils/helpers';
import NavBar from '../components/NavBar';

const SORT_OPTIONS = [
  { id: 'lesson',  label: 'Lesson' },
  { id: 'level',   label: 'Level' },
  { id: 'az',      label: 'A–Z' },
];

export default function HanziWallScreen({ lessons, navigate, getWordMastery }) {
  const [search,       setSearch]       = useState('');
  const [levelFilter,  setLevelFilter]  = useState(null);   // null = all
  const [lessonFilter, setLessonFilter] = useState(null);   // null = all
  const [sort,         setSort]         = useState('lesson');

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
      if (levelFilter  !== null && mastery.level !== levelFilter)  return false;
      if (lessonFilter !== null && lesson.id !== lessonFilter)      return false;
      if (q && !word.hanzi.includes(q) && !word.pinyin.toLowerCase().includes(q) && !word.meaning.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allWords, levelFilter, lessonFilter, search]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sort === 'level') {
      arr.sort((a, b) => b.mastery.level - a.mastery.level);
    } else if (sort === 'az') {
      arr.sort((a, b) => a.word.hanzi.localeCompare(b.word.hanzi, 'zh'));
    }
    // 'lesson' keeps insertion order (already grouped by lesson)
    return arr;
  }, [filtered, sort]);

  const toggleLevel = (id) => setLevelFilter(prev => prev === id ? null : id);
  const toggleLesson = (id) => setLessonFilter(prev => prev === id ? null : id);

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

        {/* ── Level filter chips ───────────────────────────────────── */}
        <div className="wall-filter-row">
          <span className="wall-filter-section-label">Level</span>
          {MASTERY_LEVELS.map(ml => (
            <button
              key={ml.id}
              className={`wall-chip${levelFilter === ml.id ? ' active' : ''}`}
              style={levelFilter === ml.id ? { background: ml.bg, borderColor: ml.color, color: ml.color } : {}}
              onClick={() => toggleLevel(ml.id)}
            >
              {ml.name}
            </button>
          ))}
        </div>

        {/* ── Lesson filter chips ──────────────────────────────────── */}
        <div className="wall-filter-row" style={{ marginTop: 6 }}>
          <span className="wall-filter-section-label">Lesson</span>
          <div className="wall-chips-scroll">
            {lessons.map(l => (
              <button
                key={l.id}
                className={`wall-chip${lessonFilter === l.id ? ' active' : ''}`}
                onClick={() => toggleLesson(l.id)}
              >
                {l.icon} {l.title}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sort tabs ────────────────────────────────────────────── */}
        <div className="wall-sort-row">
          <span className="wall-filter-section-label">Sort</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.id}
              className={`wall-sort-btn${sort === opt.id ? ' active' : ''}`}
              onClick={() => setSort(opt.id)}
            >
              {opt.label}
            </button>
          ))}
          <span className="wall-count">{sorted.length} shown</span>
        </div>

        {/* ── Character grid ───────────────────────────────────────── */}
        {sorted.length === 0 ? (
          <div className="wall-empty">No characters match your filters.</div>
        ) : (
          <div className="char-grid">
            {sorted.map(({ word, lesson, mastery }) => {
              const ml = MASTERY_LEVELS[mastery.level];
              return (
                <button
                  key={`${lesson.id}-${word.hanzi}`}
                  className="char-card"
                  onClick={() => navigate('word', { lesson, word })}
                  title={`${word.hanzi} · ${word.pinyin} · ${word.meaning}`}
                >
                  <div className="char-hanzi">{word.hanzi}</div>
                  <div className="char-pinyin">{word.pinyin}</div>
                  <div className="char-meaning">{word.meaning}</div>
                  <div
                    className="char-level-bar"
                    style={{ background: ml.color }}
                  />
                </button>
              );
            })}
          </div>
        )}

      </div>
    </>
  );
}
