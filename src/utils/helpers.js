export const wordKey = (lessonId, hanzi) => `${lessonId}::${hanzi}`;

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom(arr, n) {
  return shuffle(arr).slice(0, n);
}
