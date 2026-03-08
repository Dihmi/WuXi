import { MASTERY_LEVELS } from '../data/lessons';
import { wordKey } from '../utils/helpers';
import NavBar from '../components/NavBar';
import MasteryBadge from '../components/MasteryBadge';

export default function WordReviewScreen({ word, lesson, navigate, getWordMastery, updateMastery }) {
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
        onBack={() => navigate('lesson', { lesson })}
        title={`${wordIdx + 1} / ${lesson.words.length}`}
        subtitle={lesson.title}
        actions={
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-secondary"
              disabled={!prevWord}
              onClick={() => prevWord && navigate('word', { lesson, word: prevWord })}
              style={{ padding: '7px 12px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              className="btn btn-secondary"
              disabled={!nextWord}
              onClick={() => nextWord && navigate('word', { lesson, word: nextWord })}
              style={{ padding: '7px 12px' }}
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
          <div className="word-review-card slide-up">
            <div className="hanzi-main">{word.hanzi}</div>
            <div className="pinyin-main">{word.pinyin}</div>
            <div className="meaning-main">{word.meaning}</div>
            <MasteryBadge level={m.level} />
            <div className="divider" />
            <div className="example-section">
              <div className="example-label">Example sentence</div>
              <div className="example-hanzi">{word.example}</div>
              <div className="example-pinyin">{word.examplePinyin}</div>
              <div className="example-meaning">{word.exampleMeaning}</div>
            </div>
          </div>

          <div className="stats-grid slide-up" style={{ animationDelay: '0.05s' }}>
            <div className="stat-card">
              <div className="stat-card-num" style={{ color: '#22c55e' }}>{m.correct}</div>
              <div className="stat-card-label">Correct</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-num" style={{ color: '#ef4444' }}>{m.wrong}</div>
              <div className="stat-card-label">Wrong</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-num" style={{ color: 'var(--gold)' }}>{accuracy}%</div>
              <div className="stat-card-label">Accuracy</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-num" style={{ color: ml.color }}>{m.streak}</div>
              <div className="stat-card-label">Streak</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
            <button
              className="btn btn-secondary"
              style={{ borderColor: '#ef444440', color: '#ef4444' }}
              onClick={() => updateMastery(wordKey(lesson.id, word.hanzi), false)}
            >
              ✗ Mark Wrong
            </button>
            <button
              className="btn btn-secondary"
              style={{ borderColor: '#22c55e40', color: '#22c55e' }}
              onClick={() => updateMastery(wordKey(lesson.id, word.hanzi), true)}
            >
              ✓ Mark Correct
            </button>
            <button className="btn btn-primary" onClick={() => navigate('quiz', { lesson })}>
              Quiz this lesson
            </button>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Mastery Progress
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {MASTERY_LEVELS.map(lvl => (
                <div key={lvl.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: '100%', height: 6, borderRadius: 3,
                    background: m.level >= lvl.id ? lvl.color : 'var(--surface2)',
                    transition: 'background 0.3s ease',
                    boxShadow: m.level === lvl.id ? `0 0 8px ${lvl.color}80` : 'none',
                  }} />
                  <div style={{
                    fontSize: 9,
                    color: m.level >= lvl.id ? lvl.color : 'var(--text3)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                  }}>
                    {lvl.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
