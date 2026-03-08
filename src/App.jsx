import { useState, useCallback } from 'react';
import useMastery from './hooks/useMastery';
import HomeScreen from './screens/HomeScreen';
import LessonScreen from './screens/LessonScreen';
import WordReviewScreen from './screens/WordReviewScreen';
import QuizScreen from './screens/QuizScreen';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const { updateMastery, getWordMastery, getLessonProgress } = useMastery();

  const navigate = useCallback((nextScreen, data = {}) => {
    setScreen(nextScreen);
    if (data.lesson !== undefined) setSelectedLesson(data.lesson);
    if (data.word !== undefined) setSelectedWord(data.word);
    setTimeout(() => {
      const s = document.querySelector('.screen');
      if (s) s.scrollTop = 0;
    }, 0);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {screen === 'home' && (
        <HomeScreen navigate={navigate} getLessonProgress={getLessonProgress} />
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
