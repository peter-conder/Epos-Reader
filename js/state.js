import { WORKS, bookRef } from './data.js';
import { loadNotes, loadBookmarks } from './storage.js';
import { isMobileTier } from './viewport.js';

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
  theme: 'light',        // 'light' | 'dark' (set from the saved choice or the system's at start)
  notes: loadNotes(),    // { id, text, word, work, book, line, wordIdx, created }
  bookmarks: loadBookmarks(),   // { id, work, book, line, text (snippet of the line), created }
  pickerTabId: null,     // the tab the Switch Work picker is changing
  pairPct: 50,           // width share of the left pane in a split pair
  fontRem: 1.45,         // text size chosen in the editor
  popups: { words: true, notes: true, caesura: true, rareScansion: false }   // View Options settings
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

/* The part of a text tab's label after the work's abbreviation: "I.1–25" (tab.range is the 25 lines at the middle of
   the pane, kept up to date by showWindow in chunks.js; it is empty until the book has loaded) */
export const tabRef = (tab) => bookRef(tab.work, tab.book, tab.range ?? '');

export const getTab = (id) => state.tabs.find((t) => t.id === id);
export const activeTab = () => getTab(state.activeId);
/* A text tab on screen in the reader (not behind the Notebook or Settings page) */
export const readingText = (tab = activeTab()) => state.view === 'reader' && isText(tab);
/* The tab's Split partner as this screen shows it: phones and tablets show one tab at a time, so none there
   (the pair is kept for when the window is wide again) */
export const shownPartner = (tab) => (isMobileTier() ? undefined : partnerOf(tab));
export const partnerOf = (tab) => (tab?.partnerId ? getTab(tab.partnerId) : undefined);
export const workOf = (tab) => WORKS[tab?.work] ?? WORKS.aeneid;
export const isNotebook = (tab) => tab?.kind === 'notebook';
export const isText = (tab) => tab?.kind === 'text';   // a reader; 'new' tabs show the home page

/* Tabs by when they were last really used, most recent first (the phone's tab grid and swipe order). Using a
   tab means opening it from the grid or the chapter list, or starting to read in it; a quick swipe to peek at
   one doesn't count, so the order never shuffles under the thumb. Ties keep the sidebar's order. */
export const byRecent = () => [...state.tabs].sort((a, b) => (b.usedAt ?? 0) - (a.usedAt ?? 0));
/* The tabs on phones and tablets, most recent first: the Notebook is a page there, not a tab */
export const readingTabs = () => byRecent().filter((t) => t.kind !== 'notebook');
export const markUsed = (tab) => { if (tab) tab.usedAt = Date.now() + (++usedSeq) / 1000; };
let usedSeq = 0;   // two tabs used in the same millisecond still get an order

/* The tabs shown together with this one, left to right */
export function groupOf(tab) {
  const p = partnerOf(tab);
  if (!p) return [tab];
  return state.tabs.indexOf(tab) < state.tabs.indexOf(p) ? [tab, p] : [p, tab];
}

