import { el, root } from './dom.js';
import { activeTab, readingText, state } from './state.js';
import { jumpToIndex, readableRange } from './chunks.js';
import { flashLine, isMarked, toggleBookmark } from './bookmarks.js';
import { isMobileTier, onTierChange, tier } from './viewport.js';

/* ==========================================================
   BOOKMARKS ON PHONES AND TABLETS, Kindle-style
   - A ribbon hangs from the top edge at the top right. Tap it to bookmark the first Line you can read at the top of the
     screen. It is filled while any Bookmarked Line is on screen; tapping it then removes the topmost one.
     Empty, it fades with the menu button and bottom bar; filled, it stays while you read.
   - The strip down the right edge (see scrollbar.js) shows a dot per Bookmark; tapping one puts its Line at
     the top of the screen, where the ribbon reads from, and offers "Back to line N" above the bottom bar.
   These are the same Bookmarks as everywhere else (one Line each). Only on the Latin: not while the English
   is swapped in, and not on the Notebook or Home.
   ========================================================== */
const BACK_MS = 8000;   // the "Back to" chip goes after this long…
let back = null;        // { tab, i, frac, line, landed, timer }: where a dot jump came from

/* The reader the ribbon works on, with its Latin chunker, or null */
function current() {
  const tab = activeTab();
  if (!isMobileTier() || !readingText(tab) || (tab.lang === 'en' && tier() === 'compact')) return null;
  const ch = tab.ui?.chunkers?.[0];
  return ch?.lineNums ? { tab, ch } : null;
}

/* The Bookmarks on screen, topmost first */
function onScreen(tab, ch) {
  const r = readableRange(ch);
  if (!r) return [];
  return state.bookmarks
    .filter((b) => isMarked(b, tab))
    .map((b) => ({ b, i: ch.lineNums.indexOf(b.line) }))
    .filter(({ i }) => i >= r[0] && i <= r[1])
    .sort((a, b) => a.i - b.i);
}

/* Brings the ribbon up to date: shown or not, filled or not. Called on scroll, layout, tab and Bookmark changes. */
export function syncRibbon() {
  const cur = current();
  el.bmRibbon.hidden = !cur;
  if (!cur) { hideBack(); return; }
  const filled = onScreen(cur.tab, cur.ch).length > 0;
  el.bmRibbon.classList.toggle('filled', filled);
  el.bmRibbon.setAttribute('aria-pressed', String(filled));
  el.bmRibbon.setAttribute('aria-label', filled ? 'Remove the Bookmark on screen' : 'Bookmark the top line');
  // Read on past where a dot jump landed and the way back is no longer wanted
  if (back && (back.tab !== cur.tab || Math.abs(cur.ch.pane.scrollTop - back.landed) > cur.ch.pane.clientHeight)) hideBack();
}

function tapRibbon() {
  const cur = current();
  if (!cur) return;
  const [top] = onScreen(cur.tab, cur.ch);
  if (top) toggleBookmark(cur.tab, top.b.line);   // removes the topmost one on screen
  else {
    const r = readableRange(cur.ch);
    if (r) toggleBookmark(cur.tab, cur.ch.lineNums[r[0]]);
  }
  el.bmRibbon.classList.remove('drop');
  void el.bmRibbon.offsetWidth;
  el.bmRibbon.classList.add('drop');   // a little drop as it fills or empties
}

/* ---- Jumping from a dot, and back ---- */

/* Puts a Bookmarked Line at the top of the screen and offers the way back */
export function jumpFromDot(tab, line) {
  const ch = tab.ui?.chunkers?.[0];
  const i = ch?.lineNums?.indexOf(line) ?? -1;
  if (i < 0) return;
  const from = ch.anchor ? { ...ch.anchor } : null;
  const fromLine = ch.lineNums[from?.i ?? 0];
  jumpToIndex(ch, i);
  flashLine(ch.container.querySelector(`.verse[data-line="${line}"]`));
  hideBack();
  back = { tab, i: from?.i ?? null, frac: from?.frac ?? 0, line: fromLine, landed: ch.pane.scrollTop };
  back.timer = setTimeout(hideBack, BACK_MS);
  el.backChipText.textContent = `Back to Line ${fromLine}`;
  el.backChip.hidden = false;
  syncRibbon();
}

function hideBack() {
  if (!back) return;
  clearTimeout(back.timer);
  back = null;
  el.backChip.hidden = true;
}

function goBack() {
  const b = back;
  hideBack();
  if (!b || b.tab !== activeTab()) return;
  jumpToIndex(b.tab.ui.chunkers[0], b.i, b.frac);
  syncRibbon();
}

export function initMobileBookmarks() {
  el.bmRibbon.addEventListener('click', tapRibbon);
  el.backChip.addEventListener('click', goBack);
  onTierChange(syncRibbon);
  root.addEventListener('animationend', (e) => { if (e.target === el.bmRibbon) el.bmRibbon.classList.remove('drop'); });
  syncRibbon();
}
