import { useState, useCallback, useMemo } from 'react';
import { LESSONS } from './data/lessons';
import useMastery from './hooks/useMastery';
import useDecks   from './hooks/useDecks';
import HomeScreen       from './screens/HomeScreen';
import LessonScreen     from './screens/LessonScreen';
import WordReviewScreen from './screens/WordReviewScreen';
import QuizScreen       from './screens/QuizScreen';

export default function App() {
  const [screen,         setScreen]         = useState('home');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedWord,   setSelectedWord]   = useState(null);

  const { updateMastery, getWordMastery, getLessonProgress } = useMastery();
  const { importedLessons, deckStatus, deckErrors }          = useDecks();

  // Merge built-in lessons with any successfully parsed .apkg decks
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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {screen === 'home' && (
        <HomeScreen
          lessons={allLessons}
          deckStatus={deckStatus}
          deckErrors={deckErrors}
          navigate={navigate}
          getLessonProgress={getLessonProgress}
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
    </div>
  );
}
