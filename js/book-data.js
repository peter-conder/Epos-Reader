import { ROMANS } from './data.js';

/* ==========================================================
   WORD DATA: one JSON file per book, plus a shared dictionary
   ========================================================== */
const DATA_ROOT = 'data2';   // folder the book and dictionary files are read from
const bookCache = new Map();
let lexiconPromise = null;
let LEX = {};

export function loadLexicon() {
  lexiconPromise ??= fetch(`${DATA_ROOT}/lexicon/latin.json`)
    .then((r) => r.json()).then((lex) => { LEX = lex; }).catch(() => {});
  return lexiconPromise;
}

/* The book's data, or null when there's no file for it yet (the Greek works, for now) */
export function loadBook(work, book) {
  const key = `${work}:${book}`;
  if (!bookCache.has(key)) {
    const num = String(ROMANS.indexOf(book) + 1).padStart(2, '0');
    bookCache.set(key, Promise.all([
      fetch(`${DATA_ROOT}/${work}/${num}.json`).then((r) => (r.ok ? r.json() : null)),
      loadLexicon()
    ]).then(([data]) => {
      if (data) data.byLine = new Map(data.lines.map((l) => [l.n, l]));
      return data;
    }).catch(() => null));
  }
  return bookCache.get(key);
}

/* Lemma, grammar and definition for one word */
export function wordInfo(tab, line, idx) {
  const parts = tab.bookData?.byLine.get(line)?.w[idx]?.a;
  if (!parts?.length) return null;
  const e = parts.map((p) => ({ ...(LEX[p.l] ?? { head: p.l.split(':')[0] }), morph: p.m }));
  return {
    lemma: e.map((x) => x.head).join(' + '),
    morph: e.map((x) => x.morph).join(' + '),
    def: e.map((x) => x.def ?? (x.pos === 'proper noun' ? 'Proper name.' : 'No definition yet.')).join('  |  ')
  };
}
