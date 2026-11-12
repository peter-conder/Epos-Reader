import { ROMANS } from './data.js';
import { $, clamp, el, root } from './dom.js';
import { activeTab, groupOf, isText, partnerOf, shared, state, workOf } from './state.js';
import { beginSplitOpen, isMorphing, playPop, settleMorph } from './motion.js';
import { renderTabs, undoClose } from './tabs.js';
import { renderPassage, setBookTitles } from './reader.js';
import { closeNote, hideWordCard } from './word-card.js';
import { refreshNoteMarks, renderNotebook } from './notes.js';
import { syncSettingsChips } from './settings.js';

let lastShown = [];   // ids of the tabs that were on screen after the last render

/* ==========================================================
   TOAST: "Tab closed" with an Undo button for three seconds
   ========================================================== */
let toastTimer, pendingUndo = null;
export function hideToast() {
  clearTimeout(toastTimer);
  pendingUndo = null;
  el.toast.classList.remove('show');
}
export function showUndo(snap) {
  pendingUndo = snap;
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 3000);
}

/* ==========================================================
   POPOVERS (drawer, flyouts, picker)
   ========================================================== */
const TRIGGERS = new Map([[el.drawer, el.menuBtn], [el.flyout, el.textBtn], [el.popupsFlyout, el.popupsBtn]]);

export function setOpen(popover, open) {
  popover.classList.toggle('open', open);
  TRIGGERS.get(popover)?.setAttribute('aria-expanded', String(open));
}

export function closePopovers(except) {
  [el.picker, el.drawer, el.paletteMenu, el.flyout, el.popupsFlyout].forEach((p) => p !== except && setOpen(p, false));
  closeNote();
}

/* ==========================================================
   VIEWS: show the open tab, or the two tabs of a split
   ========================================================== */
export function renderView() {
  const hasTabs = state.tabs.length > 0;
  const tab = activeTab();
  const settings = state.view === 'settings';
  const showPanes = hasTabs && !settings;
  const shown = showPanes ? groupOf(tab) : [];
  const ids = shown.map((t) => t.id);
  if (ids.join() !== lastShown.join()) settleMorph();   // a different set of panes: any running open/close ends now
  // A pane that joins one already on screen slides in from its side while the other makes room
  const joined = shown.length === 2 ? shown.filter((t) => !lastShown.includes(t.id)) : [];
  const stay = joined.length === 1 && !el.panes.hidden ? shown.find((t) => t !== joined[0]) : null;
  const playOpen = stay && lastShown.includes(stay.id) ? beginSplitOpen(stay.view) : null;

  el.viewEmpty.hidden = hasTabs || settings;
  el.viewSettings.hidden = !settings;
  el.panes.hidden = !showPanes;
  el.panes.dataset.count = shown.length;
  for (const t of state.tabs) {
    const on = shown.includes(t);
    t.view.hidden = !on;
    t.view.classList.toggle('is-active', on && shown.length > 1 && t.id === state.activeId);
    if (on) t.view.style.order = shown.indexOf(t) * 2;
  }
  shown.forEach((t, i) => {
    const flex = shown.length > 1 ? `${i === 0 ? state.pairPct : 100 - state.pairPct} 1 0` : '100 1 0';
    t.view.dataset.flex = flex;                     // a pane being resized by an open/close gets it back at the end
    if (!isMorphing(t.view)) t.view.style.flex = flex;
  });
  if (playOpen) playOpen(joined[0].view, shown.indexOf(joined[0]) === 0 ? -1 : 1);
  shown.forEach((t) => {
    if (!t.fresh) return;
    t.fresh = false;
    if (!(playOpen && t === joined[0])) playPop(t.view);
  });
  lastShown = ids;
  el.progress.hidden = !hasTabs || !isText(tab);
  alignProgress();
}

/* The book bar sits right over the reading area: same centre, and as wide as the reading pane
   (a lone pane is as wide as the main area, up to --reader-max, and centred in it). Measured from the
   main area, so it also follows the sidebar while that opens and closes. It stays clear of the menu
   and name on the left, and of the spacer on the right, by shrinking evenly on both sides. */
export function alignProgress() {
  const bar = el.progress;
  if (bar.hidden) return;
  const main = el.main.getBoundingClientRect();
  const max = parseFloat(getComputedStyle(root).getPropertyValue('--reader-max')) || 860;
  const gap = 24;                                              // the top bar's own gap between its parts
  const cx = main.left + main.width / 2;
  const room = Math.min(cx - (el.topLeft.getBoundingClientRect().right + gap),
                        el.topRight.getBoundingClientRect().left - gap - cx);
  const half = Math.max(0, Math.min(max / 2, main.width / 2, room));
  bar.style.left = `${cx - half}px`;
  bar.style.width = `${half * 2}px`;
}

export function setView(view) {
  state.view = view;
  closePopovers();
  hideWordCard();
  renderView();
}

/* Toolbar reflects the active tab */
export function syncToolbar() {
  const tab = activeTab();
  const paired = !!partnerOf(tab);
  const on = !!(isText(tab) && tab.split) && !paired;
  el.splitBtn.classList.toggle('active', on);
  el.splitBtn.classList.toggle('disabled', paired);
  el.splitBtn.setAttribute('aria-pressed', String(on));
  el.splitBtn.setAttribute('aria-disabled', String(paired));
  el.splitBtn.dataset.tip = paired ? 'Unavailable in split view' : 'Parallel English';
}

/* The name in the top bar turns Greek while a Greek text is the open tab */
export function renderBrand() {
  const tab = activeTab();
  const greek = isText(tab) && workOf(tab).shortLanguage === 'Greek';
  el.brandTitle.textContent = greek ? '\u0395\u03C0\u03BF\u03C2' : 'Epos';
  el.brandTitle.lang = greek ? 'grc' : 'en';
}

