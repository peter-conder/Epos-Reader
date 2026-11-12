import { clamp, el, MIN_FONT } from './dom.js';
import { isText, partnerOf, state } from './state.js';
import { syncLayout } from './chunks.js';

/* Text shrinks to fit its pane instead of wrapping, never below the smallest size the editor offers */
const TWO_UP_SCALE = 0.86;
export const FIT_CANDIDATES = 40;   // lines measured at the reference sizes (picked from the text, see makeChunker)
const FIT_STEP = 100;        // sizes round down to 1/100 rem, so tiny width changes don't relayout the book

/* How wide one line's content is (its flex row stretches to the widest line, so the row itself can't say).
   Rects include transforms, so `scale` (how much bigger or smaller the page is drawn than laid out) is divided out. */
export function lineWidth(line, padRight, scale = 1) {
  const left = line.getBoundingClientRect().left;
  if (line.classList.contains('verse')) {
    const last = line.lastElementChild?.lastElementChild ?? line.lastElementChild;
    return last ? (last.getBoundingClientRect().right - left) / scale : 0;
  }
  const r = document.createRange();
  r.selectNodeContents(line);
  return (r.getBoundingClientRect().right - left) / scale + padRight;
}

/* Width grows almost linearly with size (the text scales, word padding doesn't). Most of the book isn't in
   the page, so the lines likeliest to be widest are picked from the text itself (longest by letters and
   words), and only copies of those are laid out at the smallest and largest sizes. Gives each line's
   { k, b } with width = k·size + b. */
export function measureFitModel(checks) {
  const lo = MIN_FONT * TWO_UP_SCALE, hi = parseFloat(el.fontSlider.max);
  const model = new Map();
  for (const c of checks) {
    if (!c.ch.cand.length) { model.set(c.pn, []); continue; }
    const probe = document.createElement('div');
    probe.className = 'fit-probe';
    probe.setAttribute('aria-hidden', 'true');
    probe.innerHTML = c.ch.cand.map((i) => c.ch.rows[i]).join('');
    c.pn.append(probe);
    const widest = [...probe.children];
    const padRight = parseFloat(getComputedStyle(widest[0]).paddingRight) || 0;
    const at = (size) => {
      probe.style.setProperty('--reading-font-size', `${size}rem`);
      probe.style.setProperty('--reading-trans-font-size', `${size * 0.86}rem`);
      // A new tab's pop-in (a scale animation) is still running when its text is first fitted, and rects are drawn
      // sizes, not layout sizes. The probe's layout width is a computed style, which transforms don't touch.
      const layoutW = parseFloat(getComputedStyle(probe).width);
      const scale = layoutW > 0 ? probe.getBoundingClientRect().width / layoutW : 1;
      return widest.map((l) => lineWidth(l, padRight, scale || 1));
    };
    const wLo = at(lo), wHi = at(hi);
    probe.remove();
    model.set(c.pn, wLo.map((w, i) => {
      const k = (wHi[i] - w) / (hi - lo);
      return { k, b: w - k * lo };
    }));
  }
  return model;
}

/* verify: also check the result against the real layout (skipped while a pane is being dragged) */
export function fitReader(tab, verify = true) {
  const ui = tab?.ui;
  if (!ui?.chunkers || !ui.root.isConnected || ui.root.hidden || !ui.paneOriginal.clientWidth) return;
  // Two windows share the width, so the text sits a step smaller than in a single window
  const twoUp = !!partnerOf(tab) || !!tab.split;
  const max = state.fontRem * (twoUp ? TWO_UP_SCALE : 1);
  const min = Math.min(max, MIN_FONT);
  const panes = tab.split && ui.paneTranslation.clientWidth ? [ui.paneOriginal, ui.paneTranslation] : [ui.paneOriginal];
  // Padding doesn't depend on the font size, so it is read once rather than on every step of the search
  const checks = panes.map((pn, i) => {
    const cs = getComputedStyle(pn);
    return { pn, ch: ui.chunkers[i], verses: ui.chunkers[i].container, pad: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) };
  });
  // Only a few chunks are in the page, so the text block is held to the width of the book's widest
  // line; otherwise it would shift sideways as wider lines scroll in
  const widestAt = (pn, size) => Math.max(0, ...(model.get(pn) ?? []).map(({ k, b }) => k * size + b));
  const apply = (size) => {
    ui.root.style.setProperty('--reading-font-size', `${size.toFixed(3)}rem`);
    ui.root.style.setProperty('--reading-trans-font-size', `${(size * 0.86).toFixed(3)}rem`);
    for (const c of checks) c.verses.style.minWidth = `${Math.ceil(widestAt(c.pn, size))}px`;
  };
  const fits = () => checks.every((c) => c.verses.offsetWidth <= c.pn.clientWidth - c.pad + 1);

  // Every size change relays out the whole book, so the size is worked out rather than searched for,
  // from widths measured once per text and font (see measureFitModel)
  const model = tab.fitModel ??= new Map();
  const missing = checks.filter((c) => !model.has(c.pn));
  if (missing.length) {
    measureFitModel(missing).forEach((lines, pn) => model.set(pn, lines));
    tab.fitSize = null;
  }
  let size = max;
  for (const c of checks) {
    const room = c.pn.clientWidth - c.pad + 1;
    for (const { k, b } of model.get(c.pn)) if (k > 0) size = Math.min(size, (room - b) / k);
  }
  if (size < max) size = Math.floor(size * FIT_STEP + 1e-9) / FIT_STEP;
  size = clamp(size, min, max);
  const changed = tab.fitSize == null || Math.abs(size - tab.fitSize) >= 0.0005;
  if (!changed && (!verify || tab.fitVerified)) return;   // unchanged: no relayout
  if (changed) {
    tab.fitSize = size;
    tab.fitVerified = false;
    apply(size);
  }
  if (!verify) return;
  tab.fitVerified = true;
  if (size === min || fits()) return;
  // Safety net in case the estimate is off (a font still loading, say): search below it as before
  let lo = min, hi = size;
  for (let i = 0; i < 7; i++) {
    const mid = (lo + hi) / 2;
    apply(mid);
    if (fits()) lo = mid; else hi = mid;
  }
  tab.fitSize = lo;
  apply(lo);
}

export function scheduleFit(tab, verify = true) {
  tab.fitVerify ||= verify;
  if (tab.fitRaf) return;
  tab.fitRaf = requestAnimationFrame(() => {
    const v = tab.fitVerify;
    tab.fitRaf = 0;
    tab.fitVerify = false;
    fitReader(tab, v);
    syncLayout(tab);
  });
}

/* remeasure: the font or spacing changed, so the widths measured for each text no longer hold */
export function fitAll(remeasure = false) {
  state.tabs.forEach((t) => {
    if (!isText(t)) return;
    if (remeasure) t.fitModel = null;
    scheduleFit(t);
  });
}

export function initFit() {
  // A web font arriving after the text was measured changes its width
  document.fonts?.addEventListener('loadingdone', () => fitAll(true));
}
