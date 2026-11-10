/* ==========================================================
   SCROLLBAR
   The panes hide the browser's scrollbar and draw their own thumb in a rail laid over the pane's right
   padding. The pane is still the scroller (wheel, keys and touch work as usual); the thumb just follows its
   scrollTop. Because it is ours it can grow while it is being dragged and squish when the scroll reaches
   the top or bottom. The rail also holds the bookmark dots (see bookmarks.js), which are placed with
   thumbMetrics() so they line up with the thumb.
   ========================================================== */
export const TRACK_PAD = 24;   // the thumb stays this far from the pane's top and bottom (clear of the rounded corners)
export const THUMB_MIN = 22;  // the thumb's shortest length
const RAIL_W = 20;             // the rail's width; the thumb is an 8px pill 3px in from its left (css: .sb-thumb)

/* Where the thumb goes: T is the track the thumb moves in, L the thumb's length, C the visible height, H the
   scrolled height. The thumb's top is TRACK_PAD + scrollTop / (H - C) * (T - L). */
export function thumbMetrics(pane) {
  const C = pane.clientHeight, H = pane.scrollHeight, T = Math.max(0, C - 2 * TRACK_PAD);
  const L = Math.min(T, Math.max((T * C) / Math.max(H, 1), THUMB_MIN));
  return { C, H, T, L };
}

const stillMotion = matchMedia('(prefers-reduced-motion: reduce)');

/* Bounce when the scroll hits an end: the thumb gets shorter and wider, anchored at that end */
const SQUISH = [
  { transform: 'scale(1, 1)', offset: 0 },
  { transform: 'scale(1.7, 0.45)', offset: 0.14 },
  { transform: 'scale(0.9, 1.1)', offset: 0.42 },
  { transform: 'scale(1.05, 0.96)', offset: 0.66 },
  { transform: 'scale(0.98, 1.02)', offset: 0.84 },
  { transform: 'scale(1, 1)', offset: 1 }
];

export function attachScrollbar(pane) {
  const rail = document.createElement('div');
  rail.className = 'sb-rail';
  rail.innerHTML = '<div class="sb-track"></div><div class="sb-thumb"></div><div class="sb-dots"></div>';
  const [track, thumb, dots] = rail.children;
  pane.after(rail);

  let edge = null;       // 'top' or 'bottom' while the scroll is at that end
  let drag = null;       // { y, scrollTop, ratio } while the thumb is being dragged

  /* The thumb's position from the pane's scroll; also where the squish is triggered */
  function place(fromScroll) {
    const { C, H, T, L } = thumbMetrics(pane);
    const max = H - C;
    const top = max > 0 ? TRACK_PAD + (pane.scrollTop / max) * (T - L) : TRACK_PAD;
    thumb.style.top = `${top}px`;
    thumb.style.height = `${L}px`;

    const now = max <= 0 ? null : pane.scrollTop <= 1 ? 'top' : pane.scrollTop >= max - 1 ? 'bottom' : null;
    if (fromScroll && now && !edge) squish(now);
    edge = now;
  }

  function squish(at) {
    if (stillMotion.matches) return;
    thumb.getAnimations().forEach((a) => a.cancel());
    thumb.style.transformOrigin = at === 'top' ? '50% 0' : '50% 100%';
    thumb.animate(SQUISH, { duration: 700, easing: 'ease-out' });
  }

  /* Rail position and size, from the pane's own box (offsets ignore the transforms some panes animate with) */
  function update() {
    const { C, H, T } = thumbMetrics(pane);
    const show = pane.offsetParent !== null && C > 0 && T > 0 && H > C;
    rail.style.display = show ? 'block' : '';
    if (!show) return;
    rail.style.left = `${pane.offsetLeft + pane.clientLeft + pane.clientWidth - RAIL_W}px`;
    rail.style.top = `${pane.offsetTop + pane.clientTop}px`;
    rail.style.height = `${C}px`;
    place(false);
  }

  pane.addEventListener('scroll', () => { if (rail.style.display) place(true); }, { passive: true });

  // Anything that moves or resizes the pane, or changes how much it holds
  const ro = new ResizeObserver(update);
  ro.observe(pane);
  if (pane.parentElement) ro.observe(pane.parentElement);
  [...pane.children].forEach((c) => ro.observe(c));

  /* ---- Dragging the thumb: it grows while held ---- */
  thumb.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const { C, H, T, L } = thumbMetrics(pane);
    drag = { y: e.clientY, scrollTop: pane.scrollTop, ratio: (H - C) / Math.max(1, T - L) };
    thumb.setPointerCapture(e.pointerId);
    rail.classList.add('dragging');
    document.body.classList.add('sb-dragging');
    rail.dispatchEvent(new Event('sbdrag'));
    e.preventDefault();
  });
  thumb.addEventListener('pointermove', (e) => {
    if (drag) pane.scrollTop = drag.scrollTop + (e.clientY - drag.y) * drag.ratio;
  });
  const endDrag = (e) => {
    if (!drag) return;
    drag = null;
    if (thumb.hasPointerCapture(e.pointerId)) thumb.releasePointerCapture(e.pointerId);
    rail.classList.remove('dragging');
    document.body.classList.remove('sb-dragging');
    rail.dispatchEvent(new Event('sbdrag'));
  };
  thumb.addEventListener('pointerup', endDrag);
  thumb.addEventListener('pointercancel', endDrag);

  /* ---- What the native scrollbar did that the rail has to keep doing ---- */
  // A click on the empty track pages toward it
  track.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const above = e.clientY < thumb.getBoundingClientRect().top;
    pane.scrollBy({ top: (above ? -1 : 1) * pane.clientHeight * 0.9, behavior: 'smooth' });
    e.preventDefault();
  });
  // The rail isn't inside the pane, so the wheel over it is passed on
  rail.addEventListener('wheel', (e) => {
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? pane.clientHeight : 1;
    pane.scrollTop += e.deltaY * unit;
    e.preventDefault();
  }, { passive: false });

  return { rail, track, thumb, dots, update };
}
