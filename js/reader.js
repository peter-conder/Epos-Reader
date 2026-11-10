import { ROMANS, WORKS } from './data.js';
import { clamp, el, esc, root } from './dom.js';
import { activeTab, isText, partnerOf, shared, state, workOf } from './state.js';
import { loadBook } from './book-data.js';
import { playPop, playTranslationExit } from './motion.js';
import { syncToolbar } from './layout.js';
import { makeChunker, mountChunker, scrollToLine, syncChunks } from './chunks.js';
import { scheduleFit } from './fit.js';
import { hideWordCard, showWordCard } from './word-card.js';
import { refreshNoteMarks } from './notes.js';
import { flashLine, refreshBookmarkMarks, renderRail, toggleBookmark, updateRailNear } from './bookmarks.js';
import { attachScrollbar } from './scrollbar.js';

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
  // Each pane gets its own drawn scrollbar; the original text's rail also carries the bookmark dots
  tab.ui.sb = attachScrollbar(tab.ui.paneOriginal);
  tab.ui.rail = tab.ui.sb.dots;
  attachScrollbar(tab.ui.paneTranslation);
  bindReader(tab);
  // While a pane is being resized the size is set from the estimate alone; it is checked once things settle
  tab.ro = new ResizeObserver(() => {
    renderRail(tab);   // the dots follow the scrollbar as the pane is resized
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
    const word = e.target.closest('.word');
    if (word) showWordCard(word);
  });
  ui.sb.rail.addEventListener('sbdrag', () => updateRailNear(tab));   // holding or releasing the thumb
  ui.rail.addEventListener('click', (e) => {
    const dot = e.target.closest('.bm-dot');
    if (dot) flashLine(scrollToLine(tab, +dot.dataset.line));
  });
  ui.paneOriginal.addEventListener('scroll', () => {
    if (shared.selectedWord && ui.paneOriginal.contains(shared.selectedWord) && performance.now() >= shared.keepCardUntil) hideWordCard();
    syncChunks(ui.chunkers?.[0]);
    updateRailNear(tab);
  }, { passive: true });
  ui.paneTranslation.addEventListener('scroll', () => syncChunks(ui.chunkers?.[1]), { passive: true });

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
      playTranslationExit(tab);
      tab.split = false;
      applySplit(tab);
      syncToolbar();
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
    const work = WORKS[tab.work];
    const lines = data
      ? data.lines.map((l) => ({ n: l.n, words: l.w.map((w) => ({ f: w.f, s: w.s })) }))
      : work.lines.map((t, i) => ({ n: i + 1, words: t.trim().split(/\s+/).map((f) => ({ f })) }));
    const trans = work.translations ?? [];

    // Only a few chunks of each pane are ever in the page (see CHUNKS below)
    const prev = ui.chunkers ?? [];
    // Widest-line guess for the fit: letters, plus about two letters' worth of padding and gap per word
    const verseScore = (l) => l.words.reduce((s, w) => s + w.f.length + 2, 0);
    ui.chunkers = [
      makeChunker(tab, ui.passage, ui.paneOriginal, lines.map(verseHtml), lines.map(verseScore), prev[0]?.pitch),
      makeChunker(tab, ui.translation, ui.paneTranslation,
        trans.map((t) => `<div class="translation-line">${esc(t)}</div>`), trans.map((t) => t.length), prev[1]?.pitch)
    ];
    ui.chunkers[0].lineNums = lines.map((l) => l.n);
    ui.chunkers.forEach(mountChunker);
    tab.fitModel = null;   // new text, new widths
    scheduleFit(tab);
  });
  return ui.ready;
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
    + `<span class="verse-num">${numbered ? n : ''}</span><span class="verse-words">${html}</span></div>`;
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
    const bare = t.replace(/[.,;:!?·᾽—–]/g, '');
    return q === 'E' ? `(${bare})` : bare;
  }).join(' · ');
  const marks = s.filter(([, q]) => q !== 'E').map(([, q]) => (q === 'L' ? '–' : '⏑')).join(' ');
  return marks ? `${sylls}   ${marks}` : sylls;
}

export function setBookTitles(tab) {
  tab.ui.titles.forEach((t) => { t.textContent = `Book ${tab.book}`; });
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
  tab.split = !tab.split;
  if (tab.split && (tab.splitPct > 75 || tab.splitPct < 25)) tab.splitPct = 50;
  if (!tab.split) playTranslationExit(tab);   // copy the pane while it is still on screen
  applySplit(tab);
  syncToolbar();
  if (tab.split) playPop(tab.ui.paneTranslation);
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
}
