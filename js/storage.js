import { WORKS } from './data.js';

/* Notes and bookmarks, saved in localStorage when it is available */
const NOTES_KEY = 'epos.notes.v1';
const BOOKMARKS_KEY = 'epos.bookmarks.v1';

export function loadNotes() {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
    const list = Array.isArray(raw) ? raw.filter((n) => n && n.id && typeof n.text === 'string') : [];
    // The array order is the order on the Notebook page (new notes go first). Notes saved
    // before that were shown newest-first, so put them in that order once and keep it.
    if (!localStorage.getItem('epos.notes.ordered')) {
      list.sort((a, b) => (b.created || 0) - (a.created || 0));
      localStorage.setItem(NOTES_KEY, JSON.stringify(list));
      localStorage.setItem('epos.notes.ordered', '1');
    }
    return list;
  } catch { return []; }
}

export function saveNotes(notes) {
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes.filter((n) => !n.draft))); }
  catch { /* storage unavailable: notes stay in memory for this session */ }
}

export function loadBookmarks() {
  try {
    const raw = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
    return Array.isArray(raw)
      ? raw.filter((b) => b && b.id && WORKS[b.work] && typeof b.book === 'string' && Number.isInteger(b.line))
      : [];
  } catch { return []; }
}

export function saveBookmarks(bookmarks) {
  try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks)); }
  catch { /* storage unavailable: bookmarks stay in memory for this session */ }
}
