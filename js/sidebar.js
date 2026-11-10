import { ROMANS, WORKS } from './data.js';
import { $, clamp, el, esc, icon } from './dom.js';
import { getTab, isNotebook, isText, shared, state, workOf } from './state.js';
import { closePopovers, renderAll, setOpen } from './layout.js';
import { renderReader } from './reader.js';
import { addNewTab } from './home.js';
import { countLabel, openNotebook } from './notes.js';

let hoverTimer = 0;       // tab hover card
let hoveredTabId = null;

/* ==========================================================
   TAB HOVER CARD
   ========================================================== */
const schedule = (fn, ms) => { clearTimeout(hoverTimer); hoverTimer = setTimeout(fn, ms); };
const pillAnchor = (pill) => pill.closest('.tab-group') ?? pill;

export function showHoverCard(pill) {
  const tab = getTab(pill.dataset.tabId);
  if (!tab || shared.dragging) return;
  hoveredTabId = tab.id;
  const text = isText(tab);
  el.hoverSwitch.hidden = !text;
  if (isNotebook(tab)) {
    el.hoverCite.textContent = 'Notebook';
    el.hoverDesc.textContent = countLabel();
  } else if (!text) {
    el.hoverCite.textContent = 'New Tab';
    el.hoverDesc.textContent = 'Choose a work to open';
  } else {
    const work = workOf(tab);
    el.hoverCite.textContent = `${work.title}.${ROMANS.indexOf(tab.book) + 1}.1`;
    el.hoverDesc.textContent = `${work.title} · Book ${tab.book}`;
  }

  const r = pillAnchor(pill).getBoundingClientRect();
  el.hoverCard.style.top = `${clamp(r.top - 2, 16, innerHeight - 120)}px`;
  el.hoverCard.style.left = `${r.right + 10}px`;
  el.hoverCard.classList.add('open');
}

export function hideHoverCard() {
  hoveredTabId = null;
  el.hoverCard.classList.remove('open');
}

/* Collapse the tab bar and its buttons into one round button (remembered between visits).
   This sits after the hover card code because it hides the card. */
const collapseBtn = $('btn-collapse-tabs');
const SIDEBAR_KEY = 'epos.sidebar.collapsed';
let bubbleTimer = 0;
/* Replays the tabs bubbling out of the button bar (the CSS does the motion; --i is each tab's turn) */
export function bubbleTabs() {
  [...el.tabList.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 8)));
  el.sidebar.classList.remove('bubbling');
  void el.sidebar.offsetWidth;   // restart the animation
  el.sidebar.classList.add('bubbling');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => el.sidebar.classList.remove('bubbling'), 1500);
}

export function setSidebarCollapsed(collapsed) {
  hideHoverCard();
  const opening = !collapsed && el.sidebar.classList.contains('collapsed');
  el.sidebar.classList.toggle('collapsed', collapsed);
  if (opening) bubbleTabs();
  else if (collapsed) el.sidebar.classList.remove('bubbling');
  const label = collapsed ? 'Expand tabs' : 'Collapse tabs';
  collapseBtn.dataset.tip = label;
  collapseBtn.setAttribute('aria-label', label);
  collapseBtn.setAttribute('aria-expanded', String(!collapsed));
  try { localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0'); } catch { /* storage unavailable */ }
}

/* ==========================================================
   SWITCH WORK PICKER: changes the work and book of one tab
   ========================================================== */

export function highlightWork(workKey) {
  for (const item of el.workList.children) item.classList.toggle('active', item.dataset.work === workKey);
}

export function showWorkList() {
  el.pickerTitle.textContent = 'Switch Tab Work';
  el.workList.hidden = false;
  el.bookPicker.hidden = true;
}

export function showBooks(workKey) {
  const work = WORKS[workKey];
  const current = getTab(state.pickerTabId)?.book ?? 'I';
  highlightWork(workKey);
  el.pickerTitle.textContent = `${work.title} Books`;
  el.booksGrid.dataset.work = workKey;
  el.booksGrid.innerHTML = ROMANS.slice(0, work.bookCount).map((r) =>
    `<button class="book-cell${r === current ? ' active' : ''}" data-book="${r}">${r}</button>`
  ).join('');
  el.workList.hidden = true;
  el.bookPicker.hidden = false;
}

export function openPicker(tabId, anchor) {
  state.pickerTabId = tabId;
  highlightWork(getTab(tabId)?.work);
  showWorkList();

  const r = anchor.getBoundingClientRect();
  el.picker.style.top = `${clamp(r.top - 20, 72, innerHeight - 380)}px`;
  el.picker.style.left = `${r.right + 14}px`;

  hideHoverCard();
  closePopovers(el.picker);
  setOpen(el.picker, true);
}

export function chooseBook(workKey, book) {
  setOpen(el.picker, false);
  const tab = getTab(state.pickerTabId);
  if (!tab) return;
  tab.work = workKey;
  tab.book = book;
  renderReader(tab);
  renderAll();
}

export function initSidebar() {
  el.workList.innerHTML = Object.entries(WORKS).map(([key, w]) => `
    <button class="work-item" data-work="${key}">
      <span>
        <span class="work-name">${esc(w.title)}</span>
        <span class="work-author">${esc(`${w.poet} · ${w.language} · ${w.bookCount} Books`)}</span>
      </span>
      ${icon('chevron-right')}
    </button>`).join('');

  el.workList.addEventListener('click', (e) => {
    const item = e.target.closest('.work-item');
    if (item) showBooks(item.dataset.work);
  });
  el.backBtn.addEventListener('click', showWorkList);
  el.booksGrid.addEventListener('click', (e) => {
    const cell = e.target.closest('.book-cell');
    if (cell) chooseBook(el.booksGrid.dataset.work, cell.dataset.book);
  });
  el.addTab.addEventListener('click', () => addNewTab());   // a new tab opens the home page
  el.addNotebook.addEventListener('click', openNotebook);

  el.tabList.addEventListener('mouseover', (e) => {
    const pill = e.target.closest('.tab');
    if (!pill?.dataset.tabId || pill === shared.hoveredPill || shared.dragging) return;
    shared.hoveredPill = pill;
    schedule(() => showHoverCard(pill), 120);
  });
  el.tabList.addEventListener('mouseout', (e) => {
    const pill = e.target.closest('.tab');
    if (!pill || pill.contains(e.relatedTarget)) return;
    shared.hoveredPill = null;
    schedule(hideHoverCard, 280);
  });
  el.hoverCard.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
  el.hoverCard.addEventListener('mouseleave', () => schedule(hideHoverCard, 220));

  el.hoverSwitch.addEventListener('click', () => {
    if (!hoveredTabId) return;
    const pill = el.tabList.querySelector(`.tab[data-tab-id="${hoveredTabId}"]`);
    if (pill) openPicker(hoveredTabId, pillAnchor(pill));
  });

  collapseBtn.addEventListener('click', () => setSidebarCollapsed(!el.sidebar.classList.contains('collapsed')));
  try { if (localStorage.getItem(SIDEBAR_KEY) === '1') setSidebarCollapsed(true); } catch { /* storage unavailable */ }
}
