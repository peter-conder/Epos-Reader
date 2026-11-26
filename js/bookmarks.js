import { ROMANS, WORKS } from './data.js';
import { el, esc, icon } from './dom.js';
import { getTab, isText, shared, state } from './state.js';
import { saveBookmarks } from './storage.js';
import { lineCenter, textTop } from './chunks.js';
import { jumpToLine, newId, noteSource, updateNotebookHeader } from './notes.js';
import { stripY } from './scrollbar.js';
import { syncRibbon } from './mobile-bookmarks.js';

/* ==========================================================
   BOOKMARKS
   A bookmark is tied to one line of a book. It is added from the word card or from the marker in the
   line's left margin (click the marker again to remove it). It shows as that marker and, on desktop, as a dot
   beside the original pane's scrollbar (click it to jump), and is listed on the Notebook page below the notes.
   Saved in localStorage when available.
   ========================================================== */

/* The start of the line, kept with the bookmark so the Notebook can show it without opening the book */
export function lineSnippet(tab, line) {
  const l = tab.bookData?.byLine.get(line);
  const sample = tab.book === 'I' ? WORKS[tab.work]?.lines?.[line - 1] : null;   // the sample Lines are Book I's
  const words = l ? l.w.map((w) => w.f) : (sample ?? '').trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 7).join(' ') + (words.length > 7 ? '…' : '');
}

export const isMarked = (b, tab) => b.work === tab.work && b.book === tab.book;

export function toggleBookmark(tab, line) {
  const i = state.bookmarks.findIndex((b) => isMarked(b, tab) && b.line === line);
  if (i >= 0) state.bookmarks.splice(i, 1);
  else state.bookmarks.push({ id: newId(), work: tab.work, book: tab.book, line, text: lineSnippet(tab, line), created: Date.now() });
  bookmarksChanged();
}

/* Everything that has to refresh after any change to the bookmarks */
export function bookmarksChanged() {
  saveBookmarks(state.bookmarks);
  refreshBookmarkMarks();
  syncCardBookmark();
  syncRibbon();
  if (!el.viewNotebook.hidden && !el.panes.hidden) { updateNotebookHeader(); renderBookmarks(); }
  else shared.notebookDirty = true;
}

/* ---- Marks in the text and dots beside the scrollbar ---- */
export function refreshBookmarkMarks(tabs = state.tabs) {
  for (const tab of tabs) {
    if (!isText(tab)) continue;
    tab.ui.passage.querySelectorAll('.verse.bookmarked').forEach((v) => {
      v.classList.remove('bookmarked');
      v.firstElementChild.dataset.tip = 'Bookmark this line';
    });
    markBookmarks(tab, tab.ui.passage);
    renderRail(tab);
  }
}

/* Marks the bookmarked lines inside `scope` (the passage, or one chunk as it is added).
   A line's margin glyph is its first child. */
export function markBookmarks(tab, scope) {
  for (const b of state.bookmarks) {
    if (!isMarked(b, tab)) continue;
    const verse = scope.querySelector(`.verse[data-line="${b.line}"]`);
    if (!verse) continue;
    verse.classList.add('bookmarked');
    verse.firstElementChild.dataset.tip = 'Remove bookmark';
  }
}

/* Puts a dot on the strip beside the original pane's scrollbar (ui.rail, see scrollbar.js) for each bookmark,
   at the line's centre in scroll space. The spacers keep scrollHeight at the whole book's height, so this holds
   whichever chunks are in the page. */
export function renderRail(tab) {
  const ui = tab.ui;
  const ch = ui?.chunkers?.[0];
  const pane = ui?.paneOriginal;
  if (!ui?.rail) return;
  const marks = ch?.pitch && !ui.root.hidden && pane.scrollHeight > pane.clientHeight
    ? state.bookmarks.filter((b) => isMarked(b, tab) && ch.lineNums.includes(b.line)) : [];
  const top = marks.length ? textTop(ch) : 0;
  const html = marks.map((b) => {
    const y = stripY(pane, top + lineCenter(ch, ch.lineNums.indexOf(b.line)));
    return `<button class="bm-dot" data-line="${b.line}" data-tip="Line ${b.line}" data-tip-side="left"
      aria-label="Go to line ${b.line}" style="top:${y.toFixed(1)}px"></button>`;
  }).join('');
  if (ui.railHtml !== html) { ui.rail.innerHTML = html; ui.railHtml = html; }
}

export function flashLine(verse) {
  if (!verse) return;
  verse.classList.remove('flash');
  void verse.offsetWidth;   // replay the animation if it is still running
  verse.classList.add('flash');
  setTimeout(() => verse.classList.remove('flash'), 1300);
}

/* ---- Word card button ---- */
export function syncCardBookmark() {
  const tab = shared.selectedWord && getTab(shared.selectedWord.closest('.tab-view')?.dataset.tabId);
  const on = !!(shared.wordCtx && tab && state.bookmarks.some((b) => isMarked(b, tab) && b.line === shared.wordCtx.line));
  el.cardBookmark.classList.toggle('has-bookmark', on);
  el.cardBookmark.setAttribute('aria-pressed', String(on));
  el.cardBookmark.dataset.tip = on ? 'Remove bookmark' : 'Bookmark this line';
}

/* ---- Notebook list ---- */
const bookmarkOrder = Object.keys(WORKS);

export function bookmarkCardHtml(b) {
  return `
    <article class="bm-card" data-bm-id="${b.id}" tabindex="0" role="button" aria-label="Go to ${esc(noteSource(b))}">
      <div class="bm-src">${icon('bookmark')}<span>${esc(noteSource(b))}</span></div>
      ${b.text ? `<div class="bm-text">${esc(b.text)}</div>` : ''}
      <button class="note-del" data-tip="Remove bookmark" aria-label="Remove bookmark">${icon('trash')}</button>
    </article>`;
}

export function renderBookmarks() {
  const list = [...state.bookmarks].sort((a, b) =>
    bookmarkOrder.indexOf(a.work) - bookmarkOrder.indexOf(b.work)
    || ROMANS.indexOf(a.book) - ROMANS.indexOf(b.book)
    || a.line - b.line);
  el.bmEmpty.hidden = list.length > 0;
  el.bmList.hidden = list.length === 0;
  el.bmList.innerHTML = list.map(bookmarkCardHtml).join('');
}

export function initBookmarks() {
  el.cardBookmark.addEventListener('click', () => {
    const tab = shared.selectedWord && getTab(shared.selectedWord.closest('.tab-view')?.dataset.tabId);
    if (shared.wordCtx && tab) toggleBookmark(tab, shared.wordCtx.line);
  });

  el.bmList.addEventListener('click', (e) => {
    const card = e.target.closest('.bm-card');
    const b = card && state.bookmarks.find((x) => x.id === card.dataset.bmId);
    if (!b) return;
    if (e.target.closest('.note-del')) {
      state.bookmarks.splice(state.bookmarks.indexOf(b), 1);
      bookmarksChanged();
    } else {
      jumpToLine(b.work, b.book, b.line);
    }
  });

  el.bmList.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target !== e.target.closest('.bm-card')) return;
    const b = state.bookmarks.find((x) => x.id === e.target.dataset.bmId);
    if (b) jumpToLine(b.work, b.book, b.line);
  });
}
