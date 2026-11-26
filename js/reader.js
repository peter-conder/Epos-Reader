import { ROMANS, bookLabel } from './data.js';
import { clamp, el, esc, root } from './dom.js';
import { activeTab, isText, partnerOf, shared, state, workOf } from './state.js';
import { loadBook, loadEnglish } from './book-data.js';
import { beginTranslationClose, playPop } from './motion.js';
import { syncToolbar } from './layout.js';
import { jumpToIndex, makeChunker, mountChunker, scrollToLine, syncChunks } from './chunks.js';
import { scheduleFit } from './fit.js';
import { hideWordCard, showWordCard } from './word-card.js';
import { refreshNoteMarks } from './notes.js';
import { flashLine, refreshBookmarkMarks, renderRail, toggleBookmark } from './bookmarks.js';
import { attachMarkStrip } from './scrollbar.js';
import { bottomBarScroll } from './bottom-bar.js';
import { isMobileTier } from './viewport.js';
import { jumpFromDot } from './mobile-bookmarks.js';
import { lineNumberTap } from './english.js';
import { blockRows, paneScrolled, trackDriver } from './parallel.js';

/* ==========================================================
   READERS: one per text tab
   ========================================================== */
export function createReader(tab) {
  const rootEl = el.tplReader.content.firstElementChild.cloneNode(true);
  rootEl.dataset.tabId = tab.id;
  rootEl.hidden = true;
  tab.view = rootEl;
  tab.ui = {
    root: rootEl,
    workspace: rootEl.querySelector('.workspace'),
    paneOriginal: rootEl.querySelector('.pane-original'),
    paneTranslation: rootEl.querySelector('.pane-translation'),
    divider: rootEl.querySelector('.divider'),
    passage: rootEl.querySelector('.passage'),
    translation: rootEl.querySelector('.translation'),
    titles: rootEl.querySelectorAll('.book-title'),
    renderedKey: null
  };
  el.panes.append(rootEl);
  // The original text's bookmark dots sit on a strip beside its scrollbar (desktop only)
  tab.ui.rail = attachMarkStrip(tab.ui.paneOriginal).rail;
  bindReader(tab);
  // While a pane is being resized the size is set from the estimate alone; it is checked once things settle
  tab.ro = new ResizeObserver(() => {
    renderRail(tab);   // the dots follow the pane's height as it is resized
    scheduleFit(tab, false);
    clearTimeout(tab.fitTimer);
    tab.fitTimer = setTimeout(() => scheduleFit(tab), 150);
  });
  tab.ro.observe(tab.ui.paneOriginal);
  tab.ro.observe(tab.ui.paneTranslation);
}

