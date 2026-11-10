import { el } from './dom.js';
import { activeTab, getTab, groupOf, isText, partnerOf, shared, state } from './state.js';
import { playExit } from './motion.js';
import { renderAll } from './layout.js';
import { activateTab, newTextTab, pairTabs, renderTabs, unpair } from './tabs.js';
import { createReader } from './reader.js';
import { hideHoverCard } from './sidebar.js';

/* ==========================================================
   TAB DRAGGING
   The tab itself follows the cursor. Drop it to the right of a
   single tab in the sidebar, or on the right half of the open
   tab's content, to open the two side by side. A split holds two
   tabs only, so a tab that is already paired can't take a third.
   Dragging half of a pair away and dropping it elsewhere ends
   the split.
   ========================================================== */
const DRAG_THRESHOLD = 5;
let pendingDrag = null;
let tabDrag = null;

export function canSplitWith(target) {
  if (!target || !shared.dragging || target.id === shared.dragging.id) return false;
  const p = partnerOf(target);
  return !p || p.id === shared.dragging.id;
}

export function dropTargetAt(x, y) {
  const draggedPartnerId = partnerOf(getTab(shared.dragging.id))?.id;
  for (const tab of state.tabs) {
    if (tab.id === shared.dragging.id || tab.id === draggedPartnerId) continue;
    const node = el.tabList.querySelector(`.tab[data-tab-id="${tab.id}"]`);
    if (!node) continue;
    const b = (node.closest('.tab-group') ?? node).getBoundingClientRect();
    if (y >= b.top - 4 && y <= b.bottom + 4 && x >= b.left + b.width * 0.5 && x <= b.right + 90) return { tab, zone: 'tab' };
  }
  const open = activeTab();
  if (open && !el.panes.hidden) {
    const m = el.main.getBoundingClientRect();
    const inRight = x >= m.left + m.width * 0.5 && x <= m.right && y >= m.top && y <= m.bottom;
    if (inRight && open.id !== shared.dragging.id) return { tab: open, zone: 'main' };
    // Dragging the open tab itself onto the right of a single reader opens a new tab beside it
    if (inRight && isText(open) && !partnerOf(open)) return { tab: open, zone: 'main-new' };
  }
  return null;
}

export function removeDragListeners() {
  document.removeEventListener('pointermove', onTabDragMove);
  document.removeEventListener('pointerup', onTabDragEnd);
  document.removeEventListener('pointercancel', onTabDragCancel);
}

export function onTabDragMove(e) {
  if (!pendingDrag) return;
  if (!tabDrag) {
    if (Math.hypot(e.clientX - pendingDrag.x, e.clientY - pendingDrag.y) < DRAG_THRESHOLD) return;
    if (!startTabDrag()) { pendingDrag = null; removeDragListeners(); return; }
  }
  moveTabDrag(e);
}

