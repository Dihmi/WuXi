import { useState, useCallback, useMemo } from 'react';
import useAuth      from './hooks/useAuth';
import useMastery   from './hooks/useMastery';
import useDecks     from './hooks/useDecks';
import useTheme     from './hooks/useTheme';
import LoginScreen      from './screens/LoginScreen';
import HomeScreen       from './screens/HomeScreen';
import LessonScreen     from './screens/LessonScreen';
import WordReviewScreen from './screens/WordReviewScreen';
import QuizScreen       from './screens/QuizScreen';
import HanziWallScreen  from './screens/HanziWallScreen';
import ThemeSelector    from './components/ThemeSelector';

export default function App() {
  const [screen,         setScreen]         = useState('home');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedWord,   setSelectedWord]   = useState(null);
  const [wordOrigin,     setWordOrigin]     = useState('lesson');
  const [showTheme,      setShowTheme]      = useState(false);
  const [quizCount,      setQuizCount]      = useState(10);

  const { user, signInWithGoogle, logout } = useAuth();
  const { theme, applyTheme, themes }      = useTheme();

  // Derive a "currentProfile" shape from the Firebase user so downstream
  // components need no changes — id, name, avatar (emoji fallback), photoURL
  const currentProfile = useMemo(() => {
    if (!user) return null;
    return {
      id:       user.uid,
      name:     user.displayName || 'Learner',
      avatar:   user.photoURL ? null : '🐉',   // null triggers img fallback in NavBar
      photoURL: user.photoURL || null,
    };
  }, [user]);

  const { masteryData, updateMastery, setWordLevel, resetMastery, getWordMastery, getLessonProgress, syncError } =
    useMastery(currentProfile?.id);

  const { importedLessons, deckStatus, deckErrors } = useDecks();

  const allLessons = useMemo(() => importedLessons, [importedLessons]);

  const navigate = useCallback((nextScreen, data = {}) => {
    if (nextScreen === 'word') setWordOrigin(data.from ?? 'lesson');
    setScreen(nextScreen);
    if (data.lesson     !== undefined) setSelectedLesson(data.lesson);
    if (data.word       !== undefined) setSelectedWord(data.word);
    if (data.quizCount  !== undefined) setQuizCount(data.quizCount);
    setTimeout(() => {
      const s = document.querySelector('.screen');
      if (s) s.scrollTop = 0;
    }, 0);
  }, []);

  /* ── Export progress ────────────────────────────────────────── */
  const handleExport = useCallback(() => {
    const payload = {
      version:    1,
      exportedAt: new Date().toISOString(),
      profile:    currentProfile,
      theme,
      mastery:    masteryData,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `wuxi-${(currentProfile.name).replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentProfile, masteryData, theme]);

  /* ── Import progress ────────────────────────────────────────── */
  const handleImport = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.mastery && typeof data.mastery === 'object') {
          resetMastery(data.mastery);
          if (data.theme) applyTheme(data.theme);
        } else {
          alert('Invalid progress file — no mastery data found.');
        }
      } catch {
        alert('Could not parse the file. Make sure it\'s a valid WuXi export.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [resetMastery, applyTheme]);

  /* ── Auth loading ───────────────────────────────────────────── */
  if (user === undefined) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg)',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"
          style={{ animation: 'spin 0.8s linear infinite' }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  /* ── Not signed in ──────────────────────────────────────────── */
  if (!user) {
    return <LoginScreen onSignIn={signInWithGoogle} />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {syncError && (
        <div style={{
          background: 'var(--danger-bg)', borderBottom: '1px solid var(--danger)',
          color: 'var(--danger)', fontSize: '12px', padding: '6px 16px', textAlign: 'center',
        }}>
          Cloud sync error: {syncError} — progress is saved locally only.
        </div>
      )}

      {showTheme && (
        <ThemeSelector
          currentTheme={theme}
          onSelect={applyTheme}
          onClose={() => setShowTheme(false)}
          themes={themes}
        />
      )}

      {screen === 'home' && (
        <HomeScreen
          lessons={allLessons}
          deckStatus={deckStatus}
          deckErrors={deckErrors}
          navigate={navigate}
          getLessonProgress={getLessonProgress}
          currentProfile={currentProfile}
          onThemeClick={() => setShowTheme(true)}
          onProfileClick={() => {}}
          onLogout={logout}
          onExport={handleExport}
          onImport={handleImport}
          onWall={() => navigate('wall')}
        />
      )}
      {screen === 'lesson' && selectedLesson && (
        <LessonScreen
          lesson={selectedLesson}
          navigate={navigate}
          getWordMastery={getWordMastery}
          getLessonProgress={getLessonProgress}
        />
      )}
      {screen === 'word' && selectedWord && selectedLesson && (
        <WordReviewScreen
          word={selectedWord}
          lesson={selectedLesson}
          navigate={navigate}
          getWordMastery={getWordMastery}
          setWordLevel={setWordLevel}
          wordOrigin={wordOrigin}
        />
      )}
      {screen === 'quiz' && selectedLesson && (
        <QuizScreen
          lesson={selectedLesson}
          navigate={navigate}
          updateMastery={updateMastery}
          getWordMastery={getWordMastery}
          quizCount={quizCount}
        />
      )}
      {screen === 'wall' && (
        <HanziWallScreen
          lessons={allLessons}
          navigate={navigate}
          getWordMastery={getWordMastery}
        />
      )}
    </div>
  );
}