/* Events that belong to one reader: word clicks, scrolling, and its translation divider */
export function bindReader(tab) {
  const ui = tab.ui;

  ui.passage.addEventListener('click', (e) => {
    const mark = e.target.closest('.verse-bm');
    if (mark) { toggleBookmark(tab, +mark.closest('.verse').dataset.line); return; }   // adds it, or removes it if set
    const num = isMobileTier() && e.target.closest('.verse-num');
    if (num && lineNumberTap(num.closest('.verse'))) return;
    const word = e.target.closest('.word');
    if (word) showWordCard(word);
  });
  ui.rail.addEventListener('click', (e) => {
    const dot = e.target.closest('.bm-dot');
    if (!dot) return;
    if (isMobileTier()) jumpFromDot(tab, +dot.dataset.line);   // to the top of the screen, with a way back
    else flashLine(scrollToLine(tab, +dot.dataset.line));
  });
  ui.paneOriginal.addEventListener('scroll', () => {
    // A popup anchored to the word would drift away from it; the phone's sheet isn't anchored, so it stays
    if (shared.selectedWord && ui.paneOriginal.contains(shared.selectedWord) && performance.now() >= shared.keepCardUntil && !isMobileTier()) hideWordCard();
    syncChunks(ui.chunkers?.[0]);
    paneScrolled(tab, 0);   // the English follows (see parallel.js)
    bottomBarScroll(tab);
  }, { passive: true });
  ui.paneTranslation.addEventListener('scroll', () => {
    syncChunks(ui.chunkers?.[1]);
    paneScrolled(tab, 1);   // and the original follows the English
    bottomBarScroll(tab);
  }, { passive: true });
  trackDriver(tab);

  // Divider: rubber-bands past 80%, snaps the translation closed past 89%
  const dv = { active: false, rect: null, pct: 50, raf: 0 };

  const paint = () => {
    dv.raf = 0;
    if (!dv.active) return;
    const pct = dv.pct;
    const snapping = pct > 89;
    const squashing = !snapping && pct > 80;
    ui.paneTranslation.classList.toggle('snap-target', snapping);
    ui.paneTranslation.classList.toggle('squash', squashing);
    ui.divider.classList.toggle('elastic', snapping);
    const width = snapping ? Math.min(94, pct)
      : squashing ? 80 + (pct - 80) * 0.45      // resistance
      : clamp(pct, 25, 80);
    ui.paneOriginal.style.width = `${width}%`;
  };

  ui.divider.addEventListener('pointerdown', (e) => {
    if (!tab.split) return;
    dv.active = true;
    dv.rect = ui.workspace.getBoundingClientRect();
    dv.pct = tab.splitPct;
    ui.divider.setPointerCapture(e.pointerId);
    ui.divider.classList.add('dragging');
    document.body.classList.add('resizing');
    e.preventDefault();
  });
  ui.divider.addEventListener('pointermove', (e) => {
    if (!dv.active || !dv.rect.width) return;
    dv.pct = ((e.clientX - dv.rect.left) / dv.rect.width) * 100;
    dv.raf ||= requestAnimationFrame(paint);
  });
  const end = (e) => {
    if (!dv.active) return;
    dv.active = false;
    cancelAnimationFrame(dv.raf);
    dv.raf = 0;
    if (ui.divider.hasPointerCapture(e.pointerId)) ui.divider.releasePointerCapture(e.pointerId);
    ui.divider.classList.remove('dragging', 'elastic');
    ui.paneTranslation.classList.remove('squash', 'snap-target');
    document.body.classList.remove('resizing');

    if (dv.pct >= 89) {
      closeTranslation(tab);
    } else if (dv.pct > 80) {
      tab.splitPct = 70;
      animateSplitTo(ui, 70);
    } else {
      tab.splitPct = clamp(dv.pct, 25, 80);
      ui.paneOriginal.style.width = `${tab.splitPct}%`;
    }
  };
  ui.divider.addEventListener('pointerup', end);
  ui.divider.addEventListener('pointercancel', end);
  ui.divider.addEventListener('dblclick', () => {
    if (!tab.split) return;
    tab.splitPct = 50;
    ui.paneOriginal.style.width = '50%';
  });
}

export function renderReader(tab) {
  if (!isText(tab)) return;
  const idx = ROMANS.indexOf(tab.book);
  if (idx === -1 || idx >= workOf(tab).bookCount) tab.book = 'I';
  renderPassage(tab);
  setBookTitles(tab);
  applySplit(tab);
  refreshNoteMarks([tab]);
  refreshBookmarkMarks([tab]);
  scheduleFit(tab);
}

