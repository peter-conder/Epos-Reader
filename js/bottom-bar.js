import { RANGE_DASH, citation } from './data.js';
import { clamp, el, root } from './dom.js';
import { activeTab, isNotebook, isText, markUsed, readingTabs, shared, state } from './state.js';
import { visibleLines } from './chunks.js';
import { countLabel } from './notes.js';
import { activateTab } from './tabs.js';
import { renderAll } from './layout.js';
import { isMobileTier, onTierChange, tier } from './viewport.js';
import { closeChapterList, endPeekChapterList, openChapterList, peekChapterList } from './chapters.js';
import { renderReader } from './reader.js';
import { renderNotebook } from './notes.js';
import { closeTabGrid } from './tab-grid.js';
import { syncLangButton } from './english.js';
import { openFormatSheet } from './format-sheet.js';
import { syncRibbon } from './mobile-bookmarks.js';
import { prefersReducedMotion } from './motion.js';

/* ==========================================================
   BOTTOM BAR (phones and tablets, in place of the sidebar)
   Three pieces: a Format text button on the left; in the middle the EN chip and a pill naming the open tab
   ("Aen. I / Lines 34–58"), with a thin progress line along its top; on the right a button with the number
   of open tabs, which opens the tab grid. Swiping the pill sideways drags the neighbouring tab's pill in,
   like Safari's address bar; let go past a third of the way (or flick) and that tab opens.
   The bar and the floating menu button fade away while you read a text: when you scroll down, or after
   IDLE_MS without a touch. They come back when you scroll up, reach either end, or tap the page.
   ========================================================== */
const COMMIT = 0.3;        // share of the pill's width a drag must pass to switch tabs…
const FLICK = 0.45;        // …or this fast (px per ms) and at least FLICK_MIN px
const FLICK_MIN = 16;
const EDGE_GIVE = 0.3;     // past the first or last tab the pill moves this much of the drag
const AXIS_SLOP = 8;       // px before a drag counts as sideways or not
const SETTLE_MS = 300;
const SETTLED = SETTLE_MS + 50;   // ms before the pages are put back: a timer can fire a frame or two before the slide ends
const PAGE_GAP = 16;       // px between two text pages sliding side by side
const HIDE_AFTER = 24;     // px of scrolling one way before the bars hide or return
const READ_AFTER = 40;     // px of scrolling in a tab before it counts as used (see byRecent in state.js)
const IDLE_MS = 3000;      // no touch or scroll for this long while reading and the bars fade away


/* What the pill says for a tab */
const showingEnglish = (tab) => tab.lang === 'en' && tier() === 'compact';

function labelFor(tab) {
  if (isText(tab)) {
    const lines = visibleLines(tab.ui?.chunkers?.[showingEnglish(tab) ? 1 : 0]);
    return {
      title: citation(tab.work, tab.book, '', { short: true }),
      sub: lines ? `Lines ${lines[0]}${lines[1] !== lines[0] ? RANGE_DASH + lines[1] : ''}` : ''
    };
  }
  if (isNotebook(tab)) return { title: 'Notebook', sub: countLabel() };
  return { title: 'Home', sub: 'Choose a Work' };
}

const NEW_SLOT = { new: true };   // past the last tab: swiping on opens the chapter list
const slotHtml = (tab) => {
  if (!tab) return '<div class="bb-slot" aria-hidden="true"></div>';
  if (tab === NEW_SLOT) return '<div class="bb-slot bb-slot-new" aria-hidden="true"><span class="bb-title">New Book</span></div>';
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
  const order = readingTabs();
  const i = order.indexOf(tab);
  return [order[i - 1] ?? null, order[i + 1] ?? NEW_SLOT];
};

/* Whole bar: the three pills (previous, open, next), the tab count and the progress line */
export function renderBottomBar() {
  syncRibbon();
  const tab = activeTab();
  if (!tab) return;
  const [prev, next] = neighbours(tab);
  el.bbTrack.style.transition = 'none';
  el.bbTrack.style.transform = '';
  el.bbTrack.innerHTML = slotHtml(prev) + slotHtml(tab) + slotHtml(next);
  const count = readingTabs().length;
  el.bbCount.textContent = String(count);
  syncLangButton();
  el.tabsBtn.setAttribute('aria-label', `Show all tabs (${count} open)`);
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
  syncRibbon();
}

