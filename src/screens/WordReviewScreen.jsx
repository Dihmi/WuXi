import { useState } from 'react';
import { createPortal } from 'react-dom';
import { MASTERY_LEVELS } from '../data/lessons';
import { wordKey } from '../utils/helpers';
import NavBar from '../components/NavBar';
import MasteryBadge from '../components/MasteryBadge';

export default function WordReviewScreen({ word, lesson, navigate, getWordMastery, setWordLevel, wordOrigin }) {
  const [pendingLevel, setPendingLevel] = useState(null);
  const m = getWordMastery(wordKey(lesson.id, word.hanzi));
  const ml = MASTERY_LEVELS[m.level];
  const total = m.correct + m.wrong;
  const accuracy = total > 0 ? Math.round(m.correct / total * 100) : 0;

  const wordIdx = lesson.words.findIndex(w => w.hanzi === word.hanzi);
  const prevWord = wordIdx > 0 ? lesson.words[wordIdx - 1] : null;
  const nextWord = wordIdx < lesson.words.length - 1 ? lesson.words[wordIdx + 1] : null;

  return (
    <>
      <NavBar
        onBack={() => wordOrigin === 'wall' ? navigate('wall') : navigate('lesson', { lesson })}
        title={`${wordIdx + 1} / ${lesson.words.length}`}
        subtitle={lesson.title}
        actions={
          <div style={{ display: 'flex', gap: 5 }}>
            <button
              className="btn btn-secondary"
              disabled={!prevWord}
              onClick={() => prevWord && navigate('word', { lesson, word: prevWord })}
              style={{ padding: '6px 10px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              className="btn btn-secondary"
              disabled={!nextWord}
              onClick={() => nextWord && navigate('word', { lesson, word: nextWord })}
              style={{ padding: '6px 10px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        }
      />
      <div className="screen">
        <div className="word-review-body">

          {/* ── Word display ────────────────────────────────────── */}
          <div className="word-display-card slide-up">
            <div className="hanzi-main">{word.hanzi}</div>
            <div className="pinyin-main">{word.pinyin}</div>
            <div className="meaning-main">{word.meaning}</div>
            <MasteryBadge level={m.level} />
            {word.examples?.length > 0 && (
              <>
                <div className="divider" />
                <div className="example-section">
                  <div className="example-label">
                    {word.examples.length === 1 ? 'Example sentence' : 'Example sentences'}
                  </div>
                  {word.examples.map((ex, i) => (
                    <div key={i} className={i > 0 ? 'example-item example-item-sep' : 'example-item'}>
                      <div className="example-hanzi">{ex.hanzi}</div>
                      {ex.pinyin  && <div className="example-pinyin">{ex.pinyin}</div>}
                      {ex.meaning && <div className="example-meaning">{ex.meaning}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Stats ───────────────────────────────────────────── */}
          <div className="stats-row slide-up" style={{ animationDelay: '0.05s' }}>
            <div className="stat-tile">
              <div className="stat-tile-num" style={{ color: 'var(--success)' }}>{m.correct}</div>
              <div className="stat-tile-label">Correct</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-num" style={{ color: 'var(--danger)' }}>{m.wrong}</div>
              <div className="stat-tile-label">Wrong</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-num" style={{ color: 'var(--gold)' }}>{accuracy}%</div>
              <div className="stat-tile-label">Accuracy</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-num" style={{ color: ml.color }}>{m.streak}</div>
              <div className="stat-tile-label">Streak</div>
            </div>
          </div>

          {/* ── Mastery ladder ──────────────────────────────────── */}
          <div className="mastery-ladder slide-up" style={{ animationDelay: '0.08s' }}>
            <div className="mastery-ladder-label">Mastery Progress</div>
            <div className="mastery-ladder-steps">
              {MASTERY_LEVELS.map(lvl => (
                <button
                  key={lvl.id}
                  className="mastery-step mastery-step-btn"
                  onClick={() => lvl.id !== m.level && setPendingLevel(lvl.id)}
                  title={lvl.id !== m.level ? `Set to ${lvl.name}` : undefined}
                >
                  <div
                    className="mastery-step-bar"
                    style={{
                      background: m.level >= lvl.id ? lvl.color : 'var(--surface3)',
                      boxShadow: m.level === lvl.id ? `0 0 8px ${lvl.color}60` : 'none',
                    }}
                  />
                  <div
                    className="mastery-step-name"
                    style={{ color: m.level >= lvl.id ? lvl.color : 'var(--text3)' }}
                  >
                    {lvl.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

</div>
      </div>

      {/* ── Mastery override confirmation modal ─────────────────── */}
      {pendingLevel !== null && createPortal(
        <>
          <div className="modal-backdrop" onClick={() => setPendingLevel(null)} />
          <div className="logout-confirm-dialog">
            <div className="logout-confirm-icon" style={{ color: MASTERY_LEVELS[pendingLevel].color }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <div className="logout-confirm-title">Override Mastery?</div>
            <div className="logout-confirm-msg">
              Set <strong>{word.hanzi}</strong> to <strong style={{ color: MASTERY_LEVELS[pendingLevel].color }}>{MASTERY_LEVELS[pendingLevel].name}</strong>?
              <br />Quiz history for this character will be reset.
            </div>
            <div className="logout-confirm-actions">
              <button className="btn btn-secondary" onClick={() => setPendingLevel(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ background: MASTERY_LEVELS[pendingLevel].color, borderColor: MASTERY_LEVELS[pendingLevel].color }}
                onClick={() => {
                  setWordLevel(wordKey(lesson.id, word.hanzi), pendingLevel);
                  setPendingLevel(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
