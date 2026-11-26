import { RANGE_DASH } from './data.js';
import { clamp, el } from './dom.js';
import { shared, tabRef } from './state.js';
import { FIT_CANDIDATES } from './fit.js';
import { hideWordCard } from './word-card.js';
import { markNotes } from './notes.js';
import { markBookmarks, renderRail } from './bookmarks.js';
import { refreshBottomBar } from './bottom-bar.js';
import { relinkIfNeeded } from './parallel.js';
import { markBlockStarts } from './reader.js';

/* ==========================================================
   CHUNKS: a book is split into 25-line chunks and only three are in the page at
   once (the one at the middle of the pane and its neighbours). Spacers above and
   below stand in for the rest, so the scrollbar, scroll position and bookmark dots
   behave as if the whole book were there.

   Lines can wrap (on phones), so chunks differ in height. Each chunk's height is
   measured whenever it is in the page and remembered; a chunk that hasn't been seen
   yet is estimated from the average line height so far (`pitch`, a line plus its gap).
   On a wide screen nothing wraps, every chunk is 25 identical rows, and the estimate
   is exact.

   Because estimates can be corrected, a pixel scroll offset isn't a stable place in
   the book. The reading position is kept as an anchor instead: the line at the top
   of the pane and how far into it the pane starts. After anything that can move lines
   (new chunks, a refit, a resize) the anchor is put back where it was.
   ========================================================== */
const CHUNK = 25;     // lines per chunk
const ROW_GAP = 3;    // gap between lines and between chunks, as in .verses and .verse-chunk

export function makeChunker(tab, container, pane, rows, scores, pitch = 0) {
  // The lines most likely to be the widest, measured for the fit instead of the whole text
  const cand = scores.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]).slice(0, FIT_CANDIDATES).map(([, i]) => i);
  return { tab, container, pane, rows, cand, pitch, heights: [], anchor: null,
    nodes: new Map(), center: -1, lo: 0, hi: -1, top: null, bottom: null };
}

export function mountChunker(ch) {
  ch.container.innerHTML = '<div class="chunk-spacer"></div><div class="chunk-spacer"></div>';
  [ch.top, ch.bottom] = ch.container.children;
  ch.nodes.clear();
  ch.heights = [];
  ch.anchor = null;
  showWindow(ch, 0);
}

/* ---------- Geometry. Positions are in the text block's own space: 0 is the top of its first line. ---------- */
const chunkCount = (ch) => Math.ceil(ch.rows.length / CHUNK);
const linesIn = (ch, k) => Math.min(CHUNK, ch.rows.length - k * CHUNK);
/* n rows take n·pitch less one gap */
const chunkHeight = (ch, k) => ch.heights[k] ?? linesIn(ch, k) * ch.pitch - ROW_GAP;
const chunkPitch = (ch, k) => (chunkHeight(ch, k) + ROW_GAP) / linesIn(ch, k);

function chunkTop(ch, k) {
  let y = 0;
  for (let j = 0; j < k; j++) y += chunkHeight(ch, j) + ROW_GAP;
  return y;
}

/* Height of the chunks a..b-1 laid end to end (what a spacer standing in for them must be) */
function span(ch, a, b) {
  let h = 0;
  for (let k = a; k < b; k++) h += chunkHeight(ch, k) + ROW_GAP;
  return Math.max(0, h - ROW_GAP);
}

/* Read from the computed style, which a transform (the pop-in) doesn't change */
const boxHeight = (node) => parseFloat(getComputedStyle(node).height) || 0;

/* A line's top and height. Exact when its chunk is in the page, estimated otherwise. */
function lineBox(ch, i) {
  const k = Math.floor(i / CHUNK);
  const top = chunkTop(ch, k);
  const node = ch.nodes.get(k);
  const row = node?.children[i - k * CHUNK];
  if (row) return { top: top + row.offsetTop - node.offsetTop, height: boxHeight(row) + ROW_GAP };
  const p = chunkPitch(ch, k);
  return { top: top + (i - k * CHUNK) * p, height: p };
}

