import { $, clamp, el } from './dom.js';
import { activeTab, groupOf, state } from './state.js';
import { SPRING } from './motion.js';
import { renderAll } from './layout.js';
import { activateTab, closeTab } from './tabs.js';
import { hideWordCard } from './word-card.js';

/* Split pairs: click a pane to focus its tab, the bar between the two panes, and shared.dragging a pane by its title */

export function initPanes() {
  /* Clicking inside a pane focuses its tab */
  el.panes.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.pane-close')) return;
    const view = e.target.closest('.tab-view');
    if (view && view.dataset.tabId !== state.activeId) activateTab(view.dataset.tabId);
  });

  /* The X in a split pane's top-right corner closes that pane's tab */
  el.panes.addEventListener('click', (e) => {
    const btn = e.target.closest('.pane-close');
    const id = btn?.closest('.tab-view')?.dataset.tabId;
    if (id) closeTab(id);
  });

  /* Resize bar between the two panes of a split pair */
  (() => {
    const dv = $('pair-divider');
    let drag = null;
    const apply = () => {
      groupOf(activeTab()).forEach((t, i) => { t.view.style.flex = `${i === 0 ? state.pairPct : 100 - state.pairPct} 1 0`; });
    };
    dv.addEventListener('pointerdown', (e) => {
      drag = { rect: el.panes.getBoundingClientRect() };
      el.panes.classList.add('live');
      dv.setPointerCapture(e.pointerId);
      dv.classList.add('dragging');
      document.body.classList.add('resizing');
      hideWordCard();
      e.preventDefault();
    });
    dv.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const w = drag.rect.width - dv.offsetWidth;
      if (w <= 0) return;
      const raw = ((e.clientX - drag.rect.left - dv.offsetWidth / 2) / w) * 100;
      state.pairPct = clamp(raw, 3, 97);
      apply();
      const shown = groupOf(activeTab());
      const gone = state.pairPct <= 9 ? 0 : state.pairPct >= 91 ? 1 : -1;
      if (gone >= 0 && shown.length === 2) {          // reached the edge: that pane goes right now
        release(e.pointerId);
        closeTab(shown[gone].id, { exit: 'push' });
        return;
      }
      // near either edge, the shrinking pane dims to show it will be dismissed
      const warn = state.pairPct <= 20 ? 0 : state.pairPct >= 80 ? 1 : -1;
      shown.forEach((t, i) => { t.view.style.opacity = i === warn ? '0.5' : ''; });
      dv.classList.toggle('elastic', warn >= 0);
    });
    function release(pid) {
      drag = null;
      el.panes.classList.remove('live');
      if (dv.hasPointerCapture(pid)) dv.releasePointerCapture(pid);
      dv.classList.remove('dragging', 'elastic');
      document.body.classList.remove('resizing');
      groupOf(activeTab()).forEach((t) => { t.view.style.opacity = ''; });
    }
    const end = (e) => {
      if (!drag) return;
      release(e.pointerId);
      state.pairPct = clamp(state.pairPct, 25, 75);   // bounces back inside the normal range
      apply();
    };
    dv.addEventListener('pointerup', end);
    dv.addEventListener('pointercancel', end);
    dv.addEventListener('dblclick', () => { state.pairPct = 50; apply(); });
  })();

  /* Pane shared.dragging: grab a pane by its title and slide it side to side.
     Far enough toward its neighbour it swaps places; all the way out past its own edge it is dismissed. */
  (() => {
    const SWAP = 0.28, DISMISS = 0.55, DIVIDER = 16;
    let d = null;
    const rotFor = (dx, w) => clamp(dx / w, -1, 1) * 2.4;
    const springFrames = (from, rot, lift) => [
      { transform: `translateX(${from}px) rotate(${rot}deg) scale(${lift})`, offset: 0, easing: SPRING },
      { transform: `translateX(${-from * 0.18}px) rotate(${-rot * 0.3}deg) scale(0.996)`, offset: 0.34, easing: SPRING },
      { transform: `translateX(${from * 0.08}px) rotate(${rot * 0.1}deg) scale(1)`, offset: 0.56, easing: SPRING },
      { transform: `translateX(${-from * 0.03}px)`, offset: 0.76, easing: SPRING },
      { transform: 'translateX(0px) rotate(0deg) scale(1)', offset: 1 }
    ];

    el.panes.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || el.panes.dataset.count !== '2' || state.view !== 'reader') return;
      const handle = e.target.closest('.book-title, .nb-title');
      const view = handle?.closest('.tab-view');
      if (!view) return;
      const shown = groupOf(activeTab());
      const tab = shown.find((t) => t.view === view);
      if (!tab) return;
      const partner = shown.find((t) => t !== tab);
      const r = view.getBoundingClientRect(), pr = partner.view.getBoundingClientRect();
      d = { tab, partner, view, handle, idx: shown.indexOf(tab), id: e.pointerId, x0: e.clientX, dx: 0,
        left: r.left, top: r.top, w: r.width, h: r.height, pleft: pr.left, partnerShift: 0, willSwap: false, moved: false };
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    el.panes.addEventListener('pointermove', (e) => {
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x0;
      if (!d.moved) {
        if (Math.abs(dx) < 4) return;
        d.moved = true;
        hideWordCard();
        document.body.classList.add('pane-dragging');
        d.view.classList.add('drag-live');
      }
      d.dx = dx;
      d.view.style.transform = `translateX(${dx}px) rotate(${rotFor(dx, d.w)}deg) scale(1.015)`;
      const toward = d.idx === 0 ? dx > 0 : dx < 0;
      d.willSwap = toward && Math.abs(dx) > d.w * SWAP;
      // the neighbour trails the drag a little, then slides into the vacated slot once a swap is certain
      d.partnerShift = d.willSwap ? (d.idx === 0 ? -1 : 1) * (d.w + DIVIDER) : dx * (toward ? 0.12 : 0.06);
      d.partner.view.style.transform = `translateX(${d.partnerShift}px)`;
    });

    const end = (e) => {
      if (!d || e.pointerId !== d.id) return;
      const s = d;
      d = null;
      if (s.handle.hasPointerCapture(s.id)) s.handle.releasePointerCapture(s.id);
      if (!s.moved) return;
      document.body.classList.remove('pane-dragging');
      const outward = s.idx === 0 ? s.dx < 0 : s.dx > 0;
      if (outward && Math.abs(s.dx) > s.w * DISMISS) dismiss(s);
      else if (s.willSwap) swap(s);
      else settle(s);
    };
    el.panes.addEventListener('pointerup', end);
    el.panes.addEventListener('pointercancel', end);

    function settle(s) {
      s.view.style.transform = '';
      s.partner.view.style.transform = '';
      if (Math.abs(s.dx) < 1) { s.view.classList.remove('drag-live'); return; }
      const a = s.view.animate(springFrames(s.dx, rotFor(s.dx, s.w), 1.015), { duration: 780, easing: 'linear' });
      a.onfinish = a.oncancel = () => s.view.classList.remove('drag-live');
    }

    function swap(s) {
      const dragVisual = s.left + s.dx;
      const partnerVisual = s.pleft + s.partnerShift;
      el.panes.classList.add('instant');
      s.view.style.transform = '';
      s.partner.view.style.transform = '';
      const i = state.tabs.indexOf(s.tab), j = state.tabs.indexOf(s.partner);
      [state.tabs[i], state.tabs[j]] = [state.tabs[j], state.tabs[i]];
      state.pairPct = 100 - state.pairPct;
      renderAll();
      const nl = s.view.getBoundingClientRect().left;       // forces layout
      const npl = s.partner.view.getBoundingClientRect().left;
      el.panes.classList.remove('instant');
      const a = s.view.animate(springFrames(dragVisual - nl, rotFor(s.dx, s.w), 1.015), { duration: 820, easing: 'linear' });
      a.onfinish = a.oncancel = () => s.view.classList.remove('drag-live');
      s.partner.view.animate(springFrames(partnerVisual - npl, 0, 1), { duration: 780, easing: 'linear' });
    }

    // Slides on out from where it was dropped, while its neighbour widens to fill the room
    function dismiss(s) {
      s.view.style.transform = '';
      s.partner.view.style.transform = '';
      s.view.classList.remove('drag-live');
      closeTab(s.tab.id, { ghostRect: { left: s.left + s.dx, top: s.top, width: s.w, height: s.h } });
    }
  })();
}
