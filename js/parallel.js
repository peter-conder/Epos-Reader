import { placeAt, syncChunks, textTop } from './chunks.js';
import { aligned } from './align.js';

/* ==========================================================
   PARALLEL TRANSLATION: linked scrolling
   The English is one block per Perseus passage, and each block covers a range of Lines (see
   .scratch/translation/spec.md). The two panes are linked through their anchors (chunks.js): the row at the top of
   the pane and how far into it. The Line at the top of the original maps to the block that contains it, at the same
   fraction of the block as the Line is of the block's Lines; the English maps back the same way. Exact at block
   edges, proportional within a block.
   Once the passages are aligned (align.js), each block sits level with its Lines and both panes have the same
   layout, so they are simply linked pixel for pixel. The anchor mapping is still what the phone's swap uses.

   Each pane's scroll moves the other. A scroll that the link itself caused would otherwise come straight back as
   the other pane's own scroll, so for a moment after the link moves a pane, that pane's scrolls don't move the
   pane that led, unless you are scrolling it yourself (the pane you last touched, wheeled or keyed in).
   ========================================================== */
const ECHO_MS = 150;

/* Row in the original where each block starts, and where it ends (the next block's start, or the end of the Book).
   Rows, not Line numbers: Aeneid X prints Lines 717–718 before 714. */
export function blockRows(lineNums, blocks) {
  const row = new Map(lineNums.map((n, i) => [n, i]));
  const starts = blocks.map((b) => row.get(b.from) ?? 0);
  return starts.map((s, b) => ({ start: s, end: b + 1 < starts.length ? starts[b + 1] : lineNums.length }));
}

/* The block a row of the original is in */
export function blockOfRow(spans, i) {
  let lo = 0, hi = spans.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (spans[mid].start <= i) lo = mid; else hi = mid - 1;
  }
  return lo;
}

/* Original anchor → English anchor */
export function toEnglish(spans, a) {
  const b = blockOfRow(spans, a.i);
  const { start, end } = spans[b];
  return { i: b, frac: (a.i - start + a.frac) / Math.max(1, end - start) };
}

/* English anchor → original anchor */
export function toOriginal(spans, a) {
  const { start, end } = spans[a.i];
  const pos = start + a.frac * (end - start);
  const i = Math.min(Math.floor(pos), end - 1);
  return { i, frac: pos - i };
}

const linked = (tab) => !!tab.split && !!tab.ui?.englishSpans && tab.ui.chunkers?.[1]?.rows.length;

/* Moves the other pane to match pane `from` (0 the original, 1 the English) */
export function follow(tab, from) {
  if (!linked(tab)) return;
  const ui = tab.ui;
  const lead = ui.chunkers[from], other = ui.chunkers[1 - from];
  const a = lead.anchor;
  const target = !a ? null : from === 0 ? toEnglish(ui.englishSpans, a) : toOriginal(ui.englishSpans, a);
  other.pane.dataset.linkedAt = performance.now();
  // Aligned (align.js): the panes are laid out block for block, so they scroll together pixel for pixel
  if (aligned(tab)) {
    const y = lead.pane.scrollTop - textTop(lead) + textTop(other);
    if (Math.abs(other.pane.scrollTop - y) > 0.5) other.pane.scrollTop = y;
    syncChunks(other);
    return;
  }
  placeAt(other, target, lead.pane.scrollTop);
}

/* Called from each pane's scroll handler, after its chunks are synced (so its anchor is current) */
export function paneScrolled(tab, from) {
  const ui = tab.ui;
  const pane = from === 0 ? ui.paneOriginal : ui.paneTranslation;
  const echo = performance.now() - (+pane.dataset.linkedAt || 0) < ECHO_MS;
  if (echo && ui.driver !== from) return;
  follow(tab, from);
}

/* The pane you last touched, wheeled or keyed in is the one you are scrolling */
export function trackDriver(tab) {
  const ui = tab.ui;
  [ui.paneOriginal, ui.paneTranslation].forEach((pane, i) => {
    for (const type of ['pointerdown', 'wheel', 'touchstart', 'keydown']) {
      pane.addEventListener(type, () => { ui.driver = i; }, { passive: true });
    }
  });
}

/* Once the English is on screen and laid out, it starts from where the original is */
export function relinkIfNeeded(tab) {
  if (!tab.ui?.needsLink || !linked(tab) || !tab.ui.paneTranslation.clientHeight) return;
  tab.ui.needsLink = false;
  follow(tab, 0);
}