export function startTabDrag() {
  const pill = el.tabList.querySelector(`.tab[data-tab-id="${pendingDrag.id}"]`);
  if (!pill) return false;
  const r = pill.getBoundingClientRect();
  // Where the pair sat before the drag. The sidebar re-renders as soon as the drag starts, and the
  // dashed ghost lands on a different side depending on which half is dragged, so "dropped back
  // where it started" has to be judged against this rect, not against the ghost.
  const home = (pill.closest('.tab-group') ?? pill).getBoundingClientRect();
  const clone = pill.cloneNode(true);
  clone.classList.add('tab-drag');
  clone.removeAttribute('data-tab-id');
  clone.removeAttribute('tabindex');
  Object.assign(clone.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  document.body.append(clone);

  tabDrag = { id: pendingDrag.id, clone, sx: pendingDrag.x, sy: pendingDrag.y, left: r.left, top: r.top, home,
    x: pendingDrag.x, y: pendingDrag.y, target: null, newTab: false, denied: false };
  shared.dragging = { id: pendingDrag.id, previewId: null };
  hideHoverCard();
  document.body.classList.add('dragging-tab');
  renderTabs();   // the dragged tab leaves a dashed ghost behind
  return true;
}

export function moveTabDrag(e) {
  const d = tabDrag;
  d.x = e.clientX;
  d.y = e.clientY;
  d.clone.style.transform = `translate(${e.clientX - d.sx}px, ${e.clientY - d.sy}px) scale(1.04)`;

  const hit = dropTargetAt(e.clientX, e.clientY);
  const isNew = hit?.zone === 'main-new';
  const ok = !!hit && (isNew || canSplitWith(hit.tab));
  const denied = !!hit && !ok && !partnerOf(getTab(d.id));
  d.target = ok && !isNew ? hit.tab : null;
  d.newTab = ok && isNew;

  const nextId = d.target?.id ?? null;
  if (nextId !== shared.dragging.previewId) {
    shared.dragging.previewId = nextId;
    renderTabs();
  }
  el.dropHint.classList.toggle('show', ok && hit.zone.startsWith('main'));
  if (denied !== d.denied) {
    d.denied = denied;
    document.body.classList.toggle('drag-denied', denied);
  }
}

export function onTabDragEnd(e) {
  removeDragListeners();
  if (!tabDrag) { pendingDrag = null; return; }   // it was a plain click
  tabDrag.x = e.clientX;
  tabDrag.y = e.clientY;
  finishTabDrag(false);
}

export function onTabDragCancel() {
  removeDragListeners();
  if (tabDrag) finishTabDrag(true);
  pendingDrag = null;
}

export function cancelTabDrag() {
  if (!tabDrag) return;
  removeDragListeners();
  finishTabDrag(true);
}

export function finishTabDrag(cancelled) {
  const d = tabDrag;
  const dragged = getTab(d.id);
  const wasPaired = !!partnerOf(dragged);
  const h = d.home;
  const overHome = d.x >= h.left - 8 && d.x <= h.right + 8 && d.y >= h.top - 8 && d.y <= h.bottom + 8;

  let change = null;
  if (!cancelled && d.newTab && isText(dragged)) {
    const nt = newTextTab(dragged.work, dragged.book);
    nt.fresh = false;
    createReader(nt);
    state.tabs.push(nt);
    pairTabs(dragged.id, nt.id);
    change = 'pair';
  } else if (!cancelled && d.target) {
    pairTabs(d.target.id, d.id);
    change = 'pair';
  } else if (!cancelled && d.denied) {
    // a split view holds two tabs: nothing happens
  } else if (!cancelled && wasPaired && !overHome) {
    // dropped anywhere else (any spot on the sidebar included): the tab leaves the split
    if (groupOf(activeTab()).includes(dragged)) {
      const leaving = groupOf(activeTab()).find((t) => t.id !== state.activeId);
      if (leaving) playExit(leaving);
    }
    unpair(dragged);
    change = 'unpair';
  }

  shared.dragging = null;
  tabDrag = null;
  pendingDrag = null;
  document.body.classList.remove('dragging-tab', 'drag-denied');
  el.dropHint.classList.remove('show');
  shared.suppressTabClick = true;
  setTimeout(() => { shared.suppressTabClick = false; }, 0);

  if (change === 'pair') activateTab(d.id);
  else if (change === 'unpair') renderAll();
  else renderTabs();
  landDraggedTab(d);
}

/* The dragged tab glides into its slot, then hands over to the real one */
export function landDraggedTab(d) {
  const dest = el.tabList.querySelector(`.tab[data-tab-id="${d.id}"]`);
  if (!dest) { d.clone.remove(); return; }
  const r = dest.getBoundingClientRect();
  dest.style.visibility = 'hidden';
  const c = d.clone;
  c.style.transition = 'transform 240ms var(--ease-spring), width 240ms ease';
  c.style.width = `${r.width}px`;
  c.style.transform = `translate(${r.left - d.left}px, ${r.top - d.top}px) scale(1)`;
  setTimeout(() => { c.remove(); dest.style.visibility = ''; }, 260);
}

export function initTabDrag() {
  el.tabList.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.pointerType === 'touch' || e.target.closest('.tab-close')) return;
    const pill = e.target.closest('.tab');
    if (!pill?.dataset.tabId) return;
    pendingDrag = { id: pill.dataset.tabId, x: e.clientX, y: e.clientY };
    document.addEventListener('pointermove', onTabDragMove);
    document.addEventListener('pointerup', onTabDragEnd);
    document.addEventListener('pointercancel', onTabDragCancel);
  });
}