export function renderAll() {
  renderView();
  if (shared.notebookDirty && !el.viewNotebook.hidden && !el.panes.hidden) renderNotebook();
  renderTabs();
  renderSegments();
  renderBrand();
  syncToolbar();
  const tab = activeTab();
  if (isText(tab)) syncSettingsChips(tab.work);
}

/* The active pill is ACTIVE_GROW times as wide as a resting one. Its extra width is taken from the pills on both of
   its sides, so it swells around its own centre; with the same flex-grow on every other pill, only the pill that
   was active would give room back and the new one would stretch toward it. Pills far from it hardly change. */
const ACTIVE_GROW = 1.6;
const MIN_SHARE = 0.92;   // the narrowest a resting pill gets, as a share of an even split of the room
function growSegments() {
  const segs = [...el.segments.children];
  const n = segs.length, k = segs.findIndex((s) => s.classList.contains('active'));
  if (k < 0) { segs.forEach((s) => { s.style.flexGrow = ''; }); return; }
  // Room left of the active pill, in resting-pill widths: what it had before it grew, less half of its growth.
  // Near an end there are too few pills on that side to give up half, so no pill is let shrink below MIN_SHARE of
  // an even share; the other side gives the rest. (The end pills themselves have only one side to take from.)
  const minW = MIN_SHARE * (n - ACTIVE_GROW) / Math.max(1, n - 1);
  const ideal = k + 0.5 - ACTIVE_GROW / 2;
  const left = k === 0 ? 0 : k === n - 1 ? n - ACTIVE_GROW
    : clamp(ideal, k * minW, n - ACTIVE_GROW - (n - 1 - k) * minW);
  const right = n - ACTIVE_GROW - left;
  segs.forEach((s, i) => {
    s.style.flexGrow = i === k ? ACTIVE_GROW : i < k ? left / k : right / (n - 1 - k);
  });
}

/* The click bounces (see .pop and .shove in styles.css): the new pill swells from its centre by a fixed POP_PX on
   each side, and every other pill is knocked away from it, the nearest ones most */
const POP_PX = 4;            // how far past each side the new pill swells; less than the room around it
const ACTIVE_MARGIN = 6;     // .segment.active's margin-inline
const SHOVE_PX = 7, SHOVE_FALLOFF = 0.85, SHOVE_MIN = 3;   // the nearest move 7px; even the farthest move 3px
function bounceSegments(segs, target) {
  const pill = segs[target];
  if (!pill) return;
  // The width the pill is growing to (it has only just started), so the swell is POP_PX whatever the bar's width
  const n = segs.length;
  const gap = parseFloat(getComputedStyle(el.segments).columnGap) || 0;
  const room = el.segments.clientWidth - gap * (n - 1) - 2 * ACTIVE_MARGIN;
  const finalWidth = (room * parseFloat(pill.style.flexGrow || ACTIVE_GROW)) / n;
  pill.style.setProperty('--pop', finalWidth > 0 ? (1 + (2 * POP_PX) / finalWidth).toFixed(4) : '1');
  segs.forEach((s, i) => {
    if (i === target) return;
    const dist = Math.abs(i - target);
    const d = Math.max(SHOVE_MIN, SHOVE_PX * SHOVE_FALLOFF ** (dist - 1));
    s.style.setProperty('--shove', `${(i < target ? -d : d).toFixed(2)}px`);
  });
  void el.segments.offsetWidth;   // restarts the bounces on rapid clicks
  segs.forEach((s, i) => s.classList.add(i === target ? 'pop' : 'shove'));
}

/* Segmented book bar in the top bar (for the active text tab) */
export function renderSegments() {
  const tab = activeTab();
  if (!isText(tab)) return;
  // Every pill keeps its numeral (hidden by CSS until it is active) so it can fade in and out with the pill's motion
  el.segments.innerHTML = ROMANS.slice(0, workOf(tab).bookCount).map((r) => {
    const on = r === tab.book;
    return `<button class="segment${on ? ' active' : ''}" data-book="${r}" aria-label="Book ${r}"${on ? ' aria-current="true"' : ''}>${r}</button>`;
  }).join('');
  growSegments();
}

let bookRender = 0;   // the frame request that builds the newly chosen book (see setBook)

export function setBook(roman) {
  const tab = activeTab();
  if (!isText(tab) || tab.book === roman) return;

  const target = ROMANS.indexOf(roman);
  const segs = [...el.segments.children];
  segs.forEach((s, i) => {
    const on = i === target;
    s.classList.remove('pop', 'shove');
    s.classList.toggle('active', on);
    s.toggleAttribute('aria-current', on);
  });
  growSegments();
  bounceSegments(segs, target);

  tab.book = roman;
  // Building the book is the heavy part. It waits two frames so the pill's first frames are painted and the click
  // answers at once; clicking again before then cancels this and builds only the latest book.
  cancelAnimationFrame(bookRender);
  bookRender = requestAnimationFrame(() => {
    bookRender = requestAnimationFrame(() => {
      // Another tab was opened meanwhile: activating it already rendered its own current book
      if (activeTab() !== tab || tab.book !== roman) return;
      tab.ui.paneOriginal.scrollTop = 0;
      renderPassage(tab);
      setBookTitles(tab);
      renderTabs();
      refreshNoteMarks([tab]);
      setView('reader');
    });
  });
}

export function initLayout() {
  $('toast-undo').addEventListener('click', () => {
    const snap = pendingUndo;
    hideToast();
    if (snap) undoClose(snap);
  });
  new ResizeObserver(alignProgress).observe(el.main);
}