export function renderPassage(tab) {
  const ui = tab.ui;
  const key = `${tab.work}:${tab.book}`;
  if (ui.renderedKey === key) return ui.ready;
  ui.renderedKey = key;
  tab.range = null;   // the old book's lines; set again once this one is on screen (showRange in chunks.js)
  if (shared.selectedWord && ui.passage.contains(shared.selectedWord)) hideWordCard();

  ui.ready = loadBook(tab.work, tab.book).then((data) => {
    if (ui.renderedKey !== key) return;   // the tab moved on while this loaded
    tab.bookData = data;
    if (!data) {
      ui.chunkers = null;
      ui.passage.innerHTML = `<div class="load-error"><p>Couldn\u2019t load Book ${esc(bookLabel(tab.work, tab.book))}.</p><button class="load-retry" type="button">Try again</button></div>`;
      ui.passage.querySelector('.load-retry').addEventListener('click', () => {
        ui.renderedKey = null;
        renderPassage(tab);
      });
      ui.translation.innerHTML = '';
      ui.englishKey = null;
      return;
    }
    const lines = data.lines.map((l) => ({ n: l.n, words: l.w.map((w) => ({ f: w.f, s: w.s })) }));

    // Only a few chunks of each pane are ever in the page (see CHUNKS below)
    const prev = ui.chunkers ?? [];
    // Widest-line guess for the fit: letters, plus about two letters' worth of padding and gap per word
    const verseScore = (l) => l.words.reduce((s, w) => s + w.f.length + 2, 0);
    // The English pane starts empty: its Book's Translation is fetched the first time it is shown (showEnglish)
    ui.chunkers = [
      makeChunker(tab, ui.passage, ui.paneOriginal, lines.map(verseHtml), lines.map(verseScore), prev[0]?.pitch),
      makeChunker(tab, ui.translation, ui.paneTranslation, [], [], prev[1]?.pitch)
    ];
    ui.chunkers[0].lineNums = lines.map((l) => l.n);
    ui.chunkers[1].lineNums = [];
    ui.englishKey = null;
    ui.englishSpans = null;
    ui.chunkers.forEach(mountChunker);
    tab.fitModel = null;   // new text, new widths
    if (wantsEnglish(tab)) showEnglish(tab);
    scheduleFit(tab);
    // A tab brought back from the saved session goes back to its Line once the text has been fitted (see session.js)
    const place = tab.restoreAt;
    tab.restoreAt = null;
    const i = place ? ui.chunkers[0].lineNums.indexOf(place.line) : -1;
    if (i >= 0) requestAnimationFrame(() => jumpToIndex(ui.chunkers[0], i, place.frac ?? 0));
  });
  return ui.ready;
}

/* The English is wanted once it is on screen: beside the original, or swapped in for it on a phone */
const wantsEnglish = (tab) => !!tab.split || tab.lang === 'en';

/* Loads the open Book's Translation into the English pane, once per Book. Resolves when it is in the pane (or
   failed: the pane then offers to try again). One block per Perseus passage (see parallel.js). */
export function showEnglish(tab) {
  const ui = tab.ui;
  const key = ui.renderedKey;
  if (!ui.chunkers || !key) return ui.ready ?? Promise.resolve();
  if (ui.englishKey === key) return ui.englishReady;
  ui.englishKey = key;
  ui.translation.innerHTML = '<p class="trans-status">Loading the English\u2026</p>';
  ui.englishReady = loadEnglish(tab.work, tab.book).then((en) => {
    if (ui.renderedKey !== key || ui.englishKey !== key) return;   // the tab moved on while this loaded
    if (!en?.blocks?.length) {
      ui.englishKey = null;
      ui.translation.innerHTML = `<div class="load-error"><p>Couldn\u2019t load the English for Book ${esc(bookLabel(tab.work, tab.book))}.</p><button class="load-retry" type="button">Try again</button></div>`;
      ui.translation.querySelector('.load-retry').addEventListener('click', () => showEnglish(tab));
      return;
    }
    const verse = en.form === 'verse';
    const ch = makeChunker(tab, ui.translation, ui.paneTranslation, en.blocks.map((b) => blockHtml(b, verse)), [], ui.chunkers[1]?.pitch);
    ch.lineNums = en.blocks.map((b) => b.from);
    ui.englishSpans = blockRows(ui.chunkers[0].lineNums, en.blocks);
    ui.englishBlocks = en.blocks;
    ui.englishForm = en.form;
    ui.chunkers[1] = ch;
    mountChunker(ch);
    tab.fitModel?.delete(ui.paneTranslation);
    ui.needsLink = true;   // start from where the original is, once laid out (see syncLayout)
    scheduleFit(tab);
  });
  return ui.englishReady;
}

/* One English block: Williams keeps his verse lines, Murray is prose */
export function blockHtml(b, verse) {
  const inner = verse
    ? b.text.split('\n').map((l) => `<div class="trans-l">${esc(l)}</div>`).join('')
    : b.text.split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('');
  return `<div class="trans-block${verse ? ' trans-verse' : ''}" data-from="${b.from}">${inner}</div>`;
}

