/**
 * apkgParser.js
 *
 * Parses Anki .apkg files (zip archives containing a SQLite database) into
 * WuXi lesson objects. All heavy dependencies (jszip, sql.js) are dynamically
 * imported so they only load when there are actual decks to process.
 *
 * Workflow:
 *   ArrayBuffer → unzip (JSZip) → SQLite (sql.js) → field detection → words[]
 */

// ── Field role detection ────────────────────────────────────────────────────
//
// Anki model definitions store field names (e.g. "Hanzi", "Pinyin", "English").
// We match those names against keyword lists to assign roles. The first match
// wins; unmatched roles fall back to positional defaults (hanzi=0, meaning=1).

const ROLE_KEYWORDS = {
  hanzi: [
    'hanzi', 'chinese', 'simplified', 'traditional', 'character',
    'expression', 'word', 'vocab', 'vocabulary', 'target', 'front',
    '汉字', '漢字', '中文', 'mandarin', 'zh',
  ],
  pinyin: [
    'pinyin', 'reading', 'pronunciation', 'romanization', 'romanisation',
    'sound', 'tone', 'zhuyin', 'bopomofo', '拼音',
  ],
  meaning: [
    'meaning', 'english', 'definition', 'translation', 'gloss', 'back',
    'answer', '意思', '英文', 'deutsch', 'français', 'spanish', 'french',
    'italian', 'portuguese',
  ],
  // Un-numbered example fields (treated as examples[0])
  example0: [
    'example sentence', 'examplesentence', 'example usage',
    'example', 'usage', 'context', 'sample', '例句', '例子',
  ],
  example0Pinyin: [
    'sentence pinyin', 'sentencepinyin', 'example pinyin', 'examplepinyin',
    'sentence reading', 'sentence pronunciation',
  ],
  example0Meaning: [
    'sentence meaning', 'sentencemeaning', 'sentence translation',
    'sentence english', 'example meaning', 'example translation',
    'examplemeaning',
  ],
  // Numbered examples
  example1: ['example 1', 'sentence 1', '例句1', 'example sentence 1'],
  example1Pinyin: ['example pinyin 1', 'sentence pinyin 1'],
  example1Meaning: ['example meaning 1', 'sentence translation 1', 'sentence meaning 1'],
  example2: ['example 2', 'sentence 2', '例句2', 'example sentence 2'],
  example2Pinyin: ['example pinyin 2', 'sentence pinyin 2'],
  example2Meaning: ['example meaning 2', 'sentence translation 2', 'sentence meaning 2'],
};

/**
 * Given an array of Anki field descriptors [{name, ord}], return a map of
 * role → field index. Roles that can't be matched fall back to position-based
 * defaults so the parser always produces at least hanzi + meaning.
 */
function detectFieldMap(flds) {
  const map = {};

  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    for (const { name, ord } of flds) {
      const lower = name.toLowerCase().trim();
      if (keywords.some(k => lower === k || lower.includes(k))) {
        if (!(role in map)) map[role] = ord;
        break;
      }
    }
  }

  // Positional fallbacks for required roles
  if (!('hanzi'   in map)) map.hanzi   = 0;
  if (!('meaning' in map)) map.meaning = flds.length > 1 ? 1 : 0;

  return map;
}

// ── Field value cleaning ────────────────────────────────────────────────────

function clean(raw = '') {
  return raw
    .replace(/\[sound:[^\]]+\]/g, '')        // [sound:file.mp3]
    .replace(/<br\s*\/?>/gi, ' ')            // <br> → space
    .replace(/<[^>]+>/g, '')                 // strip remaining HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Singleton SQL.js instance (load once, reuse) ────────────────────────────

let _SQL = null;

async function getSqlJs() {
  if (_SQL) return _SQL;
  const { default: initSqlJs } = await import('sql.js');
  _SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
  return _SQL;
}

// ── Pretty-print a deck title from the filename ─────────────────────────────

function titleFromFilename(filename) {
  return filename
    .replace(/\.apkg$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

// ── Main export ─────────────────────────────────────────────────────────────

/**
 * Parse an .apkg ArrayBuffer into a WuXi lesson object, or null if the deck
 * contains no usable vocabulary notes.
 *
 * @param {ArrayBuffer} arrayBuffer  Raw bytes of the .apkg file
 * @param {string}      filename     Original filename (used for ID + fallback title)
 * @returns {Promise<object|null>}
 */
export async function parseApkg(arrayBuffer, filename) {
  // ── 1. Unzip ──────────────────────────────────────────────────────────────
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Anki 2.1+ uses .anki21; older decks use .anki2
  const dbEntry = zip.file('collection.anki21') ?? zip.file('collection.anki2');
  if (!dbEntry) throw new Error(`${filename}: no collection database found inside zip`);

  // ── 2. Open SQLite ────────────────────────────────────────────────────────
  const SQL    = await getSqlJs();
  const dbBuf  = await dbEntry.async('arraybuffer');
  const db     = new SQL.Database(new Uint8Array(dbBuf));

  try {
    // ── 3. Read col table (models + deck names) ───────────────────────────
    const colRows = db.exec('SELECT decks, models FROM col LIMIT 1');
    if (!colRows.length) throw new Error(`${filename}: col table is empty`);

    const [decksJson, modelsJson] = colRows[0].values[0];

    // Derive a human-readable title from the first non-default deck name
    let title = titleFromFilename(filename);
    try {
      const deckObjs = Object.values(JSON.parse(decksJson));
      const candidate = deckObjs
        .map(d => d.name)
        .filter(n => n !== 'Default' && !n.includes('::'))
        .sort((a, b) => a.length - b.length)[0];
      if (candidate) title = candidate;
    } catch { /* ignore – fall back to filename */ }

    // Build a field-role map for each note model
    const models    = JSON.parse(modelsJson);
    const fieldMaps = {};
    for (const [mid, model] of Object.entries(models)) {
      fieldMaps[mid] = detectFieldMap(model.flds ?? []);
    }

    // ── 4. Read notes ─────────────────────────────────────────────────────
    const notesRes = db.exec('SELECT mid, flds FROM notes');
    if (!notesRes.length || !notesRes[0].values.length) return null;

    // ── 5. Build word list ────────────────────────────────────────────────
    const words = [];
    const seen  = new Set();

    for (const [mid, flds] of notesRes[0].values) {
      const parts = String(flds).split('\x1f').map(clean);
      const fm    = fieldMaps[String(mid)] ?? { hanzi: 0, meaning: 1 };

      const hanzi   = parts[fm.hanzi]   ?? '';
      const meaning = parts[fm.meaning] ?? '';

      // Skip notes without both a character and a meaning
      if (!hanzi || !meaning || seen.has(hanzi)) continue;
      seen.add(hanzi);

      // Build examples array from detected example fields (slots 0, 1, 2)
      const examples = [];
      for (const n of [0, 1, 2]) {
        const h = parts[fm[`example${n}`]]        ?? '';
        const p = parts[fm[`example${n}Pinyin`]]  ?? '';
        const m = parts[fm[`example${n}Meaning`]] ?? '';
        if (h) examples.push({ hanzi: h, pinyin: p, meaning: m });
      }

      words.push({
        hanzi,
        pinyin: parts[fm.pinyin] ?? '',
        meaning,
        examples,
      });
    }

    if (words.length === 0) return null;

    return {
      id:          `apkg-${filename.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
      title,
      icon:        '📦',
      description: `${words.length} cards · imported from ${filename}`,
      words,
    };

  } finally {
    db.close();
  }
}
