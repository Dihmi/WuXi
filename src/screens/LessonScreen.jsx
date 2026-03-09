import { useState, useMemo } from 'react';
import { MASTERY_LEVELS } from '../data/lessons';
import { wordKey } from '../utils/helpers';
import NavBar from '../components/NavBar';
import MasteryBadge from '../components/MasteryBadge';
import ProgressBar from '../components/ProgressBar';

const FILTER_OPTIONS = ['All', 'New', 'Learning', 'Familiar', 'Practiced', 'Mastered'];

export default function LessonScreen({ lesson, navigate, getWordMastery, getLessonProgress }) {
  const [filter, setFilter] = useState('All');
  const { pct, counts } = getLessonProgress(lesson);

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
            Quiz
          </button>
        }
      />
      <div className="screen">

        {/* ── Lesson header ─────────────────────────────────────── */}
        <div className="lesson-header">
          <div className="lesson-header-top">
            <div className="lesson-header-icon">{lesson.icon}</div>
            <div>
              <div className="lesson-header-title">{lesson.title}</div>
              <div className="lesson-header-desc">{lesson.description}</div>
            </div>
          </div>
          <div className="lesson-progress-labels">
            <span>{counts[4]} of {lesson.words.length} words mastered</span>
            <span className="lesson-progress-pct">{pct}%</span>
          </div>
          <ProgressBar pct={pct} />
        </div>

        {/* ── Filter chips ──────────────────────────────────────── */}
        <div className="filter-row">
          {FILTER_OPTIONS.map(f => (
            <button
              key={f}
              className={`filter-chip${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              <span className="filter-chip-count">{filterCount(f)}</span>
            </button>
          ))}
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
