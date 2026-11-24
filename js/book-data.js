import { ROMANS, WORKS } from './data.js';

/* ==========================================================
   WORD DATA: one JSON file per book, plus one Lexicon per language (WORKS[work].lexicon)
   ========================================================== */
const DATA_ROOT = 'data2';   // folder the book and Lexicon files are read from
const bookCache = new Map();
const lexiconPromises = new Map();
const LEX = {};              // language -> { 'lemma:pos': { head, pos, def } }

export function loadLexicon(lang) {
  if (!lexiconPromises.has(lang)) {
    lexiconPromises.set(lang, fetch(`${DATA_ROOT}/lexicon/${lang}.json`)
      .then((r) => r.json()).then((lex) => { LEX[lang] = lex; }).catch(() => {}));
  }
  return lexiconPromises.get(lang);
}

/* The book's data, or null when there's no file for it */
export function loadBook(work, book) {
  const key = `${work}:${book}`;
  if (!bookCache.has(key)) {
    const num = String(ROMANS.indexOf(book) + 1).padStart(2, '0');
    bookCache.set(key, Promise.all([
      fetch(`${DATA_ROOT}/${work}/${num}.json`).then((r) => (r.ok ? r.json() : null)),
      loadLexicon(WORKS[work].lexicon)
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
  const lex = LEX[WORKS[tab.work].lexicon] ?? {};
  const e = parts.map((p) => ({ ...(lex[p.l] ?? { head: p.l.split(':')[0] }), morph: p.m }));
  return {
    lemma: e.map((x) => x.head).join(' + '),
    morph: e.map((x) => x.morph).join(' + '),
    def: e.map((x) => x.def ?? (x.pos === 'proper noun' ? 'Proper name.' : 'No definition yet.')).join('  |  ')
  };
}
