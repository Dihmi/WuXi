/**
 * jsonParser.js
 *
 * Parses WuXi JSON deck files ({ name, cards[] }) into lesson objects.
 * This is the native WuXi deck format, simpler than .apkg.
 *
 * Each card: { hanzi, pinyin, meaning, examples: [{hanzi, pinyin, meaning}] }
 */
export function parseJsonDeck(json, filename) {
  const words = (json.cards ?? [])
    .map(card => ({
      hanzi:    (card.hanzi   ?? '').trim(),
      pinyin:   (card.pinyin  ?? '').trim(),
      meaning:  (card.meaning ?? '').trim(),
      examples: Array.isArray(card.examples) ? card.examples : [],
    }))
    .filter(w => w.hanzi && w.meaning);

  if (words.length === 0) return null;

  const slug = filename.replace(/\.json$/i, '').replace(/[^a-z0-9]/gi, '-').toLowerCase();

  return {
    id:          `json-${slug}`,
    title:       json.name || filename.replace(/\.json$/i, ''),
    icon:        json.icon  || '📋',
    group:       json.group || 'Default',
    description: `${words.length} words`,
    words,
    imported:    true,
  };
}
