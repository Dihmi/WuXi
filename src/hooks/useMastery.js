import { useState, useCallback, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { wordKey } from '../utils/helpers';
import { db } from '../firebase';

export default function useMastery(uid) {
  const storageKey = uid ? `wuxi_mastery_${uid}` : null;

  const [masteryData, setMasteryData] = useState({});
  const [syncError,   setSyncError]   = useState(null);

  // Track whether the current masteryData came from a local edit (needs sync)
  // vs. a load from Firestore (no sync needed)
  const pendingSync = useRef(false);

  // ── Load from Firestore on login ───────────────────────────────
  useEffect(() => {
    if (!uid) { setMasteryData({}); return; }

    // Instant: hydrate from localStorage while we wait for Firestore
    let local = {};
    try { local = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch {}
    setMasteryData(local);
    pendingSync.current = false;

    getDoc(doc(db, 'users', uid))
      .then(snap => {
        if (snap.exists()) {
          const cloud = snap.data().mastery || {};
          pendingSync.current = false;
          setMasteryData(cloud);
          localStorage.setItem(storageKey, JSON.stringify(cloud));
        } else if (Object.keys(local).length > 0) {
          // First cloud login — push local data up
          pendingSync.current = true;
        }
        setSyncError(null);
      })
      .catch(err => {
        console.error('Firestore load error:', err);
        setSyncError(err.code || err.message);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // ── Sync to Firestore whenever masteryData changes locally ─────
  useEffect(() => {
    if (!uid || !pendingSync.current) return;
    pendingSync.current = false;

    setDoc(doc(db, 'users', uid), { mastery: masteryData }, { merge: true })
      .then(() => setSyncError(null))
      .catch(err => {
        console.error('Firestore save error:', err);
        setSyncError(err.code || err.message);
      });
  }, [uid, masteryData]);

  // ── Update a single word's mastery ────────────────────────────
  const updateMastery = useCallback((key, correct) => {
    setMasteryData(prev => {
      const cur = prev[key] || { level: 0, streak: 0, correct: 0, wrong: 0 };
      let { level, streak, correct: c, wrong: w } = cur;
      if (correct) { streak++; c++; if (level < 4) level++; }
      else         { streak = 0; w++; if (level > 0) level--; }
      const next = { ...prev, [key]: { level, streak, correct: c, wrong: w, lastReviewed: Date.now() } };
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
      pendingSync.current = true;
      return next;
    });
  }, [storageKey]);

  // ── Directly set a word's mastery level (manual override) ─────
  const setWordLevel = useCallback((key, level) => {
    setMasteryData(prev => {
      const next = { ...prev, [key]: { level, streak: 0, correct: 0, wrong: 0, lastReviewed: Date.now() } };
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
      pendingSync.current = true;
      return next;
    });
  }, [storageKey]);

  // ── Bulk replace (import) ─────────────────────────────────────
  const resetMastery = useCallback((data) => {
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(data));
    pendingSync.current = true;
    setMasteryData(data);
  }, [storageKey]);

  const getWordMastery = useCallback((key) =>
    masteryData[key] || { level: 0, streak: 0, correct: 0, wrong: 0 },
  [masteryData]);

  const getLessonProgress = useCallback((lesson) => {
    const words = lesson.words;
    if (!words.length) return { pct: 0, counts: [0, 0, 0, 0, 0], totalReviews: 0, lastReviewed: null };
    const counts = [0, 0, 0, 0, 0];
    let totalReviews = 0;
    let lastReviewed = null;
    words.forEach(w => {
      const m = getWordMastery(wordKey(lesson.id, w.hanzi));
      counts[m.level]++;
      totalReviews += (m.correct || 0) + (m.wrong || 0);
      if (m.lastReviewed && (!lastReviewed || m.lastReviewed > lastReviewed)) lastReviewed = m.lastReviewed;
    });
    const weighted = counts[1]*1 + counts[2]*2 + counts[3]*3 + counts[4]*4;
    const pct = Math.round(weighted / (words.length * 4) * 100);
    return { pct, counts, totalReviews, lastReviewed };
  }, [getWordMastery]);

  return { masteryData, updateMastery, setWordLevel, resetMastery, getWordMastery, getLessonProgress, syncError };
}
