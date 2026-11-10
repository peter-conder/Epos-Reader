import { WORKS } from './data.js';
import { el, esc, icon } from './dom.js';
import { isNotebook, isText, shared, state } from './state.js';
import { saveNotes } from './storage.js';
import { activateTab, addTab } from './tabs.js';
import { scrollToLine } from './chunks.js';
import { showWordCard, syncCardNote } from './word-card.js';
import { flashLine, renderBookmarks } from './bookmarks.js';
import { attachScrollbar } from './scrollbar.js';

/* ==========================================================
   NOTES
   - Word notes: written from the gloss popup, tied to a book,
     line and word. They show inside the gloss and mark the word.
   - Notebook notes: written and edited right on the Notebook
     page, tied to nothing.
   Saved in localStorage when available.
   ========================================================== */

export const noteById = (id) => state.notes.find((n) => n.id === id);
export const newId = () => `n-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const isTied = (n) => !!(n.work && n.line && WORKS[n.work]);

export function findWordNote(c) {
  return state.notes.find((n) => n.wordIdx != null && n.work === c.work && n.book === c.book
    && n.line === c.line && n.wordIdx === c.wordIdx);
}

export function countLabel() {
  const n = state.notes.filter((x) => !x.draft).length;
  return `${n} ${n === 1 ? 'note' : 'notes'}`;
}

export const noteSource = (n) => `${WORKS[n.work]?.title ?? n.work} · Book ${n.book} · Line ${n.line}`;

/* Everything that has to refresh after any change to the notes.
   Edits made on the Notebook page already updated their own card. */
export function noteChanged(fromNotebook = false) {
  saveNotes(state.notes);
  if (fromNotebook) updateNotebookHeader();
  else if (!el.viewNotebook.hidden && !el.panes.hidden) renderNotebook();
  else shared.notebookDirty = true;
  refreshNoteMarks();
  syncCardNote();
}

/* ---- Notebook tab ---- */
export function openNotebook() {
  const existing = state.tabs.find(isNotebook);
  if (existing) {
    activateTab(existing.id);
    return;
  }
  const tab = { id: 'tab-notebook', kind: 'notebook', partnerId: null, view: el.viewNotebook, fresh: true };
  el.viewNotebook.dataset.tabId = tab.id;
  state.tabs.push(tab);
  shared.notebookDirty = true;
  activateTab(tab.id);
}

export function updateNotebookHeader() {
  const b = state.bookmarks.length;
  el.nbCount.textContent = `${countLabel()} · ${b} ${b === 1 ? 'bookmark' : 'bookmarks'}`;
  el.nbBmCount.textContent = String(b);
  el.nbEmpty.hidden = state.notes.length > 0;
  el.noteGrid.hidden = state.notes.length === 0;
}

export function noteCardHtml(n) {
  return `
    <article class="note-card" data-note-id="${n.id}">
      <div class="note-edit" data-value="${esc(n.text)}">
        <textarea class="note-text" rows="1" placeholder="Write a note…" aria-label="Note text">${esc(n.text)}</textarea>
      </div>
      ${isTied(n) ? `
      <button class="note-jump" data-tip="Jump to this word in the text">
        ${n.word ? `<span class="note-word">${esc(n.word)}</span>` : ''}
        <span class="note-src">${esc(noteSource(n))}${icon('jump')}</span>
      </button>` : ''}
      <button class="note-del" data-tip="Delete note" aria-label="Delete note">${icon('trash')}</button>
    </article>`;
}

export function renderNotebook() {
  shared.notebookDirty = false;
  updateNotebookHeader();
  el.noteGrid.innerHTML = state.notes.map(noteCardHtml).join('');
  renderBookmarks();
}

/* Open the note's text in a tab (reusing one already on that book, which keeps
   a split intact), scroll to the line and open the word's gloss. */
export async function jumpToLine(work, book, line, wordIdx = null) {
  let tab = state.tabs.find((t) => isText(t) && t.work === work && t.book === book);
  if (tab) activateTab(tab.id); else tab = addTab(work, book);
  await tab.ui.ready;

  shared.keepCardUntil = performance.now() + 600;
  // Deferred so the click that started the jump can't dismiss the gloss we are about to open,
  // and so the text has been fitted (which sets the row height the scroll position is worked out from).
  requestAnimationFrame(() => {
    const verse = scrollToLine(tab, line);   // the line's chunk may not have been in the page
    if (!verse) return;
    const word = wordIdx != null ? verse.querySelector(`.word[data-i="${wordIdx}"]`) : null;
    verse.scrollIntoView({ block: 'center' });
    if (word) showWordCard(word); else flashLine(verse);
  });
}

export const jumpToNote = (note) => jumpToLine(note.work, note.book, note.line, note.wordIdx);

/* ---- Marks and gloss ---- */
export function refreshNoteMarks(tabs = state.tabs) {
  for (const tab of tabs) {
    if (!isText(tab)) continue;
    tab.ui.passage.querySelectorAll('.word.has-note').forEach((w) => w.classList.remove('has-note'));
    markNotes(tab, tab.ui.passage);
  }
}

/* Marks the noted words inside `scope` (the passage, or one chunk as it is added) */
export function markNotes(tab, scope) {
  for (const n of state.notes) {
    if (n.wordIdx == null || n.work !== tab.work || n.book !== tab.book) continue;
    scope.querySelector(`.verse[data-line="${n.line}"] .word[data-i="${n.wordIdx}"]`)?.classList.add('has-note');
  }
}

export function initNotes() {
  attachScrollbar(el.notebookPane);

  /* New notes start as an empty card at the top, focused and ready to type.
     An empty card that loses focus simply disappears. */
  el.newNoteBtn.addEventListener('click', () => {
    const draft = { id: newId(), text: '', word: '', work: null, book: null, line: null, wordIdx: null, created: Date.now(), draft: true };
    state.notes.unshift(draft);
    renderNotebook();
    el.notebookPane.scrollTop = 0;
    el.noteGrid.querySelector(`[data-note-id="${draft.id}"] .note-text`).focus();
  });

  /* Typing keeps the hidden mirror in sync so the card grows with the text */
  el.noteGrid.addEventListener('input', (e) => {
    const ta = e.target.closest('.note-text');
    if (ta) ta.parentElement.dataset.value = ta.value;
  });

  /* Leaving a card's text saves it (an emptied card is deleted) */
  el.noteGrid.addEventListener('focusout', (e) => {
    const ta = e.target.closest?.('.note-text');
    const card = ta?.closest('.note-card');
    const note = card && noteById(card.dataset.noteId);
    if (!note) return;
    const text = ta.value.trim();
    if (!text) {
      state.notes.splice(state.notes.indexOf(note), 1);
      card.remove();
      noteChanged(true);
    } else if (note.draft || text !== note.text) {
      delete note.draft;
      note.text = text;
      ta.value = text;
      ta.parentElement.dataset.value = text;
      noteChanged(true);
    }
  });

  el.noteGrid.addEventListener('keydown', (e) => {
    const inText = e.target.classList.contains('note-text');
    if (inText && (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey)))) {
      e.preventDefault();
      e.target.blur();
    }
  });

  /* Click a card (outside its text) to jump to the word; trash deletes */
  el.noteGrid.addEventListener('click', (e) => {
    if (shared.suppressNoteClick) return;   // the click that ends a drag
    const card = e.target.closest('.note-card');
    const note = card && noteById(card.dataset.noteId);
    if (!note || e.target.closest('.note-edit')) return;
    if (e.target.closest('.note-del')) {
      state.notes.splice(state.notes.indexOf(note), 1);
      card.remove();
      noteChanged(true);
    } else if (isTied(note)) {
      jumpToNote(note);
    }
  });
}
