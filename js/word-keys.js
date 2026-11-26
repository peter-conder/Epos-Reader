import { shared } from './state.js';
import { scrollToLine, visibleLines } from './chunks.js';

/* ==========================================================
   WORD KEYS: moving between words with the keyboard (a roving tabindex)
   Each reader's text is one Tab stop: exactly one of its words has tabindex 0 (the "rover"), the rest -1.
   Tabbing in lands on the selected word, or else the first word on screen. Then:
     ← / →        previous / next word, on across Line ends
     ↑ / ↓        the word in the same place on the Line above / below (its last word if that Line is shorter)
     Home / End   first / last word of the Line
     Enter/Space  opens the Word card (reader.js); Escape closes it and comes back to the word (main.js)
   Only three chunks of Lines are in the page (chunks.js), so a move past them scrolls the Line in first.
   ========================================================== */

const wordsOf = (verse) => [...verse.querySelectorAll('.word')];

/* Whether focus is moving by the Tab key: only then does entering the text jump to the entry word. Focus that
   arrives any other way (a click, Escape from the Word card) stays on the word it was given. */
let tabbing = false;
addEventListener('keydown', (e) => { if (e.key === 'Tab') tabbing = true; }, true);
addEventListener('keyup', (e) => { if (e.key === 'Tab') tabbing = false; }, true);
addEventListener('pointerdown', () => { tabbing = false; }, true);

const keepInView = (word) => word.scrollIntoView({ block: 'nearest', inline: 'nearest' });
const verseOf = (ui, line) => ui.passage.querySelector(`.verse[data-line="${line}"]`);

function setRover(ui, word) {
  if (ui.rover && ui.rover !== word && ui.rover.isConnected) ui.rover.tabIndex = -1;
  word.tabIndex = 0;
  ui.rover = word;
}

/* After chunks change: the rover may have left the page with its chunk, so another word takes the Tab stop */
export function ensureRover(tab) {
  const ui = tab.ui;
  if (ui.rover?.isConnected) return;
  const first = ui.passage.querySelector('.word');
  if (first) setRover(ui, first);
}

/* The word Tab should land on: the selected word in this reader, else the first one on screen */
function entryWord(tab) {
  const ui = tab.ui;
  if (shared.selectedWord && ui.passage.contains(shared.selectedWord)) return shared.selectedWord;
  const shown = visibleLines(ui.chunkers?.[0]);
  const verse = shown && verseOf(ui, shown[0]);
  return (verse && wordsOf(verse)[0]) ?? ui.passage.querySelector('.word');
}

/* The Line `step` Lines away from `verse` (in the Book's order), brought into the page if it isn't there yet */
function lineFrom(tab, verse, step) {
  const ch = tab.ui.chunkers?.[0];
  const nums = ch?.lineNums ?? [];
  const i = nums.indexOf(+verse.dataset.line) + step;
  if (i < 0 || i >= nums.length) return null;
  return verseOf(tab.ui, nums[i]) ?? scrollToLine(tab, nums[i]);
}

function target(tab, word, key) {
  const verse = word.closest('.verse');
  const words = wordsOf(verse);
  const at = words.indexOf(word);
  switch (key) {
    case 'ArrowLeft': {
      if (at > 0) return words[at - 1];
      const prev = lineFrom(tab, verse, -1);
      return prev && wordsOf(prev).at(-1);
    }
    case 'ArrowRight': {
      if (at < words.length - 1) return words[at + 1];
      const next = lineFrom(tab, verse, 1);
      return next && wordsOf(next)[0];
    }
    case 'ArrowUp':
    case 'ArrowDown': {
      const other = lineFrom(tab, verse, key === 'ArrowUp' ? -1 : 1);
      if (!other) return null;
      const ws = wordsOf(other);
      return ws[Math.min(at, ws.length - 1)];
    }
    case 'Home': return words[0];
    case 'End': return words.at(-1);
    default: return undefined;
  }
}

export function bindWordKeys(tab) {
  const ui = tab.ui;
  // Whichever word gets focus (Tab, a click, Escape from the Word card) holds the Tab stop
  ui.passage.addEventListener('focusin', (e) => {
    const word = e.target.closest('.word');
    if (!word) return;
    const tabbedIn = tabbing && !ui.passage.contains(e.relatedTarget);
    const goTo = tabbedIn ? entryWord(tab) : word;
    setRover(ui, goTo);
    if (goTo !== word) goTo.focus({ preventScroll: true });
    if (tabbedIn) keepInView(goTo);
  });
  ui.passage.addEventListener('keydown', (e) => {
    const word = e.target.closest('.word');
    if (!word || e.altKey || e.ctrlKey || e.metaKey) return;
    const next = target(tab, word, e.key);
    if (next === undefined) return;   // not a movement key
    e.preventDefault();
    if (!next || next === word) return;
    next.focus({ preventScroll: true });
    keepInView(next);
  });
}