export function verseHtml({ n, words }) {
  const html = words.map((w, j) =>
    `<span class="word" data-i="${j}"${w.s?.at(-1)?.[2]?.includes('c') ? ' data-caesura' : ''}>${wordHtml(w)}</span>`
  ).join('');
  // --nd (digits in the line number) places the bookmark glyph to the left of the number; the glyph is the first
  // child, so the row's last child stays the words (see lineWidth in fit.js)
  const numbered = n === 1 || n % 5 === 0;
  return `<div class="verse" data-line="${n}"${numbered ? ` style="--nd:${String(n).length}"` : ''}>`
    + '<i class="verse-bm bm-glyph" data-tip="Bookmark this line"></i>'
    + `<span class="verse-num" data-n="${n}">${numbered ? n : ''}</span><span class="verse-words">${html}</span></div>`;
}

/* Scansion: each syllable is [text, quantity, flags?]. Quantity is L long, S short, E elided.
   Flags: f foot starts here, c caesura after, h hiatus, z synizesis, r consonantal i,
   d lengthened syllable, m hypermetric (elided into the next line). */
const SCAN_NOTES = { h: 'hiatus', z: 'synizesis', r: 'consonantal i', d: 'lengthened syllable', m: 'hypermetric' };

/* A word's text, split into syllable spans when it has scansion (the spans add no width,
   so the marks can be shown or hidden without refitting the text) */
export function wordHtml(w) {
  const s = w.s;
  if (!s?.length || s.map((x) => x[0]).join('') !== w.f) return esc(w.f);
  return s.map(([text, q, x = '']) => {
    const notes = [...x].map((c) => SCAN_NOTES[c]).filter(Boolean).join(', ');
    return `<span class="syl" data-q="${q}"${x ? ` data-x="${x}"` : ''}${notes ? ` title="${notes}"` : ''}>${esc(text)}</span>`;
  }).join('');
}

/* A word's scansion for the word card, e.g. "vi · rum · que   ⏑ – ⏑" (elided syllables in brackets) */
export function scanText(s) {
  if (!s?.length) return '';
  const sylls = s.map(([t, q]) => {
    const bare = t.replace(/[.,;:!?·᾽’‘“”«»—–]/g, '');
    return q === 'E' ? `(${bare})` : bare;
  }).join(' · ');
  const marks = s.filter(([, q]) => q !== 'E').map(([, q]) => (q === 'L' ? '–' : '⏑')).join(' ');
  return marks ? `${sylls}   ${marks}` : sylls;
}

export function setBookTitles(tab) {
  tab.ui.titles.forEach((t) => { t.textContent = `Book ${bookLabel(tab.work, tab.book)}`; });
}

/* English translation beside the original, per reader */
export function applySplit(tab) {
  const ui = tab.ui, on = !!tab.split;
  ui.root.dataset.split = on ? 'on' : 'off';
  ui.paneTranslation.classList.remove('squash', 'snap-target');
  ui.divider.classList.remove('elastic');
  ui.paneOriginal.style.width = on ? `${tab.splitPct}%` : '';
}

export function toggleSplit() {
  const tab = activeTab();
  if (!isText(tab) || partnerOf(tab)) return;
  if (tab.split) { closeTranslation(tab); return; }
  tab.split = true;
  if (tab.splitPct > 75 || tab.splitPct < 25) tab.splitPct = 50;
  applySplit(tab);
  tab.ui.needsLink = true;   // the English has been out of sight, so it starts again from the original
  showEnglish(tab);
  scheduleFit(tab);
  syncToolbar();
  playPop(tab.ui.paneTranslation);
}

/* Close the English pane: it slides out like a closing split tab (see beginTranslationClose in motion.js) */
export function closeTranslation(tab) {
  if (!tab?.split) return;
  const play = beginTranslationClose(tab);   // while the pane is still on screen
  tab.split = false;
  applySplit(tab);
  syncToolbar();
  play?.();
}

export function animateSplitTo(ui, pct) {
  ui.workspace.classList.add('snapping');
  ui.paneOriginal.style.width = `${pct}%`;
  setTimeout(() => ui.workspace.classList.remove('snapping'), 350);
}

export function toggleScansion() {
  state.scansion = !state.scansion;
  root.dataset.scansion = state.scansion ? 'on' : 'off';
  el.meterBtn.classList.toggle('active', state.scansion);
  el.meterBtn.setAttribute('aria-pressed', String(state.scansion));
  el.swScansion.setAttribute('aria-checked', String(state.scansion));
}
