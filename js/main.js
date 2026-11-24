import { el } from './dom.js';
import { shared } from './state.js';
import { loadLexicon } from './book-data.js';
import { closePopovers, initLayout, setOpen } from './layout.js';
import { initTabs } from './tabs.js';
import { cancelTabDrag, initTabDrag } from './tab-drag.js';
import { initPanes } from './panes.js';
import { initFit } from './fit.js';
import { addNewTab, initHome } from './home.js';
import { hideHoverCard, initSidebar } from './sidebar.js';
import { closeNote, hideWordCard, initWordCard } from './word-card.js';
import { initNotes } from './notes.js';
import { initNoteDrag } from './note-drag.js';
import { initBookmarks } from './bookmarks.js';
import { initSettings } from './settings.js';
import { closePaletteMenu, initToolbar, setTools } from './toolbar.js';
import { initTooltips } from './tooltips.js';
import { initViewport, onTierChange } from './viewport.js';
import { initBottomBar } from './bottom-bar.js';
import { initTabGrid } from './tab-grid.js';
import { initChapters } from './chapters.js';
import { closeFormatSheet, initFormatSheet } from './format-sheet.js';
import { initEnglish } from './english.js';

/* Epos Reader: the entry point. Each module sets up its own listeners in its init function;
   they run here in the order the page needs them. */
loadLexicon('latin');   // start the big Lexicon download now rather than when the first book opens (Greek loads with its first Book)
initViewport();   // layout tier first: later modules may ask which one they're in
initLayout();
initFit();
initPanes();
initTabDrag();
initWordCard();
initSidebar();
initHome();
initTabs();
initSettings();
initToolbar();

/* ==========================================================
   GLOBAL: outside-click & Escape dismissal
   ========================================================== */
document.addEventListener('click', (e) => {
  const t = e.target;
  const startedInNote = shared.downInNote;
  shared.downInNote = false;
  if (!startedInNote) {
    // Clicking anywhere outside the note box saves and closes it.
    if (!t.closest('#note-box, #card-note, #card-user-note')) closeNote();
    if (!t.closest('#word-card, .word, #note-box')) hideWordCard();
  }
  if (!t.closest('#picker, #hover-card')) setOpen(el.picker, false);
  if (!t.closest('#drawer, #btn-menu, #palette-menu')) { setOpen(el.drawer, false); closePaletteMenu(); }
  if (!t.closest('#flyout, #btn-text')) setOpen(el.flyout, false);
  if (!t.closest('#popups-flyout, #btn-popups')) setOpen(el.popupsFlyout, false);
  // Tapping anywhere but the sheet (or the menu that opened it) closes the Format Text sheet
  if (!t.closest('#format-sheet, #drawer, #btn-menu')) closeFormatSheet();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  cancelTabDrag();
  closePopovers();
  hideWordCard();
  hideHoverCard();
});

initNotes();
initNoteDrag();
initBookmarks();
initTooltips();
initBottomBar();
initTabGrid();
initChapters();
initFormatSheet();
initEnglish();

/* Crossing between phone, tablet and desktop layouts (rotating a tablet, resizing a window): anything floating is
   closed, since it was placed for the old layout. The sheets, tab grid, chapter list and line menu close themselves
   (see their modules). Nothing saved changes: tabs, splits, the English pane and the reading position carry over. */
onTierChange(() => {
  cancelTabDrag();
  closePopovers();
  closePaletteMenu();
  hideHoverCard();
  setTools(false);
});

addNewTab();   // a New Tab is always open when the page loads
