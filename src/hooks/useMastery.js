import { useState, useCallback } from 'react';
import { wordKey } from '../utils/helpers';

export default function useMastery() {
  const [masteryData, setMasteryData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wuxi_mastery')) || {}; }
    catch { return {}; }
  });

  const updateMastery = useCallback((key, correct) => {
    setMasteryData(prev => {
      const cur = prev[key] || { level: 0, streak: 0, correct: 0, wrong: 0 };
      let { level, streak, correct: c, wrong: w } = cur;
      if (correct) {
        streak++;
        c++;
        if (streak >= 2 && level < 4) level++;
      } else {
        streak = 0;
        w++;
        if (level > 0) level--;
      }
      const next = { ...prev, [key]: { level, streak, correct: c, wrong: w } };
      localStorage.setItem('wuxi_mastery', JSON.stringify(next));
      return next;
    });
  }, []);

  const getWordMastery = useCallback((key) =>
    masteryData[key] || { level: 0, streak: 0, correct: 0, wrong: 0 },
  [masteryData]);

  const getLessonProgress = useCallback((lesson) => {
    const words = lesson.words;
    if (!words.length) return { pct: 0, counts: [0, 0, 0, 0, 0] };
    const counts = [0, 0, 0, 0, 0];
    words.forEach(w => {
      const m = getWordMastery(wordKey(lesson.id, w.hanzi));
      counts[m.level]++;
    });
    const pct = Math.round((counts[3] + counts[4]) / words.length * 100);
    return { pct, counts };
  }, [getWordMastery]);

  return { masteryData, updateMastery, getWordMastery, getLessonProgress };
}
