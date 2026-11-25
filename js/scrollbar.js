/* ==========================================================
   BOOKMARK STRIP
   The panes use the browser's own scrollbar. Beside the original text's scrollbar a thin strip holds a dot for
   each bookmark in the Book (see renderRail in bookmarks.js); click one to jump to its line. On phones and
   tablets it shows and fades with the floating controls (see mobile-bookmarks.js).
   The strip is laid over the pane's right padding, just left of the scrollbar, and placed from the pane's box.
   ========================================================== */
import { el } from './dom.js';
import { isMobileTier } from './viewport.js';

export const TRACK_PAD = 14;   // the dots stay this far from the pane's top and bottom
const STRIP_W = 14;            // the strip's width on desktop (css: .sb-rail); wider on phones and tablets

/* Where a point in the pane's scroll space sits on the strip: the same fraction of the track as of the
   scrolled height, so a dot lines up with the scrollbar thumb's centre when that point is in the middle of the pane.
   On phones and tablets the track runs between the floating controls instead: from the pane's top padding (below
   the menu button and the ribbon) to the top of the bottom bar. */
export function stripY(pane, p) {
  const C = pane.clientHeight, H = Math.max(pane.scrollHeight, 1);
  let top = TRACK_PAD, bottom = TRACK_PAD;
  if (isMobileTier()) {
    top = parseFloat(getComputedStyle(pane).paddingTop) || TRACK_PAD;
    // From the bar's box as laid out, not as drawn: it shrinks and slides while hidden
    const bar = el.bottomBar;
    if (bar.offsetHeight) bottom = bar.offsetHeight + (parseFloat(getComputedStyle(bar).bottom) || 0) + 12;
  }
  return top + (p / H) * Math.max(0, C - top - bottom);
}

export function attachMarkStrip(pane) {
  const rail = document.createElement('div');
  rail.className = 'sb-rail';
  pane.after(rail);

  /* Strip position and size, from the pane's own box (offsets ignore the transforms some panes animate with).
     clientWidth stops where the scrollbar starts, so the strip sits against it on every platform. */
  function update() {
    const C = pane.clientHeight;
    const show = pane.offsetParent !== null && C > 2 * TRACK_PAD && pane.scrollHeight > C;
    rail.style.display = show ? 'block' : '';
    if (!show) return;
    rail.style.left = `${pane.offsetLeft + pane.clientLeft + pane.clientWidth - (rail.offsetWidth || STRIP_W)}px`;
    rail.style.top = `${pane.offsetTop + pane.clientTop}px`;
    rail.style.height = `${C}px`;
  }

  // Anything that moves or resizes the pane, or changes how much it holds
  const ro = new ResizeObserver(update);
  ro.observe(pane);
  if (pane.parentElement) ro.observe(pane.parentElement);
  [...pane.children].forEach((c) => ro.observe(c));

  return { rail, update };
}
