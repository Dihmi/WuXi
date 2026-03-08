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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Quiz
          </button>
        }
      />
      <div className="screen">
        <div className="lesson-hero">
          <div className="lesson-hero-title">{lesson.icon} {lesson.title}</div>
          <div className="lesson-hero-desc">{lesson.description}</div>
          <div style={{ marginBottom: 8 }}>
            <ProgressBar pct={pct} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            {pct}% mastered · {counts[4]} of {lesson.words.length} words
          </div>
        </div>

        <div className="filter-tabs">
          {FILTER_OPTIONS.map(f => (
            <button
              key={f}
              className={`filter-tab${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              <span
                className="filter-count"
                style={filter === f ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}}
              >
                {filterCount(f)}
              </span>
            </button>
          ))}
        </div>

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
                  style={{ borderColor: `${ml.color}30` }}
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
