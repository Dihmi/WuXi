import { useState, useEffect } from 'react';
import { parseApkg } from '../utils/apkgParser';
import { parseJsonDeck } from '../utils/jsonParser';

/**
 * Loads decks listed in /decks/manifest.json at startup.
 * Supports .apkg (Anki) and .json (native WuXi) formats.
 *
 * Returns:
 *   importedLessons  — array of parsed lesson objects (same shape as LESSONS)
 *   deckStatus       — 'loading' | 'done'
 *   deckErrors       — array of error strings for any deck that failed to parse
 */
export default function useDecks() {
  const [importedLessons, setImportedLessons] = useState([]);
  const [deckStatus,      setDeckStatus]      = useState('loading');
  const [deckErrors,      setDeckErrors]      = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // 1. Fetch manifest
        const res = await fetch('/decks/manifest.json');
        if (!res.ok) { setDeckStatus('done'); return; }

        const filenames = await res.json();
        if (!Array.isArray(filenames) || filenames.length === 0) {
          setDeckStatus('done');
          return;
        }

        // 2. Fetch + parse every deck in parallel (.apkg or .json)
        const results = await Promise.allSettled(
          filenames.map(async name => {
            let r;
            try {
              r = await fetch(`/decks/${encodeURIComponent(name)}`);
            } catch (err) {
              throw new Error(`${name}: network error — ${err.message}`);
            }
            if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);

            // Guard against SPA fallback returning HTML instead of the file
            const ct = r.headers.get('content-type') ?? '';
            if (ct.includes('text/html')) {
              throw new Error(`${name}: file not found on server (got HTML)`);
            }

            try {
              if (/\.json$/i.test(name)) {
                const json = await r.json();
                return parseJsonDeck(json, name);
              }
              const buf = await r.arrayBuffer();
              return parseApkg(buf, name);
            } catch (err) {
              throw new Error(`${name}: ${err.message}`);
            }
          })
        );

        if (cancelled) return;

        const lessons = [];
        const errors  = [];

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            lessons.push(result.value);
          } else if (result.status === 'rejected') {
            errors.push(result.reason?.message ?? 'Unknown error');
          }
        }

        setImportedLessons(lessons);
        setDeckErrors(errors);
      } catch {
        // manifest missing or unreachable → no imported decks, not an error
      } finally {
        if (!cancelled) setDeckStatus('done');
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { importedLessons, deckStatus, deckErrors };
}
