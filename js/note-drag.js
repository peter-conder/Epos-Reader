import { clamp, el } from './dom.js';
import { shared, state } from './state.js';
import { saveNotes } from './storage.js';
import { hideWordCard } from './word-card.js';
import { noteById } from './notes.js';

export function initNoteDrag() {
  /* ---- Dragging notes ----
     Press a card and a gray ripple spreads from the cursor; drag it and it is filled gray and lifted.
     Other cards slide out of its way as it passes over them, and the new order is saved. */
  (() => {
    const THRESHOLD = 5, EDGE = 56, MAX_SCROLL = 18;
    const scroller = el.notebookPane;
    let press = null;   // pointer is down on a card but hasn't moved far enough to be a drag yet
    let drag = null;    // a card is being dragged

    const cards = () => [...el.noteGrid.children];
    const rectOf = (n) => n.getBoundingClientRect();
    const activeId = () => (drag ?? press)?.id;

    el.noteGrid.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.pointerType === 'touch' || press || drag) return;
      if (e.target.closest('.note-del')) return;
      const card = e.target.closest('.note-card');
      const note = card && noteById(card.dataset.noteId);
      if (!note || note.draft) return;
      const ta = e.target.closest('.note-text');
      if (ta && document.activeElement === ta) return;   // already editing: shared.dragging selects text
      press = { card, id: e.pointerId, x: e.clientX, y: e.clientY, ta, ripple: null };
      startRipple(e);
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onCancel);
    });

    // Keep the text box from taking focus until we know the press was a click and not the start of a drag
    el.noteGrid.addEventListener('mousedown', (e) => {
      if (press?.ta && e.button === 0) e.preventDefault();
    });

    function startRipple(e) {
      const { card } = press;
      const r = rectOf(card);
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const rad = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
      const rp = document.createElement('span');
      rp.className = 'note-ripple';
      Object.assign(rp.style, { width: `${rad * 2}px`, height: `${rad * 2}px`, left: `${x - rad}px`, top: `${y - rad}px` });
      card.prepend(rp);
      card.classList.add('pressed');
      void rp.offsetWidth;
      rp.classList.add('grow');
      press.ripple = rp;
    }

    function endPress(s) {
      s.card.classList.remove('pressed');
      const rp = s.ripple;
      if (!rp) return;
      rp.classList.add('fade');
      setTimeout(() => rp.remove(), 260);
    }

    function stopListening() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onCancel);
    }

    function onMove(e) {
      if (e.pointerId !== activeId()) return;
      if (!drag) {
        if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < THRESHOLD) return;
        startDrag(e);
      }
      drag.px = e.clientX;
      drag.py = e.clientY;
      update();
    }

    function onUp(e) {
      if (e.pointerId !== activeId()) return;
      if (drag) { drop(false); return; }
      // No drag: it was a click
      const s = press;
      press = null;
      stopListening();
      endPress(s);
      if (s.ta) {
        s.ta.focus();
        s.ta.setSelectionRange(s.ta.value.length, s.ta.value.length);
      }
    }

    function onCancel() {
      if (drag) { drop(true); return; }
      if (!press) return;
      const s = press;
      press = null;
      stopListening();
      endPress(s);
    }

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drag) drop(true); });

    /* Layout positions of the other cards, so hit-testing isn't thrown off by their sliding animations */
    function measureSlots() {
      drag.slots = new Map(cards().filter((c) => c !== drag.card).map((c) => [c, rectOf(c)]));
      drag.slotScroll = scroller.scrollTop;
    }

    function startDrag(e) {
      const s = press;
      press = null;
      cards().forEach((c) => c.getAnimations().forEach((a) => a.cancel()));
      if (s.card.contains(document.activeElement)) document.activeElement.blur();
      getSelection()?.removeAllRanges();
      const r = rectOf(s.card);
      drag = { ...s, grabX: s.x - r.left, grabY: s.y - r.top, px: e.clientX, py: e.clientY,
        order: cards(), slots: null, slotScroll: 0, raf: 0 };
      measureSlots();
      s.card.classList.add('dragging');
      el.noteGrid.classList.add('sorting');
      document.body.classList.add('note-dragging');
      hideWordCard();
      drag.raf = requestAnimationFrame(tick);
    }

    /* The card follows the cursor: its transform is the gap between where the cursor wants it and where its slot is */
    function place() {
      const { card } = drag;
      card.style.transform = '';
      const base = rectOf(card);
      const left = drag.px - drag.grabX, top = drag.py - drag.grabY;
      card.style.transform = `translate(${left - base.left}px, ${top - base.top}px) scale(1.02)`;
      return { left, top, w: base.width, h: base.height };
    }

    function update() {
      const { left, top, w, h } = place();
      const cx = left + w / 2, cy = top + h / 2;
      const shift = drag.slotScroll - scroller.scrollTop;
      for (const [c, r] of drag.slots) {
        if (cx >= r.left && cx <= r.right && cy >= r.top + shift && cy <= r.bottom + shift) {
          reorder(c);
          place();
          break;
        }
      }
    }

    /* Move the dragged card into another card's slot; the cards in between slide to their new places */
    function reorder(over) {
      const { card } = drag;
      const others = cards().filter((c) => c !== card);
      const first = new Map(others.map((c) => [c, rectOf(c)]));
      others.forEach((c) => c.getAnimations().forEach((a) => a.cancel()));
      const all = cards();
      if (all.indexOf(over) > all.indexOf(card)) over.after(card); else over.before(card);
      measureSlots();
      for (const c of others) {
        const f = first.get(c), l = drag.slots.get(c);
        const dx = f.left - l.left, dy = f.top - l.top;
        if (!dx && !dy) continue;
        c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
          { duration: 360, easing: 'cubic-bezier(0.34, 1.3, 0.64, 1)' });
      }
    }

    /* Scroll the page when the card is held near its top or bottom edge */
    function tick() {
      if (!drag) return;
      const r = rectOf(scroller);
      let v = 0;
      if (drag.py < r.top + EDGE) v = -Math.ceil((1 - clamp((drag.py - r.top) / EDGE, 0, 1)) * MAX_SCROLL);
      else if (drag.py > r.bottom - EDGE) v = Math.ceil((1 - clamp((r.bottom - drag.py) / EDGE, 0, 1)) * MAX_SCROLL);
      if (v) {
        const before = scroller.scrollTop;
        scroller.scrollTop += v;
        if (scroller.scrollTop !== before) update();
      }
      drag.raf = requestAnimationFrame(tick);
    }

    function drop(cancel) {
      const s = drag;
      drag = null;
      cancelAnimationFrame(s.raf);
      stopListening();
      shared.suppressNoteClick = true;
      setTimeout(() => { shared.suppressNoteClick = false; }, 0);
      document.body.classList.remove('note-dragging');
      el.noteGrid.classList.remove('sorting');

      cards().forEach((c) => { if (c !== s.card) c.getAnimations().forEach((a) => a.cancel()); });
      if (cancel) s.order.forEach((c) => el.noteGrid.append(c));

      // The card settles into its slot with a little bounce, then drops back to its resting look
      const { card } = s;
      const from = rectOf(card);
      card.style.transform = '';
      const to = rectOf(card);
      const settle = card.animate(
        [{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(1.02)` }, { transform: 'none' }],
        { duration: 380, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' });
      settle.onfinish = settle.oncancel = () => { card.classList.remove('dragging'); endPress(s); };

      if (!cancel) {
        // Reorder by position on the page (a map lookup per note instead of indexOf per comparison)
        const pos = new Map(cards().map((c, i) => [c.dataset.noteId, i]));
        const before = state.notes.map((n) => n.id).join();
        state.notes.sort((a, b) => pos.get(a.id) - pos.get(b.id));
        if (state.notes.map((n) => n.id).join() !== before) saveNotes(state.notes);
      }
    }
  })();
}
