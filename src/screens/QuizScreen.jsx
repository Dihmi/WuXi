import { useState, useMemo } from 'react';
import { QUIZ_MODES } from '../data/lessons';
import { wordKey, shuffle } from '../utils/helpers';
import NavBar from '../components/NavBar';

const QUIZ_LENGTH = 10;

function buildQuiz(lesson, getWordMastery) {
  // Weight lower-mastery words more heavily
  const weighted = [];
  lesson.words.forEach(w => {
    const m = getWordMastery(wordKey(lesson.id, w.hanzi));
    const weight = 5 - m.level; // New=5, Mastered=1
    for (let i = 0; i < weight; i++) weighted.push(w);
  });

  const questions = [];
  const used = new Set();
  const pool = shuffle(weighted);

  for (const word of pool) {
    if (used.has(word.hanzi)) continue;
    if (questions.length >= QUIZ_LENGTH) break;
    used.add(word.hanzi);

    const modeIdx = questions.length % QUIZ_MODES.length;
    const mode = QUIZ_MODES[modeIdx];

    const others = shuffle(lesson.words.filter(w2 => w2.hanzi !== word.hanzi)).slice(0, 3);
    const allOpts = shuffle([word, ...others]);

    questions.push({ word, mode, options: allOpts });
  }

  // Pad if needed
  while (questions.length < Math.min(QUIZ_LENGTH, lesson.words.length)) {
    const word = lesson.words[questions.length % lesson.words.length];
    const modeIdx = questions.length % QUIZ_MODES.length;
    const mode = QUIZ_MODES[modeIdx];
    const others = shuffle(lesson.words.filter(w2 => w2.hanzi !== word.hanzi)).slice(0, 3);
    const allOpts = shuffle([word, ...others]);
    questions.push({ word, mode, options: allOpts });
  }

  return questions;
}

export default function QuizScreen({ lesson, navigate, updateMastery, getWordMastery }) {
  const questions = useMemo(() => buildQuiz(lesson, getWordMastery), [lesson]);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);

  const q = questions[qIdx];
  const answered = selected !== null;
  const correctIdx = q ? q.options.findIndex(o => o.hanzi === q.word.hanzi) : -1;

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

  function renderQuestionDisplay() {
    const { word, mode } = q;
    if (mode.show === 'hanzi') return (
      <>
        <div className="quiz-question-label">{mode.question}</div>
        <div className="quiz-hanzi">{word.hanzi}</div>
        <div style={{ fontSize: 14, color: 'var(--text3)', marginTop: 8 }}>{word.pinyin}</div>
      </>
    );
    if (mode.show === 'meaning') return (
      <>
        <div className="quiz-question-label">{mode.question}</div>
        <div className="quiz-meaning-q">{word.meaning}</div>
      </>
    );
    if (mode.show === 'pinyin') return (
      <>
        <div className="quiz-question-label">{mode.question}</div>
        <div className="quiz-pinyin-q">{word.pinyin}</div>
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
          <div className="quiz-option-meaning">{opt.meaning}</div>
        )}
        {mode.answer === 'hanzi' && (
          <>
            <div className="quiz-option-hanzi">{opt.hanzi}</div>
            {mode.show !== 'pinyin' && <div className="quiz-option-pinyin">{opt.pinyin}</div>}
          </>
        )}
      </div>
    );
  }

  if (done) {
    const correctCount = results.filter(r => r.correct).length;
    const pct = Math.round(correctCount / results.length * 100);
    let scoreClass = 'bad';
    if (pct === 100) scoreClass = 'perfect';
    else if (pct >= 70) scoreClass = 'good';
    else if (pct >= 40) scoreClass = 'okay';

    const msgs = {
      perfect: '完美！Perfect score! 🎉',
      good:    '很好！Great work! 👍',
      okay:    '不错！Keep practicing! 💪',
      bad:     '加油！Keep going! 📚',
    };

    return (
      <>
        <NavBar onBack={() => navigate('lesson', { lesson })} title="Quiz Complete" />
        <div className="screen">
          <div className="summary-body slide-up">
            <div className={`summary-score ${scoreClass}`}>{pct}%</div>
            <div className="summary-label">{msgs[scoreClass]}</div>

            <div className="summary-breakdown">
              <div className="summary-cell">
                <div className="summary-cell-num" style={{ color: '#22c55e' }}>{correctCount}</div>
                <div className="summary-cell-label">Correct</div>
              </div>
              <div className="summary-cell">
                <div className="summary-cell-num" style={{ color: '#ef4444' }}>{results.length - correctCount}</div>
                <div className="summary-cell-label">Wrong</div>
              </div>
            </div>

            <div style={{ marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              {results.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{r.correct ? '✓' : '✗'}</span>
                  <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, flex: 1 }}>{r.word.hanzi}</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{r.word.pinyin}</span>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{r.word.meaning}</span>
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

  return (
    <>
      <NavBar
        onBack={() => navigate('lesson', { lesson })}
        title={lesson.title}
        actions={<span className="quiz-mode-badge">{q.mode.label}</span>}
      />
      <div className="screen">
        <div className="quiz-body">
          <div className="quiz-header">
            <div className="quiz-progress-row">
              <div className="quiz-progress-label">Question {qIdx + 1} of {questions.length}</div>
              <div className="quiz-progress-label">{results.filter(r => r.correct).length} correct</div>
            </div>
            <div className="progress-track" style={{ height: 4 }}>
              <div className="progress-fill" style={{ width: `${(qIdx / questions.length) * 100}%` }} />
            </div>
          </div>

          <div className="quiz-card pop-in" key={qIdx}>
            {renderQuestionDisplay()}
          </div>

          <div className="quiz-options pop-in" key={`opts-${qIdx}`}>
            {q.options.map((opt, idx) => renderOption(opt, idx))}
          </div>

          <div className="feedback-row">
            {answered && selected === correctIdx && (
              <div className="feedback-correct pop-in">
                ✓ Correct!{' '}
                <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: 13 }}>
                  — {q.word.meaning}
                </span>
              </div>
            )}
            {answered && selected !== correctIdx && (
              <div className="feedback-wrong pop-in">
                ✗ The answer was:{' '}
                <span style={{ fontFamily: "'Noto Serif SC', serif", color: '#22c55e' }}>
                  {q.word.hanzi}
                </span>{' '}
                <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: 13 }}>
                  — {q.word.meaning}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleNext} disabled={!answered}>
              {qIdx + 1 >= questions.length ? 'See Results' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
