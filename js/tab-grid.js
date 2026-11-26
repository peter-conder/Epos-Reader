import { WORKS, bookTitle } from './data.js';
import { clamp, el, esc, icon } from './dom.js';
import { readingTabs, isNotebook, isText, state, workOf } from './state.js';
import { activateTab, closeTab } from './tabs.js';
import { anchorIndex } from './chunks.js';
import { countLabel } from './notes.js';
import { openChapterList } from './chapters.js';
import { hideWordCard } from './word-card.js';
import { prefersReducedMotion } from './motion.js';

/* ==========================================================
   TAB GRID (phones and tablets): every open tab as a card, most recently used first, opened and closed
   with the tab button on the bottom bar. A card names its tab, the line you were at and the first few
   lines from there. Tap a card to open it; close it with its ✕ or by swiping it sideways (the "Tab closed
   · Undo" toast appears as usual). "+" opens the chapter list.
   ========================================================== */
const SNIPPET_LINES = 3;
const FLING = 0.35;   // share of a card's width a sideways swipe must pass to close it
const AXIS_SLOP = 8;
const CLOSE_MS = 200;

let closeTimer = 0, openTimer = 0;

export const tabGridOpen = () => !el.tabGrid.hidden && !el.tabGrid.classList.contains('closing');

/* Where a text tab is: the line at the top of its pane and the lines from there */
function readingSpot(tab) {
  const ch = tab.ui?.chunkers?.[0];
  const i = anchorIndex(ch);
  const n = ch?.lineNums?.[i] ?? 1;
  const data = tab.bookData;
  const lines = data
    ? data.lines.slice(i, i + SNIPPET_LINES).map((l) => l.w.map((w) => w.f).join(' '))
    : (WORKS[tab.work]?.lines ?? []).slice(i, i + SNIPPET_LINES);
  return { line: n, lines };
}

function cardHtml(tab) {
  const active = tab.id === state.activeId;
  let title, meta, body, kind = '';
  if (isText(tab)) {
    const spot = readingSpot(tab);
    title = bookTitle(tab.work, tab.book);
    meta = `Line ${spot.line}`;
    body = spot.lines.map((l) => `<span>${esc(l)}</span>`).join('');
  } else if (isNotebook(tab)) {
    kind = ' tg-notebook';
    title = 'Notebook';
    meta = countLabel();
    body = `${icon('notebook')}`;
  } else {
    kind = ' tg-blank';
    title = 'New Tab';
    meta = 'Choose a work';
    body = `${icon('plus')}`;
  }
  return `<li class="tg-card${kind}${active ? ' is-active' : ''}" data-tab-id="${tab.id}">
    <button class="tg-open" aria-label="${esc(`Open ${title}`)}"${active ? ' aria-current="true"' : ''}>
      <span class="tg-head"><span class="tg-title">${esc(title)}</span><span class="tg-meta">${esc(meta)}</span></span>
      <span class="tg-body">${body}</span>
    </button>
    <button class="tg-close" aria-label="${esc(`Close ${title}`)}">${icon('close')}</button>
  </li>`;
}

export function renderTabGrid() {
  if (!tabGridOpen()) return;
  const tabs = readingTabs();   // the Notebook is a page on phones and tablets, not a tab
  el.tgCount.textContent = `${tabs.length} ${tabs.length === 1 ? 'Tab' : 'Tabs'}`;
  el.tgList.innerHTML = tabs.map(cardHtml).join('');
}

export function openTabGrid() {
  clearTimeout(closeTimer);
  closeTimer = 0;
  el.tabGrid.classList.remove('closing');
  hideWordCard();
  el.tabGrid.hidden = false;
  el.tabGrid.classList.add('opening');
  clearTimeout(openTimer);
  openTimer = setTimeout(() => el.tabGrid.classList.remove('opening'), 360);
  document.documentElement.classList.add('grid-open');
  el.tabsBtn.setAttribute('aria-expanded', 'true');
  renderTabGrid();
  el.tgList.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' });
}

export function closeTabGrid({ instant = false } = {}) {
  if (!tabGridOpen()) return;
  document.documentElement.classList.remove('grid-open');
  el.tabsBtn.setAttribute('aria-expanded', 'false');
  el.tabGrid.classList.remove('opening');
  if (instant || prefersReducedMotion()) {
    clearTimeout(closeTimer);
    closeTimer = 0;
    el.tabGrid.classList.remove('closing');
    el.tabGrid.hidden = true;
    return;
  }
  el.tabGrid.classList.add('closing');
  closeTimer = setTimeout(() => {
    closeTimer = 0;
    el.tabGrid.classList.remove('closing');
    el.tabGrid.hidden = true;
  }, CLOSE_MS);
}

export const toggleTabGrid = () => (tabGridOpen() ? closeTabGrid() : openTabGrid());

/* A card slides out sideways and the tab closes */
function flingClose(card, dir) {
  if (prefersReducedMotion()) { closeTab(card.dataset.tabId, { skipExit: true }); return; }
  card.style.transition = 'transform 200ms var(--ease-emphasized), opacity 200ms ease';
  card.style.transform = `translateX(${dir * 110}%)`;
  card.style.opacity = '0';
  setTimeout(() => closeTab(card.dataset.tabId, { skipExit: true }), 200);
}

function bindCardSwipe() {
  let g = null;
  el.tgList.addEventListener('pointerdown', (e) => {
    const card = e.target.closest('.tg-card');
    if (!card || e.button !== 0 || g || e.target.closest('.tg-close')) return;
    g = { id: e.pointerId, card, x0: e.clientX, y0: e.clientY, dx: 0, axis: null, w: card.offsetWidth };
  });
  el.tgList.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (!g.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_SLOP) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (g.axis === 'x') g.card.setPointerCapture(e.pointerId);
    }
    if (g.axis !== 'x') return;
    g.dx = dx;
    g.card.style.transition = 'none';
    g.card.style.transform = `translateX(${dx}px)`;
    g.card.style.opacity = String(clamp(1 - Math.abs(dx) / (g.w * 1.2), 0.2, 1));
  });
  const end = (e) => {
    if (!g || e.pointerId !== g.id) return;
    const d = g;
    g = null;
    if (d.axis !== 'x') return;
    d.card.dataset.swiped = '1';   // the click that ends the drag doesn't open it
    if (Math.abs(d.dx) > d.w * FLING) { flingClose(d.card, Math.sign(d.dx)); return; }
    d.card.style.transition = 'transform 220ms var(--ease-spring), opacity 220ms ease';
    d.card.style.transform = '';
    d.card.style.opacity = '';
  };
  el.tgList.addEventListener('pointerup', end);
  el.tgList.addEventListener('pointercancel', end);
}

export function initTabGrid() {
  el.tabsBtn.setAttribute('aria-controls', 'tab-grid');
  el.tabsBtn.setAttribute('aria-expanded', 'false');
  el.tabsBtn.addEventListener('click', toggleTabGrid);
  el.tgDone.addEventListener('click', () => closeTabGrid());
  el.tgNew.addEventListener('click', () => openChapterList());
  el.tgNew.insertAdjacentHTML('afterbegin', icon('plus'));
  el.tgList.addEventListener('click', (e) => {
    const card = e.target.closest('.tg-card');
    if (!card) return;
    if (card.dataset.swiped) { delete card.dataset.swiped; return; }
    if (e.target.closest('.tg-close')) { flingClose(card, 1); return; }
    closeTabGrid();
    activateTab(card.dataset.tabId);
  });
  bindCardSwipe();
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.chapterList.hidden) closeTabGrid(); });
}

