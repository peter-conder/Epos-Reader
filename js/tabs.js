import { el, esc, icon } from './dom.js';
import { activeTab, getTab, groupOf, isNotebook, isText, newTabId, partnerOf, shared, state, WORK_ICON, workOf } from './state.js';
import { beginSplitClose } from './motion.js';
import { closePopovers, renderAll, showUndo } from './layout.js';
import { createReader, renderReader } from './reader.js';
import { addNewTab } from './home.js';
import { hideHoverCard } from './sidebar.js';
import { hideWordCard } from './word-card.js';

/* ==========================================================
   TABS (sidebar)
   ========================================================== */
const iconName = (tab) => (isNotebook(tab) ? 'notebook' : isText(tab) ? WORK_ICON[tab.work] : 'plus');
const tabName = (tab) => (isNotebook(tab) ? 'Notebook' : isText(tab) ? workOf(tab).title : 'New Tab');

/* Expanded: "Book II". Compact (half of a split): "II". The notebook and new tabs have no text when compact. */
export function tabHtml(tab, { compact = false, extra = '' } = {}) {
  const text = isText(tab);
  const active = tab.id === state.activeId;
  const label = text ? (compact ? tab.book : `Book ${tab.book}`) : (compact ? '' : tabName(tab));
  const full = text ? `${workOf(tab).title} · Book ${tab.book}` : tabName(tab);
  return `
    <div class="tab${compact ? ' tab-half' : ''}${active ? ' active' : ''}${extra}" data-tab-id="${tab.id}" role="tab" tabindex="0" aria-selected="${active}" aria-label="${esc(full)}">
      <span class="tab-left">
        <svg class="icon tab-icon"><use href="assets/icons.svg#i-${iconName(tab)}"/></svg>
        ${label ? `<span class="tab-title">${label}</span>` : ''}
      </span>
      <button class="tab-close" data-tip="Close Tab" data-tip-side="bottom" aria-label="Close tab">${icon('close')}</button>
    </div>`;
}

/* The half of a pill that shows where a dragged tab would land */
export function previewHalfHtml(tab) {
  const label = isText(tab) ? tab.book : '';
  return `
    <div class="tab tab-half preview-half" aria-hidden="true">
      <span class="tab-left">
        <svg class="icon tab-icon"><use href="assets/icons.svg#i-${iconName(tab)}"/></svg>
        ${label ? `<span class="tab-title">${label}</span>` : ''}
      </span>
    </div>`;
}

export function renderTabs() {
  shared.hoveredPill = null; // the old pill elements are about to be replaced
  const drag = shared.dragging;
  const dragged = drag && getTab(drag.id);
  const activeIds = new Set(state.activeId ? groupOf(activeTab()).map((t) => t.id) : []);
  const half = (t) => tabHtml(t, {
    compact: true,
    extra: activeIds.size > 1 && activeIds.has(t.id) && t.id !== state.activeId ? ' partner' : ''
  });
  // While a tab is being dragged it counts as detached from its partner
  const livePartner = (t) => {
    const p = partnerOf(t);
    return p && !(drag && (drag.id === t.id || drag.id === p.id)) ? p : null;
  };

  const seen = new Set();
  let html = '';
  for (const tab of state.tabs) {
    if (seen.has(tab.id)) continue;
    seen.add(tab.id);
    const p = livePartner(tab);
    if (p) {
      seen.add(p.id);
      html += `<div class="tab-group">${groupOf(tab).map(half).join('')}</div>`;
    } else if (dragged && drag.previewId === tab.id) {
      html += `<div class="tab-group preview">${half(tab)}${previewHalfHtml(dragged)}</div>`;
    } else {
      html += tabHtml(tab, { extra: drag?.id === tab.id ? ' drag-ghost' : '' });
    }
  }
  el.tabList.innerHTML = html;
}

export const newTextTab = (work, book) => ({ id: newTabId(), kind: 'text', work, book, split: false, splitPct: 50, partnerId: null, fresh: true });

export function addTab(work, book) {
  const tab = newTextTab(work, book);
  createReader(tab);
  state.tabs.push(tab);
  activateTab(tab.id);
  return tab;
}

export function activateTab(id) {
  const tab = getTab(id);
  if (!tab) return;
  state.activeId = id;
  state.view = 'reader';
  closePopovers();
  hideWordCard();
  groupOf(tab).forEach(renderReader);
  renderAll();
}

export function closeTab(id, opts = {}) {
  const idx = state.tabs.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const tab = state.tabs[idx];
  const partner = partnerOf(tab);
  // Recorded while the pane is still on screen; played once the layout has closed up behind it
  const playClose = opts.skipExit ? null : beginSplitClose(tab, opts.ghostRect);
  tab.ro?.disconnect();
  const snap = { tab, idx, partnerId: partner?.id ?? null, autoId: null };
  if (partner) partner.partnerId = null;
  state.tabs.splice(idx, 1);
  tab.view.hidden = true;
  if (!isNotebook(tab)) tab.view.remove();
  hideWordCard();

  if (state.tabs.length === 0) {
    // The tab bar is never empty: closing the last tab leaves a fresh New Tab behind
    state.activeId = null;
    snap.autoId = addNewTab().id;
  } else if (id === state.activeId) {
    activateTab((partner ?? state.tabs[Math.max(0, idx - 1)]).id);
  } else {
    renderAll();
  }
  playClose?.();
  if (!opts.silent) showUndo(snap);
}

/* Put a closed tab back where it was (and into its split, if its partner is still there) */
export function undoClose({ tab, idx, partnerId, autoId }) {
  if (getTab(tab.id)) return;
  if (isText(tab)) createReader(tab);                       // its old view was thrown away
  else if (!isNotebook(tab)) el.panes.append(tab.view);     // a New Tab keeps its view
  else shared.notebookDirty = true;
  state.tabs.splice(Math.min(idx, state.tabs.length), 0, tab);
  const partner = getTab(partnerId);
  tab.partnerId = partner && !partner.partnerId ? partner.id : null;
  if (tab.partnerId) partner.partnerId = tab.id;
  tab.fresh = true;
  activateTab(tab.id);
  // the blank tab that appeared when the last tab closed is no longer needed
  if (autoId && getTab(autoId)?.kind === 'new') closeTab(autoId, { skipExit: true, silent: true });
}

/* Put `dragged` right after `target` and link them as a split pair */
export function pairTabs(targetId, draggedId) {
  const target = getTab(targetId), dragged = getTab(draggedId);
  const old = partnerOf(dragged);
  if (old) old.partnerId = null;
  state.tabs.splice(state.tabs.indexOf(dragged), 1);
  state.tabs.splice(state.tabs.indexOf(target) + 1, 0, dragged);
  target.partnerId = dragged.id;
  dragged.partnerId = target.id;
  // English parallel view isn't available inside a split view
  for (const t of [target, dragged]) if (isText(t)) t.split = false;
  state.pairPct = 50;
}

export function unpair(tab) {
  const p = partnerOf(tab);
  if (p) p.partnerId = null;
  tab.partnerId = null;
}

export function initTabs() {
  el.tabList.addEventListener('click', (e) => {
    if (shared.suppressTabClick) return;
    const pill = e.target.closest('.tab');
    if (!pill?.dataset.tabId) return;
    if (e.target.closest('.tab-close')) {
      hideHoverCard();
      closeTab(pill.dataset.tabId);
    } else {
      activateTab(pill.dataset.tabId);
    }
  });
  el.tabList.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('tab') && e.target.dataset.tabId) {
      e.preventDefault();
      activateTab(e.target.dataset.tabId);
    }
  });
}
