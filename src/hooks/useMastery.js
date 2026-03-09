import { useState, useCallback, useEffect } from 'react';
import { wordKey } from '../utils/helpers';

export default function useMastery(profileId) {
  const storageKey = profileId ? `wuxi_mastery_${profileId}` : 'wuxi_mastery';

  const [masteryData, setMasteryData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
    catch { return {}; }
  });

  // Reload data when profile switches
  useEffect(() => {
    try { setMasteryData(JSON.parse(localStorage.getItem(storageKey)) || {}); }
    catch { setMasteryData({}); }
  }, [storageKey]);

  const updateMastery = useCallback((key, correct) => {
    setMasteryData(prev => {
      const cur = prev[key] || { level: 0, streak: 0, correct: 0, wrong: 0 };
      let { level, streak, correct: c, wrong: w } = cur;
      if (correct) {
        streak++; c++;
        if (level < 4) level++;
      } else {
        streak = 0; w++;
        if (level > 0) level--;
      }
      const next = { ...prev, [key]: { level, streak, correct: c, wrong: w } };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const resetMastery = useCallback((data) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
    setMasteryData(data);
  }, [storageKey]);

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
    const weighted = counts[1]*1 + counts[2]*2 + counts[3]*3 + counts[4]*4;
    const pct = Math.round(weighted / (words.length * 4) * 100);
    return { pct, counts };
  }, [getWordMastery]);

  return { masteryData, updateMastery, resetMastery, getWordMastery, getLessonProgress };
}
