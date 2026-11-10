import { ROMANS, WORKS } from './data.js';
import { clamp, el, esc, icon } from './dom.js';
import { getTab, isText, shared, state } from './state.js';
import { saveBookmarks } from './storage.js';
import { textTop } from './chunks.js';
import { jumpToLine, newId, noteSource, updateNotebookHeader } from './notes.js';
import { LOADER_N, LOADER_RADII, MORPH_EASE, loaderPath } from './loader.js';
import { TRACK_PAD, thumbMetrics } from './scrollbar.js';

/* ==========================================================
   BOOKMARKS
   A bookmark is tied to one line of a book. It is added from the word card or from the marker in the
   line's left margin (click the marker again to remove it). It shows as that marker and as a dot on the
   original pane's scrollbar (click it to jump), and is listed on the Notebook page below the notes.
   Saved in localStorage when available.
   ========================================================== */

/* ---- The dot's shape ----
   Each dot is an SVG path in a 34-unit box, drawn as a closed curve of LOADER_N radii (the same representation
   the loading indicator uses, so shapes can be blended point by point). A dot rests as a small circle. When the
   pane is scrolled near its bookmark the scrollbar thumb's pill hides and the dot morphs
   pill -> a shape picked at random (the loader's star, a rounded triangle, a pentagon or a square) -> a larger
   circle (which holds the bookmark glyph). */
const DOT_R = 6, NEAR_R = 13;
const PILL = { w: 4, h: 11 };               // half-width and half-height of the thumb's visible pill
const SHAPE_MEAN = 13.5;                     // every in-between shape has this average radius, like the loader's shapes
const circleRadii = (r) => new Array(LOADER_N).fill(r);
const stillMotion = matchMedia('(prefers-reduced-motion: reduce)');

/* A stadium (rounded-end pill), as the distance from its centre at each of the LOADER_N angles */
function pillRadii({ w: a, h: b }) {
  const c = b - a;   // the end caps are circles of radius a centred c above and below the middle
  return Array.from({ length: LOADER_N }, (_, i) => {
    const t = (i / LOADER_N) * Math.PI * 2;
    const cos = Math.abs(Math.cos(t)), sin = Math.abs(Math.sin(t));
    if (cos > 1e-6 && (a / cos) * sin <= c) return a / cos;   // hits the straight side
    const dc = sin * c;                                        // otherwise it hits an end cap
    return dc + Math.sqrt(dc * dc - c * c + a * a);
  });
}
const PILL_RADII = pillRadii(PILL);
const DOT_PATH = loaderPath(circleRadii(DOT_R), 1);

/* A regular n-gon with one corner pointing up and its corners rounded by `rho` (the polygon the corners are
   rounded from has circumradius 1), as the distance from its centre at each of the LOADER_N angles. The outline is
   that polygon grown by rho: straight edges at distance cos(π/n) + rho, with an arc of radius rho at each corner. */
function polygonRadii(n, rho) {
  const step = (Math.PI * 2) / n, half = step / 2;
  const apothem = Math.cos(half) + rho, edgeHalf = Math.sin(half);
  return Array.from({ length: LOADER_N }, (_, i) => {
    const t = (i / LOADER_N) * Math.PI * 2;
    const u = t + Math.PI / 2 - half;               // angle from the first edge's normal (the first corner is at -90°)
    const delta = u - Math.round(u / step) * step;  // angle from the nearest edge's normal, within ±half
    if (apothem * Math.abs(Math.tan(delta)) <= edgeHalf) return apothem / Math.cos(delta);   // hits the straight edge
    const dv = Math.cos(delta - Math.sign(delta) * half);   // otherwise it hits the arc round the nearer corner
    return dv + Math.sqrt(dv * dv - 1 + rho * rho);
  });
}

/* Scales a radius curve so its average radius is `mean` */
function normalise(radii, mean = SHAPE_MEAN) {
  const k = mean / (radii.reduce((s, r) => s + r, 0) / radii.length);
  return radii.map((r) => r * k);
}

/* The shapes a dot can pass through on its way from pill to circle; one is picked at random each time */
const SHAPES = [
  normalise(LOADER_RADII[2]),     // the loader's 8-point star
  normalise(polygonRadii(3, 0.45)),   // triangle with rounded corners
  normalise(polygonRadii(5, 0.22)),   // pentagon
  normalise(polygonRadii(4, 0.32))    // square
];

const mixRadii = (a, b, e) => a.map((r, i) => r + (b[i] - r) * e);