/* Index of the chunk at y */
function chunkAt(ch, y) {
  const count = chunkCount(ch);
  let top = 0;
  for (let k = 0; k < count; k++) {
    top += chunkHeight(ch, k) + ROW_GAP;
    if (y < top) return k;
  }
  return Math.max(0, count - 1);
}

/* Index of the line at y */
function lineAt(ch, y) {
  const k = chunkAt(ch, y);
  const node = ch.nodes.get(k);
  const base = chunkTop(ch, k);
  if (node) {
    const rows = node.children;
    let i = 0;
    while (i + 1 < rows.length && base + rows[i + 1].offsetTop - node.offsetTop <= y) i++;
    return k * CHUNK + i;
  }
  return k * CHUNK + clamp(Math.floor((y - base) / chunkPitch(ch, k)), 0, linesIn(ch, k) - 1);
}

/* A line's centre, for the bookmark dots on the scrollbar rail */
export function lineCenter(ch, i) {
  const b = lineBox(ch, i);
  return b.top + b.height / 2;
}

/* The first and last line numbers on screen, not counting what the bottom padding (under the phone's
   bottom bar) covers. Null before the book has loaded. */
export function visibleLines(ch) {
  const rows = visibleRows(ch);
  return rows && [ch.lineNums[rows[0]], ch.lineNums[rows[1]]];
}

/* The same, as row indices (for the English, whose rows are passages rather than Lines) */
export function visibleRows(ch) {
  if (!ch?.pitch || !ch.lineNums?.length || !ch.pane.clientHeight) return null;
  const pad = parseFloat(getComputedStyle(ch.pane).paddingBottom) || 0;
  const top = ch.pane.scrollTop - textTop(ch);
  const bottom = top + ch.pane.clientHeight - pad;
  const last = ch.rows.length - 1;
  return [clamp(lineAt(ch, Math.max(0, top)), 0, last), clamp(lineAt(ch, Math.max(0, bottom - 1)), 0, last)];
}

/* Indices of the first and last lines you can read: from just below the top padding (on a phone, clear of the
   menu button) to just above the bottom padding (the bottom bar). Null before the book has loaded. */
export function readableRange(ch) {
  if (!ch?.pitch || !ch.rows?.length || !ch.pane.clientHeight) return null;
  const top = ch.pane.scrollTop - textTop(ch) + topInset(ch);
  const pad = parseFloat(getComputedStyle(ch.pane).paddingBottom) || 0;
  const bottom = ch.pane.scrollTop - textTop(ch) + ch.pane.clientHeight - pad;
  const last = ch.rows.length - 1;
  return [clamp(lineAt(ch, Math.max(0, top)), 0, last), clamp(lineAt(ch, Math.max(0, bottom - 1)), 0, last)];
}

/* Index of the line the reader was last at the top of (0 at the start, or before the book has loaded).
   Kept while the tab is hidden, so the tab grid can show where each tab is. */
export const anchorIndex = (ch) => ch?.anchor?.i ?? 0;

/* ---------- Measuring ---------- */

/* Remembers the height of every chunk in the page and updates the average pitch. Returns whether anything moved.
   `fresh`: the layout may have changed (a refit or a resize), so remembered heights of chunks not in the page
   are dropped as well, unless every chunk in the page measures as it did before (then nothing changed). */
function measureChunks(ch, fresh = false) {
  const seen = [];
  for (const [k, node] of ch.nodes) {
    const h = boxHeight(node);
    if (h > 0) seen.push([k, h]);   // 0: the reader is hidden, nothing to learn
  }
  if (!seen.length) return false;
  const moved = seen.some(([k, h]) => Math.abs((ch.heights[k] ?? -1) - h) > 0.5);
  if (!moved) return false;
  if (fresh) ch.heights = [];
  for (const [k, h] of seen) ch.heights[k] = h;
  let px = 0, lines = 0;
  ch.heights.forEach((h, k) => { if (h != null) { px += h + ROW_GAP; lines += linesIn(ch, k); } });
  ch.pitch = px / lines;
  return true;
}