/* ---------- Hiding while reading ---------- */
const setChromeHidden = (on) => {
  root.classList.toggle('chrome-hidden', on);
  if (!on) armIdle();
};
let lastY = 0, run = 0, read = 0, lastPane = null;

/* The bars only step away while a text is being read: not over the Notebook or Home, and never while
   something is open on top of the text (a sheet, the word card or its note, the tab grid, the chapter list,
   the menu or the line menu) */
const OVERLAYS = ['sheet-open', 'card-open', 'note-pinned', 'grid-open', 'chapters-open', 'page-open'];
function canHide() {
  if (!isMobileTier() || state.view !== 'reader' || !isText(activeTab())) return false;
  if (OVERLAYS.some((c) => root.classList.contains(c))) return false;
  return !document.querySelector('#drawer.open, #line-menu.open');
}

/* Fading after a while without a touch: any touch, key or scroll starts the wait again, and nothing fades
   while a finger is still down */
let idleTimer = 0, touching = 0;
function armIdle() {
  clearTimeout(idleTimer);
  if (!isMobileTier()) return;
  idleTimer = setTimeout(() => { if (!touching && canHide()) root.classList.add('chrome-hidden'); }, IDLE_MS);
}
function bindIdle() {
  addEventListener('pointerdown', () => { touching++; clearTimeout(idleTimer); }, { capture: true, passive: true });
  const up = () => { touching = Math.max(0, touching - 1); armIdle(); };
  addEventListener('pointerup', up, { capture: true, passive: true });
  addEventListener('pointercancel', up, { capture: true, passive: true });
  addEventListener('keydown', armIdle, { capture: true, passive: true });
  addEventListener('wheel', armIdle, { capture: true, passive: true });
  // A reader scrolled by momentum after the finger lifts: wait from where it comes to rest
  addEventListener('scroll', (e) => { if (e.target instanceof Element && e.target.closest('.pane')) armIdle(); }, { capture: true, passive: true });
  armIdle();
}

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
  if (tab !== readingTabs()[0] && (read += Math.abs(dy)) > READ_AFTER) { markUsed(tab); renderBottomBar(); }
  if (Math.sign(dy) !== Math.sign(run)) run = 0;
  run += dy;
  const atEnd = y <= 0 || y + pane.clientHeight >= pane.scrollHeight - 2;
  if (atEnd || run < -HIDE_AFTER) setChromeHidden(false);
  else if (run > HIDE_AFTER && canHide()) setChromeHidden(true);
}

/* ---------- Swiping between tabs ---------- */

/* The pages that move with a swipe: the open tab's, and its neighbours' either side, shown beside it.
   Each page is moved by translateX; `at` is where the open page is, in px (negative: moved left). */
function startPeek(tab, near) {
  if (prefersReducedMotion()) return null;   // with Reduce Motion the switch stays instant
  const W = el.panes.clientWidth;
  const pages = [];   // { view, side }: side -1 left of the open page, 1 right of it, 0 the open page
  const add = (view, side) => {
    view.style.transition = 'none';
    pages.push({ view, side });
  };
  add(tab.view, 0);
  near.forEach((n, i) => {
    const side = i === 0 ? -1 : 1;
    if (!n) return;
    if (n === NEW_SLOT) {
      const list = side === 1 && peekChapterList();
      if (list) add(list, side);
      return;
    }
    // A tab's page joins the open one in the panes, laid over it and pushed off to its side
    n.view.hidden = false;
    n.view.classList.add('peeking');
    n.fresh = false;   // it slides in, so it doesn't also pop in when it opens
    if (isText(n)) renderReader(n);
    else if (isNotebook(n) && shared.notebookDirty) renderNotebook();
    add(n.view, side);
  });
  const peek = {
    W, pages,
    move(at, ms = 0) {
      for (const p of pages) {
        p.view.style.transition = ms ? `transform ${ms}ms cubic-bezier(0.2, 0, 0, 1)` : 'none';
        p.view.style.transform = `translateX(${at + p.side * (W + PAGE_GAP)}px)`;
      }
    },
    /* Puts every page back as the layout has it; `keep` is the page that stays on screen (its tab is opened next) */
    end(keep) {
      for (const p of pages) {
        // Straight there: the panes' transform transition mustn't pick up whatever is left of the slide
        p.view.style.transition = 'none';
        p.view.style.transform = '';
        void p.view.offsetWidth;
        p.view.style.transition = '';
        if (p.view === el.chapterList) { if (keep !== el.chapterList) endPeekChapterList(); continue; }
        p.view.classList.remove('peeking');
        if (p.side !== 0 && p.view !== keep) p.view.hidden = true;
      }
    }
  };
  peek.move(0);
  return peek;
}

