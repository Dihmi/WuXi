import { useState, useMemo } from 'react';
import { QUIZ_MODES } from '../data/lessons';
import { wordKey, shuffle } from '../utils/helpers';
import NavBar from '../components/NavBar';

function buildQuiz(lesson, getWordMastery, quizLength) {
  const weighted = [];
  lesson.words.forEach(w => {
    const m = getWordMastery(wordKey(lesson.id, w.hanzi));
    const weight = 5 - m.level;
    for (let i = 0; i < weight; i++) weighted.push(w);
  });

  const questions = [];
  const used = new Set();
  const pool = shuffle(weighted);

  for (const word of pool) {
    if (used.has(word.hanzi)) continue;
    if (questions.length >= quizLength) break;
    used.add(word.hanzi);

    const modeIdx = questions.length % QUIZ_MODES.length;
    const mode = QUIZ_MODES[modeIdx];
    const others = shuffle(lesson.words.filter(w2 => w2.hanzi !== word.hanzi)).slice(0, 3);
    const allOpts = shuffle([word, ...others]);
    questions.push({ word, mode, options: allOpts });
  }

  while (questions.length < Math.min(quizLength, lesson.words.length)) {
    const word = lesson.words[questions.length % lesson.words.length];
    const modeIdx = questions.length % QUIZ_MODES.length;
    const mode = QUIZ_MODES[modeIdx];
    const others = shuffle(lesson.words.filter(w2 => w2.hanzi !== word.hanzi)).slice(0, 3);
    const allOpts = shuffle([word, ...others]);
    questions.push({ word, mode, options: allOpts });
  }

  return questions;
}

