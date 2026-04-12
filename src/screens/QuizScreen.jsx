import { useState, useMemo } from 'react';
import { QUIZ_MODES } from '../data/lessons';
import { wordKey, shuffle } from '../utils/helpers';
import NavBar from '../components/NavBar';

function getModeForQuestion(idx, quizType) {
  if (quizType === 'mix') return QUIZ_MODES[idx % QUIZ_MODES.length];
  const modeId = parseInt(quizType, 10);
  return QUIZ_MODES.find(m => m.id === modeId) ?? QUIZ_MODES[0];
}

function buildQuiz(lesson, getWordMastery, quizLength, quizType = 'mix') {
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

    const mode = getModeForQuestion(questions.length, quizType);
    const others = shuffle(lesson.words.filter(w2 => w2.hanzi !== word.hanzi)).slice(0, 3);
    const allOpts = shuffle([word, ...others]);
    questions.push({ word, mode, options: allOpts });
  }

  while (questions.length < Math.min(quizLength, lesson.words.length)) {
    const word = lesson.words[questions.length % lesson.words.length];
    const mode = getModeForQuestion(questions.length, quizType);
    const others = shuffle(lesson.words.filter(w2 => w2.hanzi !== word.hanzi)).slice(0, 3);
    const allOpts = shuffle([word, ...others]);
    questions.push({ word, mode, options: allOpts });
  }

  return questions;
}

export default function QuizScreen({ lesson, navigate, updateMastery, getWordMastery, setWordFlag, quizCount = 10, quizType = 'mix' }) {
  const questions = useMemo(() => buildQuiz(lesson, getWordMastery, quizCount, quizType), [lesson, quizCount, quizType]);
  const [qIdx,     setQIdx]     = useState(0);
  const [selected, setSelected] = useState(null);
  const [results,  setResults]  = useState([]);
  const [done,     setDone]     = useState(false);

  const q = questions[qIdx];
  const answered    = selected !== null;
  const correctIdx  = q ? q.options.findIndex(o => o.hanzi === q.word.hanzi) : -1;

  const currentKey      = q ? wordKey(lesson.id, q.word.hanzi) : null;
  const currentMastery  = q ? getWordMastery(currentKey) : null;
  const isReported      = currentMastery?.reported  ?? false;
  const isFavorite      = currentMastery?.favorite  ?? false;

  function toggleFlag(flag, current) {
    if (!currentKey) return;
    setWordFlag(currentKey, flag, !current);
  }

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
        {mode.answer === 'pinyin' && (
          <div className="quiz-opt-pinyin">{opt.pinyin}</div>
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

          {/* Card + side action column */}
          <div className="quiz-card-row">

            {/* Question card with flip reveal */}
            <div className="quiz-flip-wrap pop-in" key={qIdx}>
              <div className={`quiz-flip-inner${answered ? ' flipped' : ''}`}>

                {/* Front face — question */}
                <div className="quiz-face quiz-face-front">
                  {renderQuestion()}
                </div>

                {/* Back face — full word reveal */}
                <div className={`quiz-face quiz-face-back${answered ? (selected === correctIdx ? ' reveal-correct' : ' reveal-wrong') : ''}`}>
                  <div className="reveal-verdict">
                    {selected === correctIdx ? '✓ Correct' : '✗ Wrong'}
                  </div>
                  <div className="reveal-hanzi">{q.word.hanzi}</div>
                  <div className="reveal-pinyin">{q.word.pinyin}</div>
                  <div className="reveal-meaning">{q.word.meaning}</div>
                  {q.word.examples?.length > 0 && (
                    <div className="reveal-examples">
                      <div className="reveal-ex-label">
                        {q.word.examples.length === 1 ? 'Example' : 'Examples'}
                      </div>
                      {q.word.examples.map((ex, i) => (
                        <div key={i} className="reveal-example">
                          <div className="reveal-ex-hanzi">{ex.hanzi}</div>
                          {ex.pinyin  && <div className="reveal-ex-pinyin">{ex.pinyin}</div>}
                          {ex.meaning && <div className="reveal-ex-meaning">{ex.meaning}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Side action column — appears after answering */}
            {answered && (
              <div className="quiz-card-actions">
                <button
                  className={`quiz-action-btn${isFavorite ? ' active-fav' : ''}`}
                  onClick={() => toggleFlag('favorite', isFavorite)}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24"
                    fill={isFavorite ? 'currentColor' : 'none'}
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  <span>{isFavorite ? 'Saved' : 'Fav'}</span>
                </button>

                <button
                  className={`quiz-action-btn${isReported ? ' active-report' : ''}`}
                  onClick={() => toggleFlag('reported', isReported)}
                  title={isReported ? 'Remove report' : 'Report card issue'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24"
                    fill={isReported ? 'currentColor' : 'none'}
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                    <line x1="4" y1="22" x2="4" y2="15"/>
                  </svg>
                  <span>{isReported ? 'Flagged' : 'Report'}</span>
                </button>

                <button className="quiz-action-btn quiz-action-next btn-primary" onClick={handleNext}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {qIdx + 1 >= questions.length
                      ? <><polyline points="20 6 9 17 4 12"/></>
                      : <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>
                    }
                  </svg>
                  <span>{qIdx + 1 >= questions.length ? 'Done' : 'Next'}</span>
                </button>
              </div>
            )}

          </div>

          {/* Options */}
          <div className="quiz-options pop-in" key={`opts-${qIdx}`}>
            {q.options.map((opt, idx) => renderOption(opt, idx))}
          </div>

        </div>
      </div>
    </>
  );
}
