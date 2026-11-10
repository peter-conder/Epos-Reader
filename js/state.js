import { WORKS } from './data.js';
import { loadNotes, loadBookmarks } from './storage.js';

/* ==========================================================
   STATE
   Every open tab is { id, kind: 'text' | 'notebook' | 'new', partnerId, view, … }.
   Two tabs that point at each other through partnerId are a split
   pair: they share one pill in the sidebar and sit side by side.
   ========================================================== */
export const state = {
  tabs: [],              // left-to-right order of a pair is its order here
  activeId: null,
  view: 'reader',        // 'reader' (the open tab or tabs) | 'settings'
  scansion: false,
  notes: loadNotes(),    // { id, text, word, work, book, line, wordIdx, created }
  bookmarks: loadBookmarks(),   // { id, work, book, line, text (snippet of the line), created }
  pickerTabId: null,     // the tab the Switch Work picker is changing
  pairPct: 50,           // width share of the left pane in a split pair
  fontRem: 1.45,         // text size chosen in the editor
  popups: { words: true, notes: true, caesura: true, synizesis: true }   // View Options settings
};

/* Values that several modules read and write. They live on one object because a module
   can't reassign a `let` it imported from another module. */
export const shared = {
  noteCtx: null,            // the word note open in the floating box
  wordCtx: null,            // the word shown in the gloss
  selectedWord: null,       // that word's element
  downInNote: false,        // pointer went down inside the note box (drag-select safety)
  keepCardUntil: 0,         // ignore pane scrolls briefly after a jump so the gloss stays open
  dragging: null,           // { id, previewId } while a tab is being dragged
  notebookDirty: true,      // the notebook cards need rebuilding before they are shown
  suppressTabClick: false,  // the click that ends a tab drag
  suppressNoteClick: false, // the click that ends a note drag
  hoveredPill: null         // the tab pill under the pointer (for the hover card)
};

let tabSeq = 0;
export const newTabId = () => `tab-${Date.now()}-${++tabSeq}`;

// Tab icons (Material Symbols): shield for the Aeneid, swords for the Iliad, sailboat for the Odyssey
export const WORK_ICON = { aeneid: 'shield', iliad: 'swords', odyssey: 'sailing' };

export const getTab = (id) => state.tabs.find((t) => t.id === id);
export const activeTab = () => getTab(state.activeId);
export const partnerOf = (tab) => (tab?.partnerId ? getTab(tab.partnerId) : undefined);
export const workOf = (tab) => WORKS[tab?.work] ?? WORKS.aeneid;
export const isNotebook = (tab) => tab?.kind === 'notebook';
export const isText = (tab) => tab?.kind === 'text';   // a reader; 'new' tabs show the home page

/* The tabs shown together with this one, left to right */
export function groupOf(tab) {
  const p = partnerOf(tab);
  if (!p) return [tab];
  return state.tabs.indexOf(tab) < state.tabs.indexOf(p) ? [tab, p] : [p, tab];
}

