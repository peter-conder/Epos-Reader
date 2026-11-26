import { ROMANS, WORKS } from './data.js';
import { isText, state } from './state.js';

/* ==========================================================
   WORD DATA: one JSON file per book, plus one Lexicon per language (WORKS[work].lexicon)
   ========================================================== */
const DATA_ROOT = 'data2';   // folder the book and Lexicon files are read from
const MAX_CACHED_BOOKS = 8;  // LRU cap for Books not currently open in any tab
const bookCache = new Map();
const lexiconPromises = new Map();
const LEX = {};              // language -> { 'lemma:pos': { head, pos, def } }

function pruneBookCache() {
  if (bookCache.size <= MAX_CACHED_BOOKS) return;
  const openKeys = new Set(state.tabs.filter(isText).map((t) => `${t.work}:${t.book}`));
  for (const k of bookCache.keys()) {
    if (bookCache.size <= MAX_CACHED_BOOKS) break;
    if (!openKeys.has(k)) bookCache.delete(k);
  }
}

export function loadLexicon(lang) {
  if (!lexiconPromises.has(lang)) {
    const p = fetch(`${DATA_ROOT}/lexicon/${lang}.json`)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((lex) => { LEX[lang] = lex; })
      // Forget the failure so the next call fetches again, and fail the Book with it: a Book cached without its
      // Lexicon would show "No definition yet." for every word until a reload
      .catch((err) => { lexiconPromises.delete(lang); throw err; });
    lexiconPromises.set(lang, p);
  }
  return lexiconPromises.get(lang);
}

/* The book's data, or null when the fetch fails or there is no file for it */
export function loadBook(work, book) {
  const key = `${work}:${book}`;
  if (bookCache.has(key)) {
    // Refresh LRU recency
    const existing = bookCache.get(key);
    bookCache.delete(key);
    bookCache.set(key, existing);
    return existing;
  }
  const num = String(ROMANS.indexOf(book) + 1).padStart(2, '0');
  const p = Promise.all([
    fetch(`${DATA_ROOT}/${work}/${num}.json`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }),
    loadLexicon(WORKS[work].lexicon)
  ]).then(([data]) => {
    data.byLine = new Map(data.lines.map((l) => [l.n, l]));
    pruneBookCache();
    return data;
  }).catch(() => {
    bookCache.delete(key);
    return null;
  });
  bookCache.set(key, p);
  return p;
}

/* The Book's Translation (data2/<work>/NN.en.json, built by tools/translation): { blocks: [{ from, text }] }, where
   a block covers its Lines up to the Line before the next block's `from`. Fetched only once the English is shown.
   Null when the fetch fails; the failure isn't cached, so asking again retries. */
const englishCache = new Map();
export function loadEnglish(work, book) {
  const key = `${work}:${book}`;
  if (englishCache.has(key)) {
    const existing = englishCache.get(key);
    englishCache.delete(key);   // LRU recency, as for Books
    englishCache.set(key, existing);
    return existing;
  }
  const num = String(ROMANS.indexOf(book) + 1).padStart(2, '0');
  const p = fetch(`${DATA_ROOT}/${work}/${num}.en.json`)
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .catch(() => { englishCache.delete(key); return null; });
  englishCache.set(key, p);
  if (englishCache.size > MAX_CACHED_BOOKS) englishCache.delete(englishCache.keys().next().value);
  return p;
}

/* Lemma, grammar and definition for one word */
export function wordInfo(tab, line, idx) {
  const parts = tab.bookData?.byLine.get(line)?.w[idx]?.a;
  if (!parts?.length) return null;
  const lex = LEX[WORKS[tab.work].lexicon] ?? {};
  const e = parts.map((p) => ({ ...(lex[p.l] ?? { head: p.l.split(':')[0] }), morph: p.m }));
  return {
    lemma: e.map((x) => x.head).join(' + '),
    morph: e.map((x) => x.morph).join(' + '),
    def: e.map((x) => x.def ?? (x.pos === 'proper noun' ? 'Proper name.' : 'No definition yet.')).join('  |  ')
  };
}
