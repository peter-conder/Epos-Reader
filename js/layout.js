import { ROMANS } from './data.js';
import { $, el, root } from './dom.js';
import { activeTab, groupOf, isText, partnerOf, shared, state, workOf } from './state.js';
import { growDur, playEnter, playPop } from './motion.js';
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
  el.viewEmpty.hidden = hasTabs || settings;
  el.viewSettings.hidden = !settings;
  el.panes.hidden = !showPanes;

  const shown = showPanes ? groupOf(tab) : [];
  el.panes.dataset.count = shown.length;
  // A pane that joins one already on screen grows in from nothing
  const joined = shown.length === 2 ? shown.filter((t) => !lastShown.includes(t.id)) : [];
  const animateJoin = joined.length === 1 && lastShown.length > 0;
  for (const t of state.tabs) {
    const on = shown.includes(t);
    t.view.hidden = !on;
    t.view.classList.toggle('is-active', on && shown.length > 1 && t.id === state.activeId);
    if (on) t.view.style.order = shown.indexOf(t) * 2;
  }
  if (animateJoin) { growDur(420); joined[0].view.style.flex = '0 1 0'; void el.panes.offsetWidth; }
  shown.forEach((t, i) => {
    t.view.style.flex = shown.length > 1 ? `${i === 0 ? state.pairPct : 100 - state.pairPct} 1 0` : '100 1 0';
  });
  if (animateJoin) playEnter(joined[0].view, shown.indexOf(joined[0]) === 0 ? -1 : 1);
  shown.forEach((t) => {
    if (!t.fresh) return;
    t.fresh = false;
    if (!(animateJoin && t === joined[0])) playPop(t.view);
  });
  lastShown = shown.map((t) => t.id);
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

/* Segmented book bar in the top bar (for the active text tab) */
export function renderSegments() {
  const tab = activeTab();
  if (!isText(tab)) return;
  el.segments.innerHTML = ROMANS.slice(0, workOf(tab).bookCount).map((r) => {
    const on = r === tab.book;
    return `<button class="segment${on ? ' active' : ''}" data-book="${r}" aria-label="Book ${r}"${on ? ' aria-current="true"' : ''}>${on ? r : ''}</button>`;
  }).join('');
}

export function setBook(roman) {
  const tab = activeTab();
  if (!isText(tab) || tab.book === roman) return;

  // Ripple neighbours away from the newly selected segment.
  const target = ROMANS.indexOf(roman);
  const segs = [...el.segments.children];
  segs.forEach((s) => s.classList.remove('ripple-left', 'ripple-right'));
  void el.segments.offsetWidth; // restart animations on rapid clicks
  segs.forEach((s, i) => {
    const on = i === target;
    if (!on) s.classList.add(i < target ? 'ripple-left' : 'ripple-right');
    s.classList.toggle('active', on);
    s.textContent = on ? roman : '';
    s.toggleAttribute('aria-current', on);
  });

  tab.book = roman;
  tab.ui.paneOriginal.scrollTop = 0;
  renderPassage(tab);
  setBookTitles(tab);
  renderTabs();
  refreshNoteMarks([tab]);
  setView('reader');
}

export function initLayout() {
  $('toast-undo').addEventListener('click', () => {
    const snap = pendingUndo;
    hideToast();
    if (snap) undoClose(snap);
  });
  new ResizeObserver(alignProgress).observe(el.main);
}
