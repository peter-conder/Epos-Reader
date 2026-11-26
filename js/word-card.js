import { clamp, el } from './dom.js';
import { getTab, shared, state, workOf } from './state.js';
import { wordInfo } from './book-data.js';
import { scanText } from './reader.js';
import { findWordNote, newId, noteById, noteChanged } from './notes.js';
import { syncCardBookmark } from './bookmarks.js';
import { isMobileTier, onTierChange } from './viewport.js';
import { bindSheetDrag, closeFormatSheet } from './format-sheet.js';
import { showChrome } from './bottom-bar.js';

/* Below desktop the card is a bottom sheet rather than a popup by the word (see WORD CARD SHEET in styles.css):
   the selected line is scrolled clear of it, tapping another word swaps what it shows, and the note editor
   is pinned to the top of the screen while it is open (see pinNote). Only one sheet is open at a time, so it closes the Format Text sheet. */
const asSheet = () => isMobileTier();
const SHEET_CLEARANCE = 24;   // px kept between the selected line and the sheet's top edge
const TOP_CLEARANCE = 76;     // …and between it and the top of the screen (the menu button)
let noteHome = null;          // where the note box lives when it isn't inside the sheet

/* ==========================================================
   WORD CARD
   ========================================================== */
export function showWordCard(word) {
  if (!state.popups.words) return;
  closeNote();
  if (asSheet()) closeFormatSheet();
  shared.selectedWord?.classList.remove('selected');
  shared.selectedWord = word;
  word.classList.add('selected');

  const tab = getTab(word.closest('.tab-view').dataset.tabId);
  const clean = word.textContent.replace(/[.,;:!?·᾽’‘“”«»—–]/g, '').trim();
  shared.wordCtx = {
    work: tab.work, book: tab.book,
    line: +word.closest('.verse').dataset.line, wordIdx: +word.dataset.i, word: clean
  };

  const info = wordInfo(tab, shared.wordCtx.line, shared.wordCtx.wordIdx) ?? {
    lemma: clean,
    morph: workOf(tab).formLabel,
    def: 'No analysis for this word yet.'
  };
  el.cardLemma.textContent = info.lemma;
  el.cardMorph.textContent = info.morph;
  el.cardDef.textContent = info.def;
  refreshCardScan(tab);

  syncCardNote();
  if (asSheet()) {
    const wasOpen = el.wordCard.classList.contains('visible');
    el.wordCard.style.left = el.wordCard.style.top = '';
    el.wordCard.classList.add('visible');
    document.documentElement.classList.add('card-open');
    if (!wasOpen) el.wordCard.scrollTop = 0;
    requestAnimationFrame(() => revealAboveSheet(word));
    return;
  }
  positionWordCard(word);

  el.wordCard.classList.remove('visible');
  void el.wordCard.offsetWidth; // replay pop animation
  el.wordCard.classList.add('visible');
}

export function refreshCardScan(tab = null) {
  if (!shared.wordCtx) return;
  const t = tab ?? (shared.selectedWord && getTab(shared.selectedWord.closest('.tab-view')?.dataset.tabId));
  const s = t?.bookData?.byLine.get(shared.wordCtx.line)?.w[shared.wordCtx.wordIdx]?.s;
  const scan = scanText(s, { rare: state.scansion && state.popups.rareScansion });
  el.cardScan.hidden = !scan;
  el.cardScan.textContent = scan;
}

