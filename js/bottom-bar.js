import { clamp, el, root } from './dom.js';
import { activeTab, byRecent, isNotebook, isText, markUsed, state, workOf } from './state.js';
import { visibleLines } from './chunks.js';
import { countLabel } from './notes.js';
import { activateTab } from './tabs.js';
import { renderAll } from './layout.js';
import { isMobileTier, onTierChange, tier } from './viewport.js';
import { closeChapterList, openChapterList } from './chapters.js';
import { closeTabGrid } from './tab-grid.js';
import { syncLangButton } from './english.js';

/* ==========================================================
   BOTTOM BAR (phones and tablets, in place of the sidebar)
   A pill naming the open tab ("Aeneid · Book I / Lines 34–58") with a thin progress line along the bar's top,
   and a button with the number of open tabs. Swiping the pill sideways drags the neighbouring tab's pill in,
   like Safari's address bar; let go past a third of the way (or flick) and that tab opens.
   The bar and the floating menu button hide while you scroll down through a text, and come back when you
   scroll up, reach either end, or tap the page.
   ========================================================== */
const COMMIT = 0.3;        // share of the pill's width a drag must pass to switch tabs…
const FLICK = 0.45;        // …or this fast (px per ms) and at least FLICK_MIN px
const FLICK_MIN = 16;
const EDGE_GIVE = 0.3;     // past the first or last tab the pill moves this much of the drag
const AXIS_SLOP = 8;       // px before a drag counts as sideways or not
const SETTLE_MS = 260;
const HIDE_AFTER = 24;     // px of scrolling one way before the bars hide or return
const READ_AFTER = 40;     // px of scrolling in a tab before it counts as used (see byRecent)

const RANGE_DASH = '–';

/* What the pill says for a tab */
const showingEnglish = (tab) => tab.lang === 'en' && tier() === 'compact';

function labelFor(tab) {
  if (isText(tab)) {
    const lines = visibleLines(tab.ui?.chunkers?.[showingEnglish(tab) ? 1 : 0]);
    return {
      title: `${workOf(tab).title.replace(/^The /, '')} · Book ${tab.book}`,
      sub: lines ? `Lines ${lines[0]}${lines[1] !== lines[0] ? RANGE_DASH + lines[1] : ''}` : ''
    };
  }
  if (isNotebook(tab)) return { title: 'Notebook', sub: countLabel() };
  return { title: 'New Tab', sub: 'Choose a work' };
}

const NEW_SLOT = { new: true };   // past the last tab: swiping on opens the chapter list
const slotHtml = (tab) => {
  if (!tab) return '<div class="bb-slot" aria-hidden="true"></div>';
  if (tab === NEW_SLOT) return '<div class="bb-slot bb-slot-new" aria-hidden="true"><span class="bb-title">New Chapter</span></div>';
  const { title, sub } = labelFor(tab);
  return `<div class="bb-slot"><span class="bb-title">${title}</span><span class="bb-sub">${sub}</span></div>`;
};

/* The scrolling element behind a tab, if it has one */
function scrollerOf(tab) {
  if (isText(tab)) return (showingEnglish(tab) ? tab.ui?.paneTranslation : tab.ui?.paneOriginal) ?? null;
  if (isNotebook(tab)) return el.notebookPane;
  return null;
}

/* The tabs either side of this one in the grid's order (most recent first, left to right) */
const neighbours = (tab) => {
  const order = byRecent();
  const i = order.indexOf(tab);
  return [order[i - 1] ?? null, order[i + 1] ?? NEW_SLOT];
};

/* Whole bar: the three pills (previous, open, next), the tab count and the progress line */
export function renderBottomBar() {
  const tab = activeTab();
  if (!tab) return;
  const [prev, next] = neighbours(tab);
  el.bbTrack.style.transition = 'none';
  el.bbTrack.style.transform = '';
  el.bbTrack.innerHTML = slotHtml(prev) + slotHtml(tab) + slotHtml(next);
  el.bbCount.textContent = String(state.tabs.length);
  syncLangButton();
  el.tabsBtn.setAttribute('aria-label', `Show all tabs (${state.tabs.length} open)`);
  updateProgress(tab);
}

function updateProgress(tab) {
  const pane = scrollerOf(tab);
  const max = pane ? pane.scrollHeight - pane.clientHeight : 0;
  el.bbProgress.style.transform = `scaleX(${max > 0 ? clamp(pane.scrollTop / max, 0, 1) : 0})`;
  el.bbProgress.parentElement.hidden = !pane;
}

