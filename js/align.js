import { CHUNK, ROW_GAP, syncLayout } from './chunks.js';
import { tier } from './viewport.js';

/* ==========================================================
   ALIGNED PARALLEL TRANSLATION
   Beside the English (desktop and tablet), each passage of the original sits level with the English block that
   translates it: both start at the same height and take the same room, the shorter side padded below. A small gap
   (GAP_LINES of a Line) always separates the original's passages, as the English blocks' own padding does.

   Most of the book isn't in the page (see CHUNKS in chunks.js), so every Line and every English block is laid out
   once in a hidden copy (a probe) at the panes' widths, and from those heights:
   - each passage's first Line gets a top margin (`mt`, by row) and the book's last Line a bottom margin,
   - each English block a min-height (`enMin`, by block),
   - and each chunk of either pane its exact height (`known`), so the spacers are exact too.
   The two panes then have the same layout, block for block, and are linked pixel for pixel (follow in parallel.js).
   The work is redone only when something that moves lines changes (see alignKey), and while that keeps changing
   (the divider or the font size being dragged, the window resized) only once it settles (SETTLE_MS).
   ========================================================== */
const GAP_LINES = 0.75;
const SETTLE_MS = 150;
const SAMPLE = 40;   // Lines laid out to check that, unwrapped, every Line is the same height

let fontEpoch = 0;   // a web font arriving changes line widths, and so where lines wrap
document.fonts?.addEventListener('loadingdone', () => { fontEpoch++; });

export const aligned = (tab) => !!tab.ui?.align;

const wanted = (tab) => {
  const ui = tab.ui;
  return !!tab.split && !!ui?.englishSpans && ui.englishKey === ui.renderedKey && !!ui.chunkers?.[1]?.rows.length
    && tier() !== 'compact' && !ui.root.hidden && ui.paneTranslation.clientWidth > 0;
};

/* Everything that can change a Line's or a block's height */
function alignKey(tab) {
  const ui = tab.ui, cs = getComputedStyle(ui.root);
  const vars = ['--reading-font-size', '--reading-trans-font-size', '--reading-line-height', '--reading-font']
    .map((v) => cs.getPropertyValue(v)).join('|');
  return [ui.renderedKey, ui.englishKey, ui.passage.clientWidth, ui.translation.clientWidth, ui.root.dataset.wrap,
    vars, JSON.stringify(document.documentElement.dataset), fontEpoch].join('§');
}

/* Lays `rows` out hidden in `pane`, in a copy of `container` at its width, and returns each row's height */
function probeHeights(pane, container, rows) {
  if (!rows.length) return [];
  const probe = document.createElement('div');
  probe.className = `${container.className} align-probe`;
  probe.setAttribute('aria-hidden', 'true');
  probe.style.width = `${container.clientWidth}px`;
  probe.innerHTML = rows.join('');
  pane.append(probe);
  // Rects are drawn sizes: a pane's pop-in (a scale) may still be running, so it is divided out
  const layoutW = parseFloat(getComputedStyle(probe).width);
  const scale = layoutW > 0 ? (probe.getBoundingClientRect().width / layoutW) || 1 : 1;
  const heights = [...probe.children].map((r) => r.getBoundingClientRect().height / scale);
  probe.remove();
  return heights;
}

/* The height of every row of the original. Laying out a whole Book takes a while (its words and syllables are
   thousands of boxes), and on a desktop whose Lines don't wrap they are all one height, so a sample is enough. */
function lineHeights(tab, la) {
  const ui = tab.ui;
  if (tier() === 'desktop' && ui.root.dataset.wrap !== 'on') {
    const step = Math.max(1, Math.floor(la.rows.length / SAMPLE));
    const sample = probeHeights(ui.paneOriginal, la.container, la.rows.filter((_, i) => i % step === 0));
    if (sample.every((h) => Math.abs(h - sample[0]) < 0.01)) return new Array(la.rows.length).fill(sample[0]);
  }
  return probeHeights(ui.paneOriginal, la.container, la.rows);
}

/* Works out (or clears) the alignment. Called before the chunker measures (syncLayout in chunks.js); returns
   whether anything changed, in which case the chunks in the page are restyled and the English is relinked. */
export function alignBlocks(tab) {
  const ui = tab.ui;
  const [la, en] = ui.chunkers ?? [];
  if (!la || !en) return false;
  if (!wanted(tab)) {
    if (!ui.align) return false;
    ui.align = null;
    ui.alignKey = null;
    la.known = en.known = null;
    restyle(tab);
    return true;
  }
  const key = alignKey(tab);
  if (key === ui.alignKey) return false;
  // Already aligned and something changed: wait for it to stop changing, keeping the old alignment meanwhile
  if (ui.align && !ui.alignNow) {
    clearTimeout(ui.alignTimer);
    ui.alignTimer = setTimeout(() => { ui.alignNow = true; syncLayout(tab); }, SETTLE_MS);
    return false;
  }
  ui.alignNow = false;
  clearTimeout(ui.alignTimer);
  ui.alignKey = key;

  const rowH = lineHeights(tab, la);
  const enH = probeHeights(ui.paneTranslation, en.container, en.rows);
  const gap = GAP_LINES * (rowH[0] || 0);
  const spans = ui.englishSpans;
  const mt = new Float64Array(la.rows.length), mb = new Float64Array(la.rows.length);
  const enMin = new Float64Array(en.rows.length);
  // `pending`: room the original still owes the English before its next Line
  let pending = 0;
  spans.forEach(({ start, end }, b) => {
    const E = enH[b] ?? 0;
    if (end <= start) {   // a block with no Lines of its own (shouldn't happen): the original just makes room
      enMin[b] = E;
      pending += E + ROW_GAP;
      return;
    }
    let L = (end - start - 1) * ROW_GAP;
    for (let i = start; i < end; i++) L += rowH[i];
    const H = Math.max(E, L + gap);
    enMin[b] = H;
    mt[start] += pending;
    pending = H - L;
  });
  if (la.rows.length) mb[la.rows.length - 1] = pending;

  const chunkSums = (n, size) => {
    const out = [];
    for (let k = 0; k * CHUNK < n; k++) {
      let h = 0;
      const a = k * CHUNK, b = Math.min(n, a + CHUNK);
      for (let i = a; i < b; i++) h += size(i);
      out.push(h + (b - a - 1) * ROW_GAP);
    }
    return out;
  };
  la.known = chunkSums(la.rows.length, (i) => mt[i] + rowH[i] + mb[i]);
  en.known = chunkSums(en.rows.length, (b) => enMin[b]);
  ui.align = { mt, mb, enMin };
  restyle(tab);
  return true;
}

/* Styles the rows of one chunk (node, chunk k) as they go into the page, or all those in the page */
export function applyAlign(ch, node, k) {
  const ui = ch.tab.ui, a = ui.align;
  const rows = node.children, base = k * CHUNK;
  if (ch.container === ui.passage) {
    for (let j = 0; j < rows.length; j++) {
      rows[j].style.marginTop = a?.mt[base + j] ? `${a.mt[base + j]}px` : '';
      rows[j].style.marginBottom = a?.mb[base + j] ? `${a.mb[base + j]}px` : '';
    }
  } else if (ch.container === ui.translation) {
    for (let j = 0; j < rows.length; j++) rows[j].style.minHeight = a ? `${a.enMin[base + j]}px` : '';
  }
}

function restyle(tab) {
  for (const ch of tab.ui.chunkers) for (const [k, node] of ch.nodes) applyAlign(ch, node, k);
}
