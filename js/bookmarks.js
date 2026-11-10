import { ROMANS, WORKS } from './data.js';
import { clamp, el, esc, icon } from './dom.js';
import { getTab, isText, shared, state } from './state.js';
import { saveBookmarks } from './storage.js';
import { textTop } from './chunks.js';
import { jumpToLine, newId, noteSource, updateNotebookHeader } from './notes.js';

/* ==========================================================
   BOOKMARKS
   A bookmark is tied to one line of a book and is added or removed from the word card. It shows as a
   marker at the right of the line and as a dot on the original pane's scrollbar (click it to jump),
   and is listed on the Notebook page below the notes. Saved in localStorage when available.
   ========================================================== */
const TRACK_PAD = 24;   // the scrollbar track's end margin, as set on .pane::-webkit-scrollbar-track (--radius-xl)
const THUMB_MIN = 32;   // the thumb's shortest length: its min-height in styles.css

/* The start of the line, kept with the bookmark so the Notebook can show it without opening the book */
export function lineSnippet(tab, line) {
  const l = tab.bookData?.byLine.get(line);
  const words = l ? l.w.map((w) => w.f) : (WORKS[tab.work]?.lines?.[line - 1] ?? '').trim().split(/\s+/).filter(Boolean);
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
  if (!el.viewNotebook.hidden && !el.panes.hidden) { updateNotebookHeader(); renderBookmarks(); }
  else shared.notebookDirty = true;
}

/* ---- Marks in the text and dots on the scrollbar ---- */
export function refreshBookmarkMarks(tabs = state.tabs) {
  for (const tab of tabs) {
    if (!isText(tab)) continue;
    tab.ui.passage.querySelectorAll('.verse.bookmarked').forEach((v) => v.classList.remove('bookmarked'));
    markBookmarks(tab, tab.ui.passage);
    renderRail(tab);
  }
}

/* Marks the bookmarked lines inside `scope` (the passage, or one chunk as it is added) */
export function markBookmarks(tab, scope) {
  for (const b of state.bookmarks) {
    if (isMarked(b, tab)) scope.querySelector(`.verse[data-line="${b.line}"]`)?.classList.add('bookmarked');
  }
}

/* Puts the rail over the original pane's scrollbar and a dot on it for each bookmark. The dot sits where the
   scrollbar thumb's centre is when that line is centred in the pane (which is where a jump puts it), using
   the browser's own thumb maths: thumb top = scrollTop / (scrollHeight - clientHeight) * (track - thumb).
   The spacers keep scrollHeight at the whole book's height, so this holds whichever chunks are in the page. */
export function renderRail(tab) {
  const ui = tab.ui;
  const ch = ui?.chunkers?.[0];
  const pane = ui?.paneOriginal;
  if (!ui?.rail) return;
  const marks = ch?.pitch && !ui.root.hidden && pane.scrollHeight > pane.clientHeight
    ? state.bookmarks.filter((b) => isMarked(b, tab) && ch.lineNums.includes(b.line)) : [];
  ui.rail.style.display = marks.length ? 'block' : '';
  if (!marks.length) {
    ui.rail.innerHTML = ui.railHtml = '';
    ui.railMarks = [];
    pane?.classList.remove('bm-near');
    return;
  }

  ui.rail.style.left = `${pane.offsetLeft + pane.clientLeft + pane.clientWidth}px`;
  ui.rail.style.top = `${pane.offsetTop + pane.clientTop}px`;
  ui.rail.style.height = `${pane.clientHeight}px`;

  const C = pane.clientHeight, H = pane.scrollHeight, T = C - 2 * TRACK_PAD;
  const L = Math.min(T, Math.max((T * C) / H, THUMB_MIN));   // thumb length
  const top = textTop(ch);
  ui.railMarks = marks.map((b) => {
    const p = top + (ch.lineNums.indexOf(b.line) + 0.5) * ch.pitch;   // the line's centre in scroll space
    const s = clamp(p - C / 2, 0, H - C);                              // scrollTop with that line centred
    return { line: b.line, p, y: TRACK_PAD + (s / (H - C)) * (T - L) + L / 2 };
  });
  const html = ui.railMarks.map((m) =>
    `<button class="bm-dot" data-line="${m.line}" data-tip="Line ${m.line}" data-tip-side="left"
      aria-label="Go to line ${m.line}" style="top:${m.y.toFixed(1)}px"></button>`).join('');
  if (ui.railHtml !== html) { ui.rail.innerHTML = html; ui.railHtml = html; }
  updateRailNear(tab);
}

/* Scrolled to within a quarter-screen of a bookmark: its dot grows into a circle and the thumb's pill hides,
   so the scrollbar looks like it has turned into the bookmark. */
export function updateRailNear(tab) {
  const ui = tab.ui;
  const pane = ui?.paneOriginal;
  const marks = ui?.railMarks;
  if (!marks?.length) return;
  const centre = pane.scrollTop + pane.clientHeight / 2;
  const reach = pane.clientHeight * 0.75;
  let any = false;
  marks.forEach((m, i) => {
    const near = Math.abs(m.p - centre) <= reach;
    ui.rail.children[i]?.classList.toggle('near', near);
    any ||= near;
  });
  pane.classList.toggle('bm-near', any);
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
