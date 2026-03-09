import { useState, useCallback, useMemo } from 'react';
import { LESSONS } from './data/lessons';
import useMastery   from './hooks/useMastery';
import useDecks     from './hooks/useDecks';
import useProfiles  from './hooks/useProfiles';
import useTheme     from './hooks/useTheme';
import HomeScreen       from './screens/HomeScreen';
import LessonScreen     from './screens/LessonScreen';
import WordReviewScreen from './screens/WordReviewScreen';
import QuizScreen       from './screens/QuizScreen';
import HanziWallScreen  from './screens/HanziWallScreen';
import ProfileModal     from './components/ProfileModal';
import ThemeSelector    from './components/ThemeSelector';

export default function App() {
  const [screen,         setScreen]         = useState('home');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedWord,   setSelectedWord]   = useState(null);
  const [showTheme,      setShowTheme]      = useState(false);
  const [showProfiles,   setShowProfiles]   = useState(false);

  const { profiles, currentProfile, createProfile, selectProfile, logout, deleteProfile } = useProfiles();
  const { theme, applyTheme, themes } = useTheme();

  const { masteryData, updateMastery, resetMastery, getWordMastery, getLessonProgress } =
    useMastery(currentProfile?.id);

  const { importedLessons, deckStatus, deckErrors } = useDecks();

  const allLessons = useMemo(
    () => [...LESSONS, ...importedLessons],
    [importedLessons],
  );

  const navigate = useCallback((nextScreen, data = {}) => {
    setScreen(nextScreen);
    if (data.lesson !== undefined) setSelectedLesson(data.lesson);
    if (data.word   !== undefined) setSelectedWord(data.word);
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
      profile:    currentProfile,   // includes id, name, avatar, createdAt
      theme,                        // active theme id
      mastery:    masteryData,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `wuxi-${currentProfile.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
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

  /* ── Profile not selected ───────────────────────────────────── */
  if (!currentProfile) {
    return (
      <ProfileModal
        profiles={profiles}
        onCreate={createProfile}
        onSelect={selectProfile}
        onDelete={deleteProfile}
      />
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {showTheme && (
        <ThemeSelector
          currentTheme={theme}
          onSelect={applyTheme}
          onClose={() => setShowTheme(false)}
          themes={themes}
        />
      )}

      {showProfiles && (
        <ProfileModal
          profiles={profiles}
          onCreate={(name, avatar) => { createProfile(name, avatar); setShowProfiles(false); }}
          onSelect={(id) => { selectProfile(id); setShowProfiles(false); }}
          onDelete={deleteProfile}
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
          onProfileClick={() => setShowProfiles(true)}
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
          updateMastery={updateMastery}
        />
      )}
      {screen === 'quiz' && selectedLesson && (
        <QuizScreen
          lesson={selectedLesson}
          navigate={navigate}
          updateMastery={updateMastery}
          getWordMastery={getWordMastery}
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
