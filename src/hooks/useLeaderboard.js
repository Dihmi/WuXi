import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

function computeStats(mastery) {
  const entries = Object.values(mastery || {});
  if (!entries.length) {
    return { totalWords: 0, wordsLearned: 0, wordsMastered: 0, totalReviews: 0, overallPct: 0, daysLearning: 0 };
  }
  const totalWords   = entries.length;
  const wordsLearned = entries.filter(e => e.level >= 1).length;
  const wordsMastered = entries.filter(e => e.level >= 4).length;
  const totalReviews = entries.reduce((s, e) => s + (e.correct || 0) + (e.wrong || 0), 0);
  const overallPct   = Math.round(entries.reduce((s, e) => s + (e.level || 0), 0) / (totalWords * 4) * 100);
  const timestamps   = entries.map(e => e.lastReviewed).filter(Boolean);
  const daysLearning = timestamps.length
    ? Math.floor((Date.now() - Math.min(...timestamps)) / 86400000) + 1
    : 0;
  return { totalWords, wordsLearned, wordsMastered, totalReviews, overallPct, daysLearning };
}

export default function useLeaderboard(uid, currentProfile) {
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // Keep current user's public profile info in Firestore so others can read it
  useEffect(() => {
    if (!uid || !currentProfile) return;
    setDoc(doc(db, 'users', uid), {
      displayName: currentProfile.name,
      photoURL:    currentProfile.photoURL || null,
    }, { merge: true }).catch(() => {});
  }, [uid, currentProfile]);

  const fetch = useCallback(() => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    getDocs(collection(db, 'users'))
      .then(snap => {
        const all = snap.docs.map(d => {
          const data = d.data();
          return {
            uid:      d.id,
            name:     data.displayName || 'Learner',
            photoURL: data.photoURL    || null,
            ...computeStats(data.mastery),
          };
        });

        // Sort: overallPct desc, then totalReviews desc as tiebreaker
        all.sort((a, b) =>
          b.overallPct !== a.overallPct
            ? b.overallPct - a.overallPct
            : b.totalReviews - a.totalReviews
        );

        // Assign ranks (ties share the same rank)
        let rank = 1;
        all.forEach((e, i) => {
          if (
            i > 0 &&
            e.overallPct   === all[i - 1].overallPct &&
            e.totalReviews === all[i - 1].totalReviews
          ) {
            e.rank = all[i - 1].rank;
          } else {
            e.rank = rank;
          }
          rank++;
        });

        setEntries(all);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load leaderboard');
        setLoading(false);
      });
  }, [uid]);

  useEffect(() => { fetch(); }, [fetch]);

  const top10           = entries.slice(0, 10);
  const currentEntry    = entries.find(e => e.uid === uid) ?? null;
  const isInTop10       = currentEntry ? currentEntry.rank <= 10 : false;

  return { top10, currentEntry, isInTop10, loading, error, refresh: fetch };
}
