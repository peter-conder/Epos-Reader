import { el, root } from './dom.js';
import { showChrome } from './bottom-bar.js';
import { onTierChange } from './viewport.js';

/* ==========================================================
   FORMAT TEXT SHEET (phones and tablets): text options in the bottom half of the screen, Kindle-style, so the
   text you are changing stays in view above it. Opened from the menu.
   The toolbar's own panels (Text Appearance: size, font, spacing, margins; View Options: the popup and
   scansion switches) are moved in while it is open and back out when it closes, so every control exists
   once and keeps its listeners. A scansion switch stands in for the toolbar's scansion button.
   Swipe the grip down, tap the text above, or press Escape to close it.
   ========================================================== */
const PANELS = () => [el.flyout, el.popupsFlyout];
const CLOSE_DRAG = 60;   // px the grip must be pulled down to close the sheet

let home = null;   // where the panels live the rest of the time (the toolbar)

export const formatSheetOpen = () => !el.formatSheet.hidden;

export function openFormatSheet() {
  if (formatSheetOpen()) return;
  home ??= el.flyout.parentElement;
  for (const p of PANELS()) { p.classList.add('in-sheet'); el.fsBody.append(p); }
  el.formatSheet.hidden = false;
  root.classList.add('sheet-open');
  el.fsBody.scrollTop = 0;
}

export function closeFormatSheet() {
  if (!formatSheetOpen()) return;
  el.formatSheet.hidden = true;
  el.formatSheet.style.transform = '';
  root.classList.remove('sheet-open');
  for (const p of PANELS()) { p.classList.remove('in-sheet'); home.append(p); }
  showChrome();
}

/* Pulling the grip (or the header) down drags the sheet with it; far enough and it closes */
function bindGrip() {
  let g = null;
  const handle = (e) => e.target.closest('#fs-grip, .fs-header') && !e.target.closest('button');
  el.formatSheet.addEventListener('pointerdown', (e) => {
    if (!handle(e) || e.button !== 0) return;
    g = { id: e.pointerId, y0: e.clientY, dy: 0 };
    el.formatSheet.setPointerCapture(e.pointerId);
    el.formatSheet.style.transition = 'none';
  });
  el.formatSheet.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.id) return;
    g.dy = Math.max(0, e.clientY - g.y0);
    el.formatSheet.style.transform = `translateY(${g.dy}px)`;
  });
  const end = (e) => {
    if (!g || e.pointerId !== g.id) return;
    const { dy } = g;
    g = null;
    el.formatSheet.style.transition = '';
    if (dy > CLOSE_DRAG) closeFormatSheet();
    else el.formatSheet.style.transform = '';
  };
  el.formatSheet.addEventListener('pointerup', end);
  el.formatSheet.addEventListener('pointercancel', end);
}

export function initFormatSheet() {
  el.fsClose.addEventListener('click', closeFormatSheet);
  bindGrip();
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFormatSheet(); });
  // Back on a desktop-wide screen the panels go home to the toolbar
  onTierChange(closeFormatSheet);
}
