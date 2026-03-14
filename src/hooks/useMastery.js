import { useState, useCallback, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { wordKey } from '../utils/helpers';
import { db } from '../firebase';

export default function useMastery(uid) {
  const storageKey = uid ? `wuxi_mastery_${uid}` : null;

  const [masteryData, setMasteryData] = useState({});

  // Load mastery when uid changes: local first, then Firestore as source of truth
  useEffect(() => {
    if (!uid) { setMasteryData({}); return; }

    // Instant: hydrate from localStorage
    let local = {};
    try { local = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch {}
    setMasteryData(local);

    // Authoritative: fetch from Firestore
    getDoc(doc(db, 'users', uid)).then(snap => {
      if (snap.exists()) {
        const cloud = snap.data().mastery || {};
        setMasteryData(cloud);
        localStorage.setItem(storageKey, JSON.stringify(cloud));
      } else if (Object.keys(local).length > 0) {
        // First cloud login — migrate existing local data up
        setDoc(doc(db, 'users', uid), { mastery: local }, { merge: true });
      }
    }).catch(console.error);
  }, [uid, storageKey]);

  const syncToFirestore = useCallback((data) => {
    if (!uid) return;
    setDoc(doc(db, 'users', uid), { mastery: data }, { merge: true }).catch(console.error);
  }, [uid]);

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
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
      syncToFirestore(next);
      return next;
    });
  }, [storageKey, syncToFirestore]);

  const resetMastery = useCallback((data) => {
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(data));
    syncToFirestore(data);
    setMasteryData(data);
  }, [storageKey, syncToFirestore]);

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
