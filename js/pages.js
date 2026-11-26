import { el, root } from './dom.js';
import { activeTab, isNotebook, readingTabs, state } from './state.js';
import { activateTab, closeTab } from './tabs.js';
import { addNewTab } from './home.js';
import { setView } from './layout.js';
import { chapterListOpen, closeChapterList } from './chapters.js';
import { isMobileTier, onTierChange } from './viewport.js';
import { prefersReducedMotion } from './motion.js';

/* ==========================================================
   PAGES (phones and tablets)
   Settings and the Notebook are pages you visit rather than tabs you read: they cover the text with no menu
   button, bottom bar, Bookmark ribbon or dots, and a back button where the menu button was returns to the tab
   you were reading. The Notebook stays a tab on desktop; on a phone it is left out of the tab grid and the
   swipe order (see readingTabs in state.js). Opening it there makes a Notebook tab only for as long as the page
   is open (pageOnly), so it never turns up later as a stray tab.
   A swipe from the left edge goes back, as on iOS: the page follows the finger with the text you came from
   sliding in, dimmed, underneath. The chapter list closes the same way.
   ========================================================== */
const EDGE = 24;          // px from the left edge where a back swipe can start
const COMMIT = 1 / 3;     // share of the width a swipe must pass to go back…
const FLICK = 0.5;        // …or this fast (px per ms) and at least FLICK_MIN px
const FLICK_MIN = 24;
const AXIS_SLOP = 8;
const SETTLE_MS = 280;
const UNDER_SHIFT = 0.3;  // the page underneath starts this share of the width to the left

const onSettings = () => state.view === 'settings';
const onNotebook = () => state.view !== 'settings' && isNotebook(activeTab());
export const pageOpen = () => isMobileTier() && (onSettings() || onNotebook());

/* Called from renderAll: the page state on the root, and a page-only Notebook tab tidied away once left */
let lastActive = null;
export function syncPages() {
  const open = pageOpen();
  root.classList.toggle('page-open', open);
  el.pageBackBtn.hidden = !open;
  const left = lastActive;
  lastActive = activeTab();
  if (left && left !== lastActive && left.pageOnly && state.tabs.includes(left)) {
    queueMicrotask(() => { if (activeTab() !== left && state.tabs.includes(left)) closeTab(left.id, { silent: true, skipExit: true }); });
  }
}

/* Where back goes from the Notebook: the tab read most recently, or a New Tab if there is none */
const backTab = () => readingTabs()[0] ?? null;

export function goBack({ instant = false } = {}) {
  if (chapterListOpen()) { closeChapterList({ instant }); return; }
  if (onSettings()) { setView('reader'); return; }
  if (onNotebook()) {
    const to = backTab();
    if (to) activateTab(to.id, { promote: false });
    else addNewTab();
  }
}

/* ---- Swipe from the left edge ---- */

/* z-index of the page being swiped away, above the view sliding in under it */
const Z_CHAPTER_LIST = '70';   // as .chapter-list in styles.css: it stays over the bottom bar during the swipe
const Z_PAGE = '40';           // the Notebook or Settings page

/* The page a back swipe would move, and the view that would show underneath */
function swipeTarget() {
  if (!isMobileTier()) return null;
  if (chapterListOpen()) {
    return { page: el.chapterList, under: !el.tabGrid.hidden ? el.tabGrid : activeTab()?.view ?? null, z: Z_CHAPTER_LIST };
  }
  if (onSettings()) return { page: el.viewSettings, under: activeTab()?.view ?? null, panes: true, z: Z_PAGE };
  if (onNotebook()) return { page: el.viewNotebook, under: backTab()?.view ?? null, z: Z_PAGE };
  return null;
}