export function sizeSpacers(ch) {
  const set = (sp, h) => {
    sp.style.display = h > 0 ? '' : 'none';
    sp.style.height = `${Math.max(0, h)}px`;
  };
  set(ch.top, ch.lo > 0 ? span(ch, 0, ch.lo) : 0);
  set(ch.bottom, ch.hi + 1 < chunkCount(ch) ? span(ch, ch.hi + 1, chunkCount(ch)) : 0);
}

/* ---------- The reading position ---------- */

/* Where the text block starts within the pane's scrolling content */
export function textTop({ container: c, pane: p }) {
  return c.offsetParent === p ? c.offsetTop : c.offsetTop - p.offsetTop - p.clientTop;
}

/* Notes which line is the first you can read (just below the top padding), and how far into it. Above the first line (the title)
   there's nothing to keep: the title doesn't move. */
/* How far below the pane's top edge reading starts: its top padding, which differs by layout (on a phone it clears
   the floating menu button). The anchor is the first line you can read, so a change of layout keeps that line. */
const topInset = (ch) => parseFloat(getComputedStyle(ch.pane).paddingTop) || 0;

/* While the window is being resized (or turned, or crossing to another layout) the browser moves scroll positions
   itself: a pane that shrinks gets its scroll clamped, a pane that was hidden comes back at the top. Those aren't
   the reader moving, so for a moment after each resize the anchors are held as they were, and the layout code puts
   every pane back by them. Deliberate jumps (force) still save.
   Only a change of width counts: lines re-wrap when the width changes, while a height change is a phone's address
   bar sliding away mid-scroll (iOS fires resize for it) or its keyboard opening, and holding then would pull the
   reader back to where the scroll began. */
const HOLD_MS = 400;
let holdUntil = 0, lastWidth = innerWidth;
addEventListener('resize', () => {
  if (innerWidth === lastWidth) return;
  lastWidth = innerWidth;
  holdUntil = performance.now() + HOLD_MS;
});

function saveAnchor(ch, force = false) {
  if (!ch.pitch || !ch.pane.clientHeight) return;
  if (!force && performance.now() < holdUntil) return;
  const y = ch.pane.scrollTop + topInset(ch) - textTop(ch);
  if (y <= 0) { ch.anchor = null; return; }
  const i = lineAt(ch, y);
  const b = lineBox(ch, i);
  ch.anchor = { i, frac: clamp((y - b.top) / b.height, 0, 1) };
}

/* Scrolls so the anchored line is back where it was. Only writes when it is off, since a write stops
   a touch fling. */
function restoreAnchor(ch) {
  if (!ch.anchor || !ch.pane.clientHeight) return;
  const b = lineBox(ch, ch.anchor.i);
  const target = textTop(ch) + b.top + ch.anchor.frac * b.height - topInset(ch);
  if (Math.abs(ch.pane.scrollTop - target) > 0.5) ch.pane.scrollTop = target;
}

/* ---------- The window of chunks in the page ---------- */

/* Puts chunks c-1 … c+1 in the page. Chunks already there are left alone. */
export function showWindow(ch, c) {
  const count = chunkCount(ch);
  ch.center = c;
  ch.lo = Math.max(0, c - 1);
  ch.hi = Math.min(count - 1, c + 1);
  for (const [k, node] of ch.nodes) {
    if (k >= ch.lo && k <= ch.hi) continue;
    if (shared.selectedWord && node.contains(shared.selectedWord)) hideWordCard();
    node.remove();
    ch.nodes.delete(k);
  }
  let next = ch.bottom;
  for (let k = ch.hi; k >= ch.lo; k--) {
    let node = ch.nodes.get(k);
    if (!node) {
      node = document.createElement('div');
      node.className = 'verse-chunk';
      node.innerHTML = ch.rows.slice(k * CHUNK, (k + 1) * CHUNK).join('');
      if (ch.container === ch.tab.ui.passage) { markNotes(ch.tab, node); markBookmarks(ch.tab, node); markBlockStarts(ch.tab, node); }
      ch.container.insertBefore(node, next);
      ch.nodes.set(k, node);
    }
    next = node;
  }
  measureChunks(ch);
  sizeSpacers(ch);
  if (ch.container === ch.tab.ui.passage) showRange(ch);
}

/* The sidebar tab names the 25 lines of the middle chunk (the other two chunks are the 75 in the page). This runs
   only when the middle chunk changes, and touches one small piece of text rather than redrawing the tab list. */
