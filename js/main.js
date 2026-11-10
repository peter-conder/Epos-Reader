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
import { closePaletteMenu, initToolbar } from './toolbar.js';
import { initTooltips } from './tooltips.js';

/* Epos reader: the entry point. Each module sets up its own listeners in its init function;
   they run here in the order the page needs them. */
loadLexicon();   // start the big dictionary download now rather than when the first book opens
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

addNewTab();   // a New Tab is always open when the page loads
