import { clamp, el } from './dom.js';
import { shared, tabRef } from './state.js';
import { FIT_CANDIDATES } from './fit.js';
import { hideWordCard } from './word-card.js';
import { markNotes } from './notes.js';
import { markBookmarks, renderRail } from './bookmarks.js';

/* ==========================================================
   CHUNKS: a book is split into 25-line chunks and only three are in the page at
   once (the one at the middle of the pane and its neighbours). Spacers above and
   below stand in for the rest at their exact height, so the scrollbar, scroll
   position and scroll anchoring behave as if the whole book were there.
   Every line is one row of the same height (lines never wrap, and the scansion
   marks are absolutely positioned), so one measured row height places everything.
   ========================================================== */
const CHUNK = 25;     // lines per chunk
const ROW_GAP = 3;    // gap between lines, as in .verses and .verse-chunk

export function makeChunker(tab, container, pane, rows, scores, pitch = 0) {
  // The lines most likely to be the widest, measured for the fit instead of the whole text
  const cand = scores.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]).slice(0, FIT_CANDIDATES).map(([, i]) => i);
  return { tab, container, pane, rows, cand, pitch, nodes: new Map(), center: -1, lo: 0, hi: -1, top: null, bottom: null };
}

export function mountChunker(ch) {
  ch.container.innerHTML = '<div class="chunk-spacer"></div><div class="chunk-spacer"></div>';
  [ch.top, ch.bottom] = ch.container.children;
  ch.nodes.clear();
  showWindow(ch, 0);
  if (measurePitch(ch)) sizeSpacers(ch);
}

/* Puts chunks c-1 … c+1 in the page. Chunks already there are left alone. */
export function showWindow(ch, c) {
  const count = Math.ceil(ch.rows.length / CHUNK);
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
      if (ch.container === ch.tab.ui.passage) { markNotes(ch.tab, node); markBookmarks(ch.tab, node); }
      ch.container.insertBefore(node, next);
      ch.nodes.set(k, node);
    }
    next = node;
  }
  sizeSpacers(ch);
  if (ch.container === ch.tab.ui.passage) showRange(ch);
}

/* The sidebar tab names the 25 lines of the middle chunk (the other two chunks are the 75 in the page). This runs
   only when the middle chunk changes, and touches one small piece of text rather than redrawing the tab list. */
function showRange(ch) {
  const nums = ch.lineNums;
  if (!nums?.length) return;
  const tab = ch.tab;
  tab.range = `${nums[ch.center * CHUNK]}-${nums[Math.min(nums.length, (ch.center + 1) * CHUNK) - 1]}`;
  for (const ref of el.tabList.querySelectorAll(`.tab[data-tab-id="${tab.id}"] .tab-ref`)) ref.textContent = tabRef(tab);
}

export function sizeSpacers(ch) {
  const set = (sp, rows) => {
    const h = rows * ch.pitch - ROW_GAP;   // n rows take n·pitch less one gap; the container's gap adds it back
    sp.style.display = rows && h > 0 ? '' : 'none';
    sp.style.height = `${Math.max(0, h)}px`;
  };
  set(ch.top, ch.lo * CHUNK);
  set(ch.bottom, Math.max(0, ch.rows.length - (ch.hi + 1) * CHUNK));
}

/* Height of one row plus the gap. Read from the computed style, which a transform (the pop-in) doesn't change. */
export function measurePitch(ch) {
  const row = ch.nodes.values().next().value?.firstElementChild;
  const h = row ? parseFloat(getComputedStyle(row).height) : 0;
  if (!(h > 0)) return false;
  const p = h + ROW_GAP;
  if (Math.abs(p - ch.pitch) < 0.001) return false;
  ch.pitch = p;
  return true;
}

/* Where the text block starts within the pane's scrolling content */
export function textTop({ container: c, pane: p }) {
  return c.offsetParent === p ? c.offsetTop : c.offsetTop - p.offsetTop - p.clientTop;
}

/* Called on every scroll: swaps chunks only when the middle of the pane moves into another chunk */
export function syncChunks(ch) {
  if (!ch?.pitch || !ch.pane.clientHeight) return;
  const count = Math.ceil(ch.rows.length / CHUNK);
  const y = ch.pane.scrollTop + ch.pane.clientHeight / 2 - textTop(ch);
  const c = clamp(Math.floor(y / (CHUNK * ch.pitch)), 0, Math.max(0, count - 1));
  if (c !== ch.center) showWindow(ch, c);
}

/* After a fit or a resize: row heights may have changed */
export function syncLayout(tab) {
  const ui = tab.ui;
  if (!ui?.chunkers || ui.root.hidden) return;
  for (const ch of ui.chunkers) {
    if (measurePitch(ch)) sizeSpacers(ch);
    syncChunks(ch);
  }
  renderRail(tab);
}

/* Scrolls a line of the original to the middle of its pane and returns its element */
export function scrollToLine(tab, line) {
  const ch = tab.ui.chunkers?.[0];
  const i = ch?.lineNums?.indexOf(line) ?? -1;
  if (i < 0) return null;
  const find = () => ch.container.querySelector(`.verse[data-line="${line}"]`);
  if (ch.pitch && ch.pane.clientHeight) {
    ch.pane.scrollTop = textTop(ch) + (i + 0.5) * ch.pitch - ch.pane.clientHeight / 2;
    syncChunks(ch);
  }
  if (!find()) showWindow(ch, Math.floor(i / CHUNK));
  return find();
}