function showRange(ch) {
  const nums = ch.lineNums;
  if (!nums?.length) return;
  const tab = ch.tab;
  tab.range = `${nums[ch.center * CHUNK]}${RANGE_DASH}${nums[Math.min(nums.length, (ch.center + 1) * CHUNK) - 1]}`;
  for (const ref of el.tabList.querySelectorAll(`.tab[data-tab-id="${tab.id}"] .tab-ref`)) ref.textContent = tabRef(tab);
}

/* Called on every scroll: swaps chunks only when the middle of the pane moves into another chunk */
export function syncChunks(ch) {
  if (!ch?.pitch || !ch.pane.clientHeight) return;
  const c = chunkAt(ch, ch.pane.scrollTop + ch.pane.clientHeight / 2 - textTop(ch));
  if (c !== ch.center) {
    saveAnchor(ch);     // from the layout as it was
    showWindow(ch, c);  // new chunks may measure differently from their estimates
    restoreAnchor(ch);
  }
  saveAnchor(ch);
}

/* Puts line index i at the top of the chunker's pane (null: back to the very top, title and all) */
export function jumpToIndex(ch, i, frac = 0) {
  if (!ch?.rows.length) return;
  measureChunks(ch, true);
  sizeSpacers(ch);
  if (i == null) { ch.anchor = null; ch.pane.scrollTop = 0; syncChunks(ch); return; }
  ch.anchor = { i: clamp(i, 0, ch.rows.length - 1), frac };
  restoreAnchor(ch);   // from the estimate, which brings the line's chunk into the page…
  syncChunks(ch);
  restoreAnchor(ch);   // …then from where it really is
}

/* Puts the pane at an anchor ({ i, frac }: row i, frac of the way into it, at the top of the pane), or, for null,
   at scroll offset `top` (the title area above the first row). Used by the Parallel translation's linked scrolling
   (see parallel.js); unlike jumpToIndex it doesn't remeasure, so it is cheap enough to run on every scroll. */
export function placeAt(ch, anchor, top = 0) {
  if (!ch?.rows.length || !ch.pane.clientHeight) return;
  if (!anchor) {
    ch.anchor = null;
    ch.pane.scrollTop = Math.min(top, textTop(ch) - topInset(ch));
    syncChunks(ch);
    return;
  }
  ch.anchor = { i: clamp(anchor.i, 0, ch.rows.length - 1), frac: clamp(anchor.frac, 0, 1) };
  restoreAnchor(ch);   // from the estimate, which brings the row's chunk into the page…
  const kept = ch.anchor;
  syncChunks(ch);
  ch.anchor = kept;    // (syncChunks saved it again from where the estimate landed)
  restoreAnchor(ch);   // …then from where it really is
}

/* After a fit or a resize: lines may have changed height, or started or stopped wrapping */
export function syncLayout(tab) {
  const ui = tab.ui;
  if (!ui?.chunkers || ui.root.hidden) return;
  for (const ch of ui.chunkers) {
    if (measureChunks(ch, true)) {
      sizeSpacers(ch);
      restoreAnchor(ch);
    }
    syncChunks(ch);
  }
  relinkIfNeeded(tab);
  renderRail(tab);
  refreshBottomBar(tab);   // the line range on screen may have changed
}

/* Scrolls a line of the original to the middle of its pane and returns its element */
export function scrollToLine(tab, line) {
  const ch = tab.ui.chunkers?.[0];
  const i = ch?.lineNums?.indexOf(line) ?? -1;
  if (i < 0) return null;
  const find = () => ch.container.querySelector(`.verse[data-line="${line}"]`);
  const centre = () => { ch.pane.scrollTop = textTop(ch) + lineCenter(ch, i) - ch.pane.clientHeight / 2; };
  if (ch.pitch && ch.pane.clientHeight) {
    centre();          // from the estimate, which brings the line's chunk into the page…
    syncChunks(ch);
    centre();          // …then from where it really is
    saveAnchor(ch, true);
  }
  if (!find()) showWindow(ch, Math.floor(i / CHUNK));
  return find();
}