export default function QuizScreen({ lesson, navigate, updateMastery, getWordMastery, quizCount = 10 }) {
  const questions = useMemo(() => buildQuiz(lesson, getWordMastery, quizCount), [lesson, quizCount]);
  const [qIdx,     setQIdx]     = useState(0);
  const [selected, setSelected] = useState(null);
  const [results,  setResults]  = useState([]);
  const [done,     setDone]     = useState(false);

  const q = questions[qIdx];
  const answered    = selected !== null;
  const correctIdx  = q ? q.options.findIndex(o => o.hanzi === q.word.hanzi) : -1;

  function handleSelect(idx) {
    if (answered) return;
    setSelected(idx);
    const correct = idx === correctIdx;
    updateMastery(wordKey(lesson.id, q.word.hanzi), correct);
    setResults(prev => [...prev, { correct, word: q.word }]);
  }

  function handleNext() {
    if (qIdx + 1 >= questions.length) {
      setDone(true);
    } else {
      setQIdx(i => i + 1);
      setSelected(null);
    }
  }

  function renderQuestion() {
    const { word, mode } = q;
    if (mode.show === 'hanzi') return (
      <>
        <div className="quiz-q-label">{mode.question}</div>
        <div className="quiz-hanzi">{word.hanzi}</div>
        <div className="quiz-hanzi-sub">{word.pinyin}</div>
      </>
    );
    if (mode.show === 'meaning') return (
      <>
        <div className="quiz-q-label">{mode.question}</div>
        <div className="quiz-meaning">{word.meaning}</div>
      </>
    );
    if (mode.show === 'pinyin') return (
      <>
        <div className="quiz-q-label">{mode.question}</div>
        <div className="quiz-pinyin">{word.pinyin}</div>
      </>
    );
  }

  function renderOption(opt, idx) {
    const { mode } = q;
    let cls = 'quiz-option';
    if (answered) {
      cls += ' answered';
      if (idx === correctIdx) cls += ' correct';
      else if (idx === selected) cls += ' wrong';
    }
    return (
      <div key={opt.hanzi} className={cls} onClick={() => handleSelect(idx)}>
        {mode.answer === 'meaning' && (
          <div className="quiz-opt-meaning">{opt.meaning}</div>
        )}
        {mode.answer === 'hanzi' && (
          <>
            <div className="quiz-opt-hanzi">{opt.hanzi}</div>
            {mode.show !== 'pinyin' && <div className="quiz-opt-pinyin">{opt.pinyin}</div>}
          </>
        )}
      </div>
    );
  }

  /* ── Summary screen ─────────────────────────────────────────── */
  if (done) {
    const correctCount = results.filter(r => r.correct).length;
    const pct = Math.round(correctCount / results.length * 100);
    let scoreClass = 'bad';
    if (pct === 100) scoreClass = 'perfect';
    else if (pct >= 70) scoreClass = 'good';
    else if (pct >= 40) scoreClass = 'okay';

    const emojis = { perfect: '🎉', good: '👍', okay: '💪', bad: '📚' };
    const msgs   = {
      perfect: '完美！Perfect score!',
      good:    '很好！Great work!',
      okay:    '不错！Keep practicing!',
      bad:     '加油！Keep going!',
    };

    return (
      <>
        <NavBar onBack={() => navigate('lesson', { lesson })} title="Results" />
        <div className="screen">
          <div className="summary-body slide-up">
            <div className="summary-emoji">{emojis[scoreClass]}</div>
            <div className={`summary-score ${scoreClass}`}>{pct}%</div>
            <div className="summary-label">{msgs[scoreClass]}</div>

            <div className="summary-stats">
              <div className="summary-stat">
                <div className="summary-stat-num" style={{ color: 'var(--success)' }}>{correctCount}</div>
                <div className="summary-stat-label">Correct</div>
              </div>
              <div className="summary-stat">
                <div className="summary-stat-num" style={{ color: 'var(--danger)' }}>{results.length - correctCount}</div>
                <div className="summary-stat-label">Wrong</div>
              </div>
            </div>

            <div className="summary-results">
              {results.map((r, i) => (
                <div key={i} className="summary-result-row">
                  <span className="summary-result-icon" style={{ color: r.correct ? 'var(--success)' : 'var(--danger)' }}>
                    {r.correct ? '✓' : '✗'}
                  </span>
                  <span className="summary-result-hanzi">{r.word.hanzi}</span>
                  <span className="summary-result-pinyin">{r.word.pinyin}</span>
                  <span className="summary-result-meaning">{r.word.meaning}</span>
                </div>
              ))}
            </div>

            <div className="summary-actions">
              <button className="btn btn-secondary" onClick={() => navigate('lesson', { lesson })}>
                Back to Lesson
              </button>
              <button
                className="btn btn-primary"
                onClick={() => { setQIdx(0); setSelected(null); setResults([]); setDone(false); }}
              >
                Retry Quiz
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Quiz screen ────────────────────────────────────────────── */
  return (
    <>
      <NavBar
        onBack={() => navigate('lesson', { lesson })}
        title={lesson.title}
        actions={<span className="quiz-mode-tag">{q.mode.label}</span>}
      />
      <div className="screen">
        <div className="quiz-body">

          {/* Progress */}
          <div className="quiz-progress">
            <div className="quiz-progress-row">
              <span className="quiz-progress-label">Question {qIdx + 1} of {questions.length}</span>
              <span className="quiz-score-badge">{results.filter(r => r.correct).length} correct</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${(qIdx / questions.length) * 100}%` }} />
            </div>
          </div>

          {/* Question card */}
          <div className="quiz-card pop-in" key={qIdx}>
            {renderQuestion()}
          </div>

          {/* Options */}
          <div className="quiz-options pop-in" key={`opts-${qIdx}`}>
            {q.options.map((opt, idx) => renderOption(opt, idx))}
          </div>

          {/* Feedback */}
          <div className="feedback-area">
            {answered && selected === correctIdx && (
              <div className="feedback-msg correct pop-in">
                ✓ Correct!
                <span className="feedback-hint">— {q.word.meaning}</span>
              </div>
            )}
            {answered && selected !== correctIdx && (
              <div className="feedback-msg wrong pop-in">
                ✗ Answer:{' '}
                <span style={{ fontFamily: "'Noto Serif SC', serif", color: 'var(--success)' }}>
                  {q.word.hanzi}
                </span>
                <span className="feedback-hint">— {q.word.meaning}</span>
              </div>
            )}
          </div>

          {/* Next */}
          <div className="quiz-nav">
            <button className="btn btn-primary" onClick={handleNext} disabled={!answered}>
              {qIdx + 1 >= questions.length ? 'See Results' : 'Next →'}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