function bindSwipe() {
  const pill = el.bbPill, track = el.bbTrack;
  let g = null;   // the drag in progress
  let settleTimer = 0, finishPending = null;

  const flushSettle = () => {
    if (!settleTimer) return;
    clearTimeout(settleTimer);
    settleTimer = 0;
    const fn = finishPending;
    finishPending = null;
    fn?.();
  };

  const place = (dx, animate) => {
    track.style.transition = animate ? `transform ${SETTLE_MS}ms cubic-bezier(0.2, 0, 0, 1)` : 'none';
    track.style.transform = `translateX(${dx}px)`;
  };
  // The pages move the same share of their width as the pill's labels do of theirs
  const pageAt = (d) => (d.dx / d.w) * (d.peek.W + PAGE_GAP);

  pill.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || g) return;
    flushSettle();
    const tab = activeTab();
    if (!tab) return;
    g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, axis: null, w: pill.clientWidth,
      tab, near: neighbours(tab), samples: [[performance.now(), e.clientX]], peek: null };
    pill.setPointerCapture(e.pointerId);
  });

  pill.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (!g.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_SLOP) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (g.axis === 'x') g.peek = startPeek(g.tab, g.near);
    }
    if (g.axis !== 'x') return;
    const to = dx > 0 ? g.near[0] : g.near[1];
    g.dx = to ? clamp(dx, -g.w, g.w) : dx * EDGE_GIVE;   // nothing that way: the pill only gives a little
    g.samples.push([performance.now(), e.clientX]);
    if (g.samples.length > 5) g.samples.shift();
    place(g.dx, false);
    g.peek?.move(pageAt(g));
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
    if (!go) {
      place(0, !prefersReducedMotion());
      d.peek?.move(0, SETTLE_MS);
      if (d.peek) {
        finishPending = () => { if (activeTab() === d.tab) d.peek.end(null); };
        settleTimer = setTimeout(flushSettle, SETTLED);
      }
      return;
    }
    if (prefersReducedMotion()) {
      place(0, false);
      if (to === NEW_SLOT) openChapterList();
      else activateTab(to.id, { promote: false });
      return;
    }
    const dir = Math.sign(d.dx);
    place(dir * d.w, true);
    // The pages carry on the way the finger went: the open one leaves on that side, its neighbour takes its place
    d.peek?.move(dir * (d.peek.W + PAGE_GAP), SETTLE_MS);
    // The new tab opens once its pill and page have slid into place (activating it redraws the bar, centred).
    // A swipe is only a peek: the order stays as it is until the tab is read in.
    finishPending = () => {
      if (activeTab() !== d.tab) { d.peek?.end(null); return; }
      if (to === NEW_SLOT) { d.peek?.end(el.chapterList); place(0, false); openChapterList(); }
      else { d.peek?.end(to.view); activateTab(to.id, { promote: false }); }
    };
    settleTimer = setTimeout(flushSettle, SETTLED);
  };
  pill.addEventListener('pointerup', (e) => end(e, false));
  pill.addEventListener('pointercancel', (e) => end(e, true));
}

export function initBottomBar() {
  bindSwipe();
  bindIdle();
  el.formatBtn.addEventListener('click', openFormatSheet);
  el.notebookPane.addEventListener('scroll', () => { const t = activeTab(); if (isNotebook(t)) bottomBarScroll(t); }, { passive: true });
  // A tap on the page (not on something that does its own thing) brings the bars back
  el.main.addEventListener('click', (e) => {
    if (root.classList.contains('chrome-hidden') && !e.target.closest('.word, button, a, input, textarea, [role="button"]')) setChromeHidden(false);
  });
  onTierChange(() => {
    setChromeHidden(false);
    closeTabGrid({ instant: true });
    closeChapterList({ instant: true });
    renderAll();   // one pane at a time below desktop, both of a split pair above it
  });
}

/* A different tab, or a different book: the bars come back so you can see where you are */
export function showChrome() {
  setChromeHidden(false);
  lastPane = null;
  read = 0;
}