/* The open tab's line range and progress, after its text has been laid out or moved */
export function refreshBottomBar(tab) {
  if (!isMobileTier() || tab !== activeTab()) return;
  const sub = el.bbTrack.children[1]?.querySelector('.bb-sub');
  if (sub) sub.textContent = labelFor(tab).sub;
  updateProgress(tab);
}

/* ---------- Hiding while reading ---------- */
const setChromeHidden = (on) => root.classList.toggle('chrome-hidden', on);
let lastY = 0, run = 0, read = 0, lastPane = null;

/* Called on every scroll of a tab's pane: refreshes the line range and progress, and hides or shows the bars */
export function bottomBarScroll(tab) {
  if (!isMobileTier() || tab !== activeTab()) return;
  const pane = scrollerOf(tab);
  if (!pane) return;
  refreshBottomBar(tab);

  const y = pane.scrollTop;
  const dy = pane === lastPane ? y - lastY : 0;
  lastPane = pane;
  lastY = y;
  if (!dy) return;
  // Reading on in a tab reached by a swipe makes it the most recent (it moves to the front of the grid)
  if (tab !== byRecent()[0] && (read += Math.abs(dy)) > READ_AFTER) { markUsed(tab); renderBottomBar(); }
  if (Math.sign(dy) !== Math.sign(run)) run = 0;
  run += dy;
  const atEnd = y <= 0 || y + pane.clientHeight >= pane.scrollHeight - 2;
  if (atEnd || run < -HIDE_AFTER) setChromeHidden(false);
  else if (run > HIDE_AFTER && isText(tab)) setChromeHidden(true);
}

/* ---------- Swiping between tabs ---------- */
function bindSwipe() {
  const pill = el.bbPill, track = el.bbTrack;
  let g = null;   // the drag in progress

  const place = (dx, animate) => {
    track.style.transition = animate ? `transform ${SETTLE_MS}ms cubic-bezier(0.2, 0, 0, 1)` : 'none';
    track.style.transform = `translateX(${dx}px)`;
  };

  pill.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || g) return;
    const tab = activeTab();
    if (!tab) return;
    g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, axis: null, w: pill.clientWidth,
      tab, near: neighbours(tab), samples: [[performance.now(), e.clientX]] };
    pill.setPointerCapture(e.pointerId);
  });

  pill.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (!g.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_SLOP) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (g.axis !== 'x') return;
    const to = dx > 0 ? g.near[0] : g.near[1];
    g.dx = to ? clamp(dx, -g.w, g.w) : dx * EDGE_GIVE;   // nothing that way: the pill only gives a little
    g.samples.push([performance.now(), e.clientX]);
    if (g.samples.length > 5) g.samples.shift();
    place(g.dx, false);
  });

  const end = (e, cancelled) => {
    if (!g || e.pointerId !== g.id) return;
    const d = g;
    g = null;
    if (d.axis !== 'x') return;
    const [[t0, x0]] = d.samples, [t1, x1] = d.samples.at(-1);
    const v = t1 > t0 ? (x1 - x0) / (t1 - t0) : 0;
    const to = d.dx > 0 ? d.near[0] : d.near[1];
    const go = !cancelled && to && (Math.abs(d.dx) > d.w * COMMIT || (Math.abs(v) > FLICK && Math.abs(d.dx) > FLICK_MIN && Math.sign(v) === Math.sign(d.dx)));
    if (!go) { place(0, true); return; }
    place(Math.sign(d.dx) * d.w, true);
    // The new tab opens once its pill has slid into place (activating it redraws the bar, centred). A swipe is
    // only a peek: the order stays as it is until the tab is read in.
    setTimeout(() => {
      if (activeTab() !== d.tab) return;
      if (to === NEW_SLOT) { place(0, false); openChapterList(); }
      else activateTab(to.id, { promote: false });
    }, SETTLE_MS);
  };
  pill.addEventListener('pointerup', (e) => end(e, false));
  pill.addEventListener('pointercancel', (e) => end(e, true));
}

export function initBottomBar() {
  bindSwipe();
  el.notebookPane.addEventListener('scroll', () => { const t = activeTab(); if (isNotebook(t)) bottomBarScroll(t); }, { passive: true });
  // A tap on the page (not on something that does its own thing) brings the bars back
  el.main.addEventListener('click', (e) => {
    if (root.classList.contains('chrome-hidden') && !e.target.closest('.word, button, a, input, textarea, [role="button"]')) setChromeHidden(false);
  });
  onTierChange(() => {
    setChromeHidden(false);
    closeTabGrid();
    closeChapterList();
    renderAll();   // one pane at a time below desktop, both of a split pair above it
  });
}

/* A different tab, or a different book: the bars come back so you can see where you are */
export function showChrome() {
  setChromeHidden(false);
  lastPane = null;
  read = 0;
}