/* Scrolls the selected word's pane so its line sits clear of the sheet (and of the menu button) */
export function revealAboveSheet(word) {
  const pane = word.closest('.pane');
  if (!pane || shared.selectedWord !== word) return;
  // Where the sheet's top will be once it has slid up (it is pinned to the bottom; its rect may still be moving)
  const sheetTop = innerHeight - el.wordCard.offsetHeight;
  const line = (word.closest('.verse') ?? word).getBoundingClientRect();
  let dy = 0;
  if (line.bottom > sheetTop - SHEET_CLEARANCE) dy = line.bottom - (sheetTop - SHEET_CLEARANCE);
  else if (line.top < TOP_CLEARANCE) dy = line.top - TOP_CLEARANCE;
  if (Math.abs(dy) < 1) return;
  shared.keepCardUntil = performance.now() + 600;
  pane.scrollBy({ top: dy, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

export function hideWordCard({ restoreFocus = false } = {}) {
  closeNote();
  shared.wordCtx = null;
  const wasSheet = document.documentElement.classList.contains('card-open');
  document.documentElement.classList.remove('card-open');
  if (wasSheet) showChrome();
  el.wordCard.classList.remove('visible');
  const prev = shared.selectedWord;
  prev?.classList.remove('selected');
  shared.selectedWord = null;
  if (restoreFocus && prev?.isConnected) prev.focus({ preventScroll: true });
}

const NOTE_W = 290;

export function positionWordCard(word) {
  const r = word.getBoundingClientRect();
  const left = Math.max(16, Math.min(r.left + r.width / 2 - 160, innerWidth - 340));
  let top = r.top - el.wordCard.offsetHeight - 10;   // sits just above the word, whatever its height
  let below = false;
  if (top < 70) { top = r.bottom + 12; below = true; }
  el.wordCard.style.transformOrigin = below ? 'center top' : 'center bottom';
  el.wordCard.style.left = `${left}px`;
  el.wordCard.style.top = `${top}px`;
}

/* Shows the word's note inside the gloss and updates the icon */
export function syncCardNote() {
  syncCardBookmark();
  const note = shared.wordCtx && findWordNote(shared.wordCtx);
  const label = note ? 'Edit note' : 'Add note';
  el.cardNote.classList.toggle('has-note', !!note);
  el.cardNote.dataset.tip = label;
  el.cardNote.setAttribute('aria-label', label);
  el.cardNote.hidden = !state.popups.notes;
  el.cardUserNote.hidden = !note || !state.popups.notes;
  if (note) el.cardUserNoteText.textContent = note.text;
  if (shared.selectedWord && el.wordCard.classList.contains('visible') && !asSheet()) positionWordCard(shared.selectedWord);
}

/* ---- Floating note box (word notes) ---- */
export function placeNoteBox(a) {
  const gap = 12, h = el.noteBox.offsetHeight || 200;
  let left, top = a.y;
  if (a.x + a.w + gap + NOTE_W <= innerWidth - 12) left = a.x + a.w + gap;
  else if (a.x - gap - NOTE_W >= 12) left = a.x - gap - NOTE_W;
  else { left = a.x; top = a.y + a.h + gap; }
  el.noteBox.style.left = `${clamp(left, 12, innerWidth - NOTE_W - 12)}px`;
  el.noteBox.style.top = `${clamp(top, 72, Math.max(72, innerHeight - h - 12))}px`;
}

export function openWordNote() {
  if (!shared.wordCtx) return;
  if (shared.noteCtx) { closeNote(); return; }
  const existing = findWordNote(shared.wordCtx);
  shared.noteCtx = { ...shared.wordCtx, noteId: existing?.id };
  el.noteTitle.textContent = `Note on “${shared.wordCtx.word}”`;
  el.noteInput.value = existing?.text ?? '';
  if (asSheet()) pinNote();
  else placeNoteBox({
    x: parseFloat(el.wordCard.style.left), y: parseFloat(el.wordCard.style.top),
    w: el.wordCard.offsetWidth, h: el.wordCard.offsetHeight
  });
  el.noteBox.classList.add('open');
  el.cardNote.setAttribute('aria-expanded', 'true');
  el.noteInput.focus({ preventScroll: true });
  el.noteInput.setSelectionRange(el.noteInput.value.length, el.noteInput.value.length);
  if (asSheet()) { fitPinnedNote(); requestAnimationFrame(revealBelowNote); }
}

/* ---- Pinned note editor (phones and tablets) ----
   A phone's keyboard covers the bottom of the screen without shrinking the page, so a note written in the
   bottom sheet would be hidden behind it. While a note is being written the card steps away and the editor is
   pinned to the top of the screen instead: the word, the text box and a ✓. The text box grows with what is
   written, down to the keyboard's top edge, which is read from the visual viewport (the part of the page left
   visible above the keyboard). ✓ saves and brings the card back; dismissing the keyboard leaves the editor up. */
const PIN_GAP = 10;   // px between the editor and the screen's edges or the keyboard

function pinNote() {
  noteHome ??= el.noteBox.parentElement;
  document.body.append(el.noteBox);
  el.noteBox.classList.add('pinned');
  el.noteBox.style.left = el.noteBox.style.top = '';
  document.documentElement.classList.add('note-pinned');
  visualViewport?.addEventListener('resize', fitPinnedNote);
  visualViewport?.addEventListener('scroll', fitPinnedNote);
}

function unpinNote() {
  if (!el.noteBox.classList.contains('pinned')) return;
  el.noteBox.classList.remove('pinned');
  el.noteBox.style.removeProperty('--pin-top');
  el.noteInput.style.height = '';
  noteHome.append(el.noteBox);
  document.documentElement.classList.remove('note-pinned');
  visualViewport?.removeEventListener('resize', fitPinnedNote);
  visualViewport?.removeEventListener('scroll', fitPinnedNote);
}

/* Scrolls the noted word's line out from under the editor, where the pane has room to */
function revealBelowNote() {
  const word = shared.selectedWord, pane = word?.closest('.pane');
  if (!pane || !el.noteBox.classList.contains('pinned')) return;
  const below = el.noteBox.getBoundingClientRect().bottom + SHEET_CLEARANCE;
  const dy = (word.closest('.verse') ?? word).getBoundingClientRect().top - below;
  if (dy >= 0) return;
  shared.keepCardUntil = performance.now() + 600;
  pane.scrollBy({ top: dy, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

/* Keeps the editor at the top of what is visible, and its text box as tall as its text, short of the keyboard */
function fitPinnedNote() {
  if (!el.noteBox.classList.contains('pinned')) return;
  const vv = visualViewport;
  const top = vv ? vv.offsetTop : 0, visible = vv ? vv.height : innerHeight;
  el.noteBox.style.setProperty('--pin-top', `${top}px`);
  const input = el.noteInput;
  const chrome = el.noteBox.offsetHeight - input.offsetHeight;    // title row and padding
  const boxTop = el.noteBox.getBoundingClientRect().top - top;   // safe area and gap, inside the visible part
  const room = Math.max(96, visible - boxTop - chrome - PIN_GAP);
  input.style.height = 'auto';
  input.style.height = `${Math.min(room, Math.max(96, input.scrollHeight + 2))}px`;
}

export function closeNote() {
  const ctx = shared.noteCtx;
  if (!ctx) return;
  shared.noteCtx = null;
  el.noteBox.classList.remove('open');
  unpinNote();
  el.cardNote.setAttribute('aria-expanded', 'false');
  if (document.activeElement === el.noteInput) el.noteInput.blur();

  const text = el.noteInput.value.trim();
  const note = ctx.noteId ? noteById(ctx.noteId) : null;
  if (note) {
    if (text === note.text) return;
    if (text) note.text = text;
    else state.notes.splice(state.notes.indexOf(note), 1);
    noteChanged();
  } else if (text) {
    state.notes.unshift({ id: newId(), text, word: ctx.word, work: ctx.work, book: ctx.book,
      line: ctx.line, wordIdx: ctx.wordIdx, created: Date.now() });
    noteChanged();
  }
}

export function initWordCard() {
  // A popup by a word would be left behind by a resize. The sheet isn't anchored, and a phone's keyboard opening
  // for a note can resize the window, so it stays; crossing a tier closes either.
  addEventListener('resize', () => { if (!asSheet()) hideWordCard(); });
  onTierChange(hideWordCard);
  bindSheetDrag(el.wordCard, '.card-grip, .card-lemma, .card-morph', hideWordCard, asSheet);
  el.wordCard.insertAdjacentHTML('afterbegin', '<div class="card-grip" aria-hidden="true"><span></span></div>');
  el.cardNote.addEventListener('click', openWordNote);
  el.cardUserNote.addEventListener('click', openWordNote);
  el.cardUserNote.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWordNote(); }
  });
  el.noteInput.addEventListener('input', fitPinnedNote);
  el.noteDone.addEventListener('click', closeNote);   // saves; the card comes back (see .note-pinned in styles.css)
  el.noteInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); closeNote(); }
  });
  document.addEventListener('pointerdown', (e) => { shared.downInNote = !!e.target.closest('#note-box'); }, true);
}
