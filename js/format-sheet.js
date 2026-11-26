import { el, root } from './dom.js';
import { showChrome } from './bottom-bar.js';
import { onTierChange } from './viewport.js';
import { hideWordCard } from './word-card.js';
import { relayoutLineEnglish } from './english.js';
import { closingLayer } from './motion.js';

/* ==========================================================
   FORMAT TEXT SHEET (phones and tablets): text options in the bottom half of the screen, Kindle-style, so the
   text you are changing stays in view above it. Opened from the bottom bar.
   The toolbar's own panels (Text Appearance: size, font, spacing, margins; View Options: the popup and
   scansion switches) are moved in while it is open and back out when it closes, so every control exists
   once and keeps its listeners. A scansion switch stands in for the toolbar's scansion button.
   Swipe the grip down, tap the text above, or press Escape to close it.
   ========================================================== */
const PANELS = () => [el.flyout, el.popupsFlyout];
const CLOSE_DRAG = 60;   // px the grip must be pulled down to close the sheet

let home = null;   // where the panels live the rest of the time (the toolbar)
let sheetLayer = null;   // made on first use: el is filled in at start-up
// Once hidden, the panels go back to the toolbar
const layer = () => (sheetLayer ??= closingLayer(el.formatSheet, () => {
  if (home) for (const p of PANELS()) { p.classList.remove('in-sheet'); home.append(p); }
}));

export const formatSheetOpen = () => !el.formatSheet.hidden && !el.formatSheet.classList.contains('closing');

export function openFormatSheet() {
  if (formatSheetOpen()) return;
  layer().cancel();
  hideWordCard();   // one sheet at a time
  home ??= el.flyout.parentElement;
  for (const p of PANELS()) { p.classList.add('in-sheet'); el.fsBody.append(p); }
  el.formatSheet.hidden = false;
  root.classList.add('sheet-open');
  relayoutLineEnglish();   // lines' English hides while the sheet is open
  el.fsBody.scrollTop = 0;
}

export function closeFormatSheet({ instant = false } = {}) {
  if (!formatSheetOpen()) return;
  root.classList.remove('sheet-open');
  relayoutLineEnglish();
  showChrome();
  layer().close({ instant });
}

/* Pulling a sheet's grip (or whatever `handles` matches) down drags the sheet with it; far enough and it closes.
   Shared by the Format Text sheet and the word card's sheet. */
export function bindSheetDrag(sheet, handles, onClose, enabled = () => true) {
  let g = null;
  sheet.addEventListener('pointerdown', (e) => {
    if (!enabled() || e.button !== 0 || !e.target.closest(handles) || e.target.closest('button, textarea, input')) return;
    g = { id: e.pointerId, y0: e.clientY, dy: 0 };
    sheet.setPointerCapture(e.pointerId);
    sheet.style.transition = 'none';
  });
  sheet.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.id) return;
    g.dy = Math.max(0, e.clientY - g.y0);
    sheet.style.transform = `translateY(${g.dy}px)`;
  });
  const end = (e) => {
    if (!g || e.pointerId !== g.id) return;
    const { dy } = g;
    g = null;
    sheet.style.transition = '';
    sheet.style.transform = '';
    if (dy > CLOSE_DRAG) onClose();
  };
  sheet.addEventListener('pointerup', end);
  sheet.addEventListener('pointercancel', end);
}

export function initFormatSheet() {
  el.fsClose.addEventListener('click', () => closeFormatSheet());
  bindSheetDrag(el.formatSheet, '#fs-grip, .fs-header', () => closeFormatSheet());
  // Back on a desktop-wide screen the panels go home to the toolbar immediately
  onTierChange(() => closeFormatSheet({ instant: true }));
}