/* Lays the view underneath out beside the page for the length of the swipe; returns how to put it all back */
function beginSwipe(t) {
  const undo = [];
  const set = (node, props) => {
    const was = {};
    for (const k of Object.keys(props)) was[k] = node.style[k];
    Object.assign(node.style, props);
    undo.push(() => Object.assign(node.style, was));
  };
  if (t.panes && el.panes.hidden) { el.panes.hidden = false; undo.push(() => { el.panes.hidden = true; }); }
  if (t.under?.hidden) {
    t.under.hidden = false;
    t.under.classList.add('peeking');
    undo.push(() => { t.under.hidden = true; t.under.classList.remove('peeking'); });
  }
  if (t.page === el.viewSettings) set(t.page, { position: 'absolute', inset: '0', background: 'var(--bg)' });
  set(t.page, { zIndex: t.z, boxShadow: '-12px 0 32px rgba(0, 0, 0, 0.18)', transition: 'none' });
  if (t.under) set(t.under, { transition: 'none' });
  return () => {
    // Straight back: the panes' transform transition mustn't play on the way
    for (const n of [t.page, t.under]) if (n) { n.style.transition = 'none'; n.style.transform = ''; n.style.filter = ''; }
    void t.page.offsetWidth;
    undo.reverse().forEach((f) => f());
  };
}

function bindEdgeSwipe() {
  let g = null;
  const W = () => innerWidth;
  const place = (dx, ms = 0) => {
    const p = Math.max(0, dx) / W();
    const ease = ms ? `${ms}ms cubic-bezier(0.2, 0, 0, 1)` : '';
    g.t.page.style.transition = ms ? `transform ${ease}` : 'none';
    g.t.page.style.transform = `translateX(${Math.max(0, dx)}px)`;
    if (g.t.under) {
      g.t.under.style.transition = ms ? `transform ${ease}, filter ${ease}` : 'none';
      g.t.under.style.transform = `translateX(${-(1 - p) * UNDER_SHIFT * W()}px)`;
      g.t.under.style.filter = `brightness(${0.75 + 0.25 * p})`;
    }
  };

  addEventListener('pointerdown', (e) => {
    if (g || e.button !== 0 || e.clientX > EDGE) return;
    const t = swipeTarget();
    if (!t) return;
    g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, axis: null, t, end: null, samples: [[performance.now(), e.clientX]] };
  }, { capture: true });

  addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (!g.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_SLOP) return;
      g.axis = dx > Math.abs(dy) ? 'x' : 'y';
      if (g.axis !== 'x') { g = null; return; }
      if (!prefersReducedMotion()) g.end = beginSwipe(g.t);
    }
    g.dx = dx;
    g.samples.push([performance.now(), e.clientX]);
    if (g.samples.length > 5) g.samples.shift();
    if (g.end) place(dx);
    e.preventDefault();
  }, { capture: true, passive: false });

  const finish = (e, cancelled) => {
    if (!g || e.pointerId !== g.id) return;
    const d = g;
    g = null;
    if (d.axis !== 'x') return;
    swallowClick = true;
    setTimeout(() => { swallowClick = false; }, 400);
    const [[t0, x0]] = d.samples, [t1, x1] = d.samples.at(-1);
    const v = t1 > t0 ? (x1 - x0) / (t1 - t0) : 0;
    const go = !cancelled && (d.dx > W() * COMMIT || (v > FLICK && d.dx > FLICK_MIN));
    if (!d.end) { if (go) goBack({ instant: true }); return; }   // Reduce Motion: no slide, just back
    g = d;   // place() reads the swipe's pages from g
    place(go ? W() : 0, SETTLE_MS);
    g = null;
    setTimeout(() => { d.end(); if (go) goBack({ instant: true }); }, SETTLE_MS);
  };
  addEventListener('pointerup', (e) => finish(e, false), { capture: true });
  addEventListener('pointercancel', (e) => finish(e, true), { capture: true });
  // A click that ends a swipe mustn't also land on whatever is under the finger
  addEventListener('click', (e) => { if (swallowClick) { swallowClick = false; e.stopPropagation(); e.preventDefault(); } }, { capture: true });
}
let swallowClick = false;

export function initPages() {
  el.pageBackBtn.addEventListener('click', () => goBack());
  bindEdgeSwipe();
  // On a desktop-wide window a page-only Notebook becomes an ordinary tab
  onTierChange(() => { if (!isMobileTier()) state.tabs.forEach((t) => { delete t.pageOnly; }); syncPages(); });
}
