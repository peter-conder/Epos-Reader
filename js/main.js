import { el } from './dom.js';
import { activeTab, isText, shared, workOf } from './state.js';
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
import { initMobileBookmarks } from './mobile-bookmarks.js';
import { initPages } from './pages.js';
import { closeTabGrid, initTabGrid, tabGridOpen } from './tab-grid.js';
import { chapterListOpen, closeChapterList, initChapters } from './chapters.js';
import { closeFormatSheet, formatSheetOpen, initFormatSheet } from './format-sheet.js';
import { closeLineMenu, initEnglish, lineMenuOpen } from './english.js';
import { initSession, restoreSession } from './session.js';

/* Epos Reader: the entry point. Each module sets up its own listeners in its init function;
   they run here in the order the page needs them. */
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
   GLOBAL: outside-click & layered Escape dismissal
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
  // Tapping anywhere but the sheet (or the menu or button that opened it) closes the Format Text sheet
  if (!t.closest('#format-sheet, #drawer, #btn-menu, #btn-format')) closeFormatSheet();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  // Dismiss only the topmost open layer so nested dialogs unwind one step at a time
  if (shared.dragging) { cancelTabDrag(); return; }
  if (lineMenuOpen()) { closeLineMenu(); return; }
  if (chapterListOpen()) { closeChapterList(); return; }
  if (tabGridOpen()) { closeTabGrid(); el.tabsBtn.focus({ preventScroll: true }); return; }
  if (formatSheetOpen()) { closeFormatSheet(); el.formatBtn.focus({ preventScroll: true }); return; }
  if (el.paletteMenu.classList.contains('open')) {
    closePaletteMenu();
    document.getElementById('drawer-palette')?.focus({ preventScroll: true });
    return;
  }
  if (el.drawer.classList.contains('open')) { setOpen(el.drawer, false); el.menuBtn.focus({ preventScroll: true }); return; }
  if (el.flyout.classList.contains('open')) { setOpen(el.flyout, false); el.textBtn.focus({ preventScroll: true }); return; }
  if (el.popupsFlyout.classList.contains('open')) { setOpen(el.popupsFlyout, false); el.popupsBtn.focus({ preventScroll: true }); return; }
  if (el.picker.classList.contains('open')) { setOpen(el.picker, false); return; }
  if (shared.noteCtx) { closeNote(); el.cardNote.focus({ preventScroll: true }); return; }
  if (el.wordCard.classList.contains('visible')) { hideWordCard({ restoreFocus: true }); return; }
  if (el.hoverCard.classList.contains('open')) { hideHoverCard(); }
});

initNotes();
initNoteDrag();
initBookmarks();
initTooltips();
initBottomBar();
initMobileBookmarks();
initPages();
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

initSession();
if (!restoreSession()) addNewTab();   // reopen the last reading session, or start on a New Tab
const open = activeTab();
loadLexicon(isText(open) ? workOf(open).lexicon : 'latin');