/* Sets a dot to its resting or near state. With `animate` it plays the morph; otherwise it jumps there. */
function setDotNear(dot, near, animate) {
  const path = dot.querySelector('path');
  const target = circleRadii(near ? NEAR_R : DOT_R);
  dot.classList.toggle('near', near);
  cancelAnimationFrame(dot._raf);
  if (!animate || stillMotion.matches) {
    dot._radii = target;
    path.setAttribute('d', loaderPath(target, 1));
    return;
  }
  // Near: pill -> shape (first 40%) -> circle. Away: back to the small circle.
  const from = near ? PILL_RADII : (dot._radii ?? circleRadii(NEAR_R));
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const duration = near ? 620 : 260;
  const t0 = performance.now();
  const frame = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    let radii;
    if (!near) radii = mixRadii(from, target, MORPH_EASE(p));
    else if (p < 0.4) radii = mixRadii(from, shape, MORPH_EASE(p / 0.4));
    else radii = mixRadii(shape, target, MORPH_EASE((p - 0.4) / 0.6));
    dot._radii = radii;
    path.setAttribute('d', loaderPath(radii, 1));
    if (p < 1) dot._raf = requestAnimationFrame(frame);
  };
  dot._raf = requestAnimationFrame(frame);
}

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

/* Puts a dot on the original pane's scrollbar rail (ui.rail, see scrollbar.js) for each bookmark. The dot sits
   where the thumb's centre is when that line is centred in the pane (which is where a jump puts it), using the
   same thumb maths as the thumb itself: thumb top = TRACK_PAD + scrollTop / (H - C) * (T - L).
   The spacers keep scrollHeight at the whole book's height, so this holds whichever chunks are in the page. */
export function renderRail(tab) {
  const ui = tab.ui;
  const ch = ui?.chunkers?.[0];
  const pane = ui?.paneOriginal;
  if (!ui?.rail) return;
  const marks = ch?.pitch && !ui.root.hidden && pane.scrollHeight > pane.clientHeight
    ? state.bookmarks.filter((b) => isMarked(b, tab) && ch.lineNums.includes(b.line)) : [];
  if (!marks.length) {
    ui.rail.innerHTML = ui.railHtml = '';
    ui.railMarks = [];
    ui.sb.rail.classList.remove('bm-near');
    return;
  }

  const { C, H, T, L } = thumbMetrics(pane);
  const top = textTop(ch);
  ui.railMarks = marks.map((b) => {
    const p = top + (ch.lineNums.indexOf(b.line) + 0.5) * ch.pitch;   // the line's centre in scroll space
    const s = clamp(p - C / 2, 0, H - C);                              // scrollTop with that line centred
    return { line: b.line, p, y: TRACK_PAD + (s / (H - C)) * (T - L) + L / 2 };
  });
  const html = ui.railMarks.map((m) =>
    `<button class="bm-dot" data-line="${m.line}" data-tip="Line ${m.line}" data-tip-side="left"
      aria-label="Go to line ${m.line}" style="top:${m.y.toFixed(1)}px">
      <svg viewBox="-17 -17 34 34" aria-hidden="true"><path d="${DOT_PATH}"/></svg></button>`).join('');
  if (ui.railHtml !== html) { ui.rail.innerHTML = html; ui.railHtml = html; }
  updateRailNear(tab, false);   // bring the dots to the right state without playing the morph
}

/* Scrolled to within a quarter-screen of a bookmark: the thumb's pill hides and its dot morphs into a
   circle (see setDotNear), so the scrollbar looks like it has turned into the bookmark. */
export function updateRailNear(tab, animate = true) {
  const ui = tab.ui;
  const pane = ui?.paneOriginal;
  const marks = ui?.railMarks;
  if (!marks?.length) return;
  const centre = pane.scrollTop + pane.clientHeight / 2;
  const reach = pane.clientHeight * 0.75;
  const held = ui.sb.rail.classList.contains('dragging');   // while the thumb is held only the thumb reacts
  let any = false;
  marks.forEach((m, i) => {
    const dot = ui.rail.children[i];
    const near = !held && Math.abs(m.p - centre) <= reach;
    if (dot && dot.classList.contains('near') !== near) setDotNear(dot, near, animate);
    else if (dot && !dot._radii) setDotNear(dot, near, false);   // a freshly built dot
    any ||= near;
  });
  ui.sb.rail.classList.toggle('bm-near', any);
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
