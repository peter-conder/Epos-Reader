import { ROMANS, LEXICON, WORKS } from './data.js';
  /* ==========================================================
     DATA
     ========================================================== */

  

  /* ==========================================================
     HELPERS & DOM REFERENCES
     ========================================================== */
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const icon = (name) => `<svg class="icon"><use href="assets/icons.svg#i-${name}"/></svg>`;
  const newTabId = () => `tab-${Date.now()}-${++tabSeq}`;

  // Tab icons (Material Symbols): shield for the Aeneid, swords for the Iliad, sailboat for the Odyssey
  const WORK_ICON = { aeneid: 'shield', iliad: 'swords', odyssey: 'sailing' };

  const el = {
    menuBtn: $('btn-menu'), brandBtn: $('btn-brand'), brandTitle: $('brand-title'), drawer: $('drawer'), paletteMenu: $('palette-menu'),
    progress: $('progress'), segments: $('segments'),
    sidebar: $('sidebar'), tabList: $('tab-list'), addTab: $('btn-add-tab'), addNotebook: $('btn-add-notebook'),
    topLeft: document.querySelector('.top-left'), topRight: document.querySelector('.top-right'),
    main: $('main'), panes: $('panes'), dropHint: $('drop-hint'), tplReader: $('tpl-reader'),
    viewEmpty: $('view-empty'), viewSettings: $('view-settings'), viewNotebook: $('view-notebook'),
    notebookPane: $('notebook-pane'), noteGrid: $('note-grid'), nbCount: $('nb-count'), nbEmpty: $('nb-empty'),
    newNoteBtn: $('btn-new-note'),
    bmList: $('bm-list'), bmEmpty: $('bm-empty'), nbBmCount: $('nb-bm-count'), cardBookmark: $('card-bookmark'),
    settingsChips: $('settings-chips'), paletteChips: $('palette-chips'),
    splitBtn: $('btn-split'), meterBtn: $('btn-meter'), textBtn: $('btn-text'),
    popupsBtn: $('btn-popups'), popupsFlyout: $('popups-flyout'), swWords: $('sw-words'), swNotes: $('sw-notes'),
    swCaesura: $('sw-caesura'), swSynizesis: $('sw-synizesis'),
    flyout: $('flyout'), fontSlider: $('font-size'), sizeSlider: $('size-slider'),
    picker: $('picker'), pickerTitle: $('picker-title'), workList: $('work-list'),
    bookPicker: $('book-picker'), booksGrid: $('books-grid'), backBtn: $('btn-back'),
    hoverCard: $('hover-card'), hoverCite: $('hover-cite'), hoverDesc: $('hover-desc'), hoverSwitch: $('btn-hover-switch'),
    wordCard: $('word-card'), cardLemma: $('card-lemma'), cardMorph: $('card-morph'), cardScan: $('card-scan'), cardDef: $('card-def'),
    cardNote: $('card-note'), cardUserNote: $('card-user-note'), cardUserNoteText: $('card-user-note-text'),
    noteBox: $('note-box'), noteTitle: $('note-title'), noteInput: $('note-input'),
    toast: $('toast')
  };

  const MIN_FONT = parseFloat(el.fontSlider.min);

  /* ==========================================================
     WORD DATA: one JSON file per book, plus a shared dictionary
     ========================================================== */
  const DATA_ROOT = 'data2';   // folder the book and dictionary files are read from
  const bookCache = new Map();
  let lexiconPromise = null;
  let LEX = {};

  function loadLexicon() {
    lexiconPromise ??= fetch(`${DATA_ROOT}/lexicon/latin.json`)
      .then((r) => r.json()).then((lex) => { LEX = lex; }).catch(() => {});
    return lexiconPromise;
  }
  loadLexicon();   // start the big dictionary download now rather than when the first book opens

  /* The book's data, or null when there's no file for it yet (the Greek works, for now) */
  function loadBook(work, book) {
    const key = `${work}:${book}`;
    if (!bookCache.has(key)) {
      const num = String(ROMANS.indexOf(book) + 1).padStart(2, '0');
      bookCache.set(key, Promise.all([
        fetch(`${DATA_ROOT}/${work}/${num}.json`).then((r) => (r.ok ? r.json() : null)),
        loadLexicon()
      ]).then(([data]) => {
        if (data) data.byLine = new Map(data.lines.map((l) => [l.n, l]));
        return data;
      }).catch(() => null));
    }
    return bookCache.get(key);
  }

  /* Lemma, grammar and definition for one word */
  function wordInfo(tab, line, idx) {
    const parts = tab.bookData?.byLine.get(line)?.w[idx]?.a;
    if (!parts?.length) return null;
    const e = parts.map((p) => ({ ...(LEX[p.l] ?? { head: p.l.split(':')[0] }), morph: p.m }));
    return {
      lemma: e.map((x) => x.head).join(' + '),
      morph: e.map((x) => x.morph).join(' + '),
      def: e.map((x) => x.def ?? (x.pos === 'proper noun' ? 'Proper name.' : 'No definition yet.')).join('  |  ')
    };
  }

  /* ==========================================================
     STATE
     Every open tab is { id, kind: 'text' | 'notebook' | 'new', partnerId, view, … }.
     Two tabs that point at each other through partnerId are a split
     pair: they share one pill in the sidebar and sit side by side.
     ========================================================== */
  const NOTES_KEY = 'epos.notes.v1';
  const BOOKMARKS_KEY = 'epos.bookmarks.v1';

  const state = {
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
  let noteCtx = null;       // the word note open in the floating box
  let wordCtx = null;       // the word shown in the gloss
  let selectedWord = null;  // that word's element
  let downInNote = false;   // pointer went down inside the note box (drag-select safety)
  let keepCardUntil = 0;    // ignore pane scrolls briefly after a jump so the gloss stays open
  let dragging = null;      // { id, previewId } while a tab is being dragged
  let notebookDirty = true; // the notebook cards need rebuilding before they are shown
  let tabSeq = 0;
  let lastShown = [];       // ids of the tabs that were on screen after the last render
  let hoverTimer = 0;       // tab hover card
  let hoveredPill = null;
  let hoveredTabId = null;

  const getTab = (id) => state.tabs.find((t) => t.id === id);
  const activeTab = () => getTab(state.activeId);
  const partnerOf = (tab) => (tab?.partnerId ? getTab(tab.partnerId) : undefined);
  const workOf = (tab) => WORKS[tab?.work] ?? WORKS.aeneid;
  const isNotebook = (tab) => tab?.kind === 'notebook';
  const isText = (tab) => tab?.kind === 'text';   // a reader; 'new' tabs show the home page

  /* The tabs shown together with this one, left to right */
  function groupOf(tab) {
    const p = partnerOf(tab);
    if (!p) return [tab];
    return state.tabs.indexOf(tab) < state.tabs.indexOf(p) ? [tab, p] : [p, tab];
  }

  /* ==========================================================
     TOAST: "Tab closed" with an Undo button for three seconds
     ========================================================== */
  let toastTimer, pendingUndo = null;
  function hideToast() {
    clearTimeout(toastTimer);
    pendingUndo = null;
    el.toast.classList.remove('show');
  }
  function showUndo(snap) {
    pendingUndo = snap;
    el.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 3000);
  }
  $('toast-undo').addEventListener('click', () => {
    const snap = pendingUndo;
    hideToast();
    if (snap) undoClose(snap);
  });

  /* ==========================================================
     POPOVERS (drawer, flyouts, picker)
     ========================================================== */
  const TRIGGERS = new Map([[el.drawer, el.menuBtn], [el.flyout, el.textBtn], [el.popupsFlyout, el.popupsBtn]]);

  function setOpen(popover, open) {
    popover.classList.toggle('open', open);
    TRIGGERS.get(popover)?.setAttribute('aria-expanded', String(open));
  }

  function closePopovers(except) {
    [el.picker, el.drawer, el.paletteMenu, el.flyout, el.popupsFlyout].forEach((p) => p !== except && setOpen(p, false));
    closeNote();
  }

  /* ==========================================================
     VIEWS: show the open tab, or the two tabs of a split
     ========================================================== */
  function renderView() {
    const hasTabs = state.tabs.length > 0;
    const tab = activeTab();
    const settings = state.view === 'settings';
    const showPanes = hasTabs && !settings;
    el.viewEmpty.hidden = hasTabs || settings;
    el.viewSettings.hidden = !settings;
    el.panes.hidden = !showPanes;

    const shown = showPanes ? groupOf(tab) : [];
    el.panes.dataset.count = shown.length;
    // A pane that joins one already on screen grows in from nothing
    const joined = shown.length === 2 ? shown.filter((t) => !lastShown.includes(t.id)) : [];
    const animateJoin = joined.length === 1 && lastShown.length > 0;
    for (const t of state.tabs) {
      const on = shown.includes(t);
      t.view.hidden = !on;
      t.view.classList.toggle('is-active', on && shown.length > 1 && t.id === state.activeId);
      if (on) t.view.style.order = shown.indexOf(t) * 2;
    }
    if (animateJoin) { growDur(420); joined[0].view.style.flex = '0 1 0'; void el.panes.offsetWidth; }
    shown.forEach((t, i) => {
      t.view.style.flex = shown.length > 1 ? `${i === 0 ? state.pairPct : 100 - state.pairPct} 1 0` : '100 1 0';
    });
    if (animateJoin) playEnter(joined[0].view, shown.indexOf(joined[0]) === 0 ? -1 : 1);
    shown.forEach((t) => {
      if (!t.fresh) return;
      t.fresh = false;
      if (!(animateJoin && t === joined[0])) playPop(t.view);
    });
    lastShown = shown.map((t) => t.id);
    el.progress.hidden = !hasTabs || !isText(tab);
    alignProgress();
  }

  /* The book bar sits right over the reading area: same centre, and as wide as the reading pane
     (a lone pane is as wide as the main area, up to --reader-max, and centred in it). Measured from the
     main area, so it also follows the sidebar while that opens and closes. It stays clear of the menu
     and name on the left, and of the spacer on the right, by shrinking evenly on both sides. */
  function alignProgress() {
    const bar = el.progress;
    if (bar.hidden) return;
    const main = el.main.getBoundingClientRect();
    const max = parseFloat(getComputedStyle(root).getPropertyValue('--reader-max')) || 860;
    const gap = 24;                                              // the top bar's own gap between its parts
    const cx = main.left + main.width / 2;
    const room = Math.min(cx - (el.topLeft.getBoundingClientRect().right + gap),
                          el.topRight.getBoundingClientRect().left - gap - cx);
    const half = Math.max(0, Math.min(max / 2, main.width / 2, room));
    bar.style.left = `${cx - half}px`;
    bar.style.width = `${half * 2}px`;
  }
  new ResizeObserver(alignProgress).observe(el.main);

  /* ---- Pane motion helpers ---- */
  const SPRING = 'cubic-bezier(0.3, 0.7, 0.4, 1)';

  // How long panes take to spring to their new widths; set per event, then cleared
  let growTimer = 0;
  function growDur(ms) {
    el.panes.style.setProperty('--grow-dur', `${ms}ms`);
    clearTimeout(growTimer);
    growTimer = setTimeout(() => el.panes.style.removeProperty('--grow-dur'), ms + 120);
  }

  function playEnter(view, dir) {
    view.animate([
      { opacity: 0, transform: `translateX(${dir * 70}px) scale(0.82)`, offset: 0, easing: SPRING },
      { opacity: 1, transform: `translateX(${-dir * 10}px) scale(1.035)`, offset: 0.5, easing: SPRING },
      { transform: `translateX(${dir * 4}px) scale(0.99)`, offset: 0.72, easing: SPRING },
      { transform: `translateX(${-dir * 1.5}px) scale(1.004)`, offset: 0.88, easing: SPRING },
      { transform: 'none', offset: 1 }
    ], { duration: 640, easing: 'linear' });
  }

  function playPop(view) {
    view.animate([
      { opacity: 0, transform: 'translateY(12px) scale(0.93)', offset: 0, easing: SPRING },
      { opacity: 1, transform: 'translateY(-3px) scale(1.02)', offset: 0.5, easing: SPRING },
      { transform: 'scale(0.994)', offset: 0.76, easing: SPRING },
      { transform: 'none', offset: 1 }
    ], { duration: 470, easing: 'linear' });
  }

  /* A frozen copy of a pane, clipped inside the main area, so it can animate out after its tab is gone */
  function makeGhost(view, rect) {
    const m = el.main.getBoundingClientRect();
    const g = view.cloneNode(true);
    g.removeAttribute('id');
    g.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    g.hidden = false;
    g.classList.remove('is-active');
    Object.assign(g.style, {
      position: 'absolute', left: `${rect.left - m.left}px`, top: `${rect.top - m.top}px`,
      width: `${rect.width}px`, height: `${rect.height}px`,
      margin: '0', flex: 'none', order: '0', transform: 'none',
      pointerEvents: 'none', zIndex: '30', transition: 'none'
    });
    el.main.append(g);
    const src = view.querySelectorAll('.pane'), dst = g.querySelectorAll('.pane');
    src.forEach((pn, i) => { if (dst[i]) dst[i].scrollTop = pn.scrollTop; });
    return g;
  }

  /* Closing a pane: it shrinks away toward its own side */
  function playExit(tab) {
    const v = tab.view;
    if (!v || v.hidden || el.panes.hidden) return;
    const r = v.getBoundingClientRect();
    if (!r.width) return;
    const g = groupOf(tab);
    const dir = g.length === 2 ? (g[0] === tab ? -1 : 1) : 0;
    shrinkAway(makeGhost(v, r), dir);
  }

  /* Every pane closes the same way: a small swell, then it bouncily shrinks away into the edge it sat against */
  function shrinkAway(ghost, dir) {
    ghost.style.transformOrigin = dir < 0 ? 'left center' : dir > 0 ? 'right center' : 'center';
    ghost.animate([
      { transform: 'scale(1)', opacity: 1, offset: 0, easing: SPRING },
      { transform: 'scale(1.045)', opacity: 1, offset: 0.24, easing: 'cubic-bezier(0.55, 0, 0.85, 0.4)' },
      { transform: 'scale(0.5)', opacity: 1, offset: 0.7, easing: 'ease-in' },
      { transform: 'scale(0)', opacity: 0, offset: 1 }
    ], { duration: 520, easing: 'linear' }).onfinish = () => ghost.remove();
  }

  /* The English pane closing: same shrink, run on a frozen copy because the real pane is hidden at once */
  function playTranslationExit(tab) {
    const ui = tab.ui;
    if (!ui || ui.root.hidden || el.panes.hidden) return;
    const pane = ui.paneTranslation;
    const r = pane.getBoundingClientRect();
    if (!r.width) return;
    const ghost = makeGhost(pane, r);
    ghost.style.display = 'block';
    ghost.classList.remove('squash', 'snap-target');
    const cs = getComputedStyle(ui.root);
    for (const name of ['--reading-font-size', '--reading-trans-font-size']) ghost.style.setProperty(name, cs.getPropertyValue(name));
    ghost.scrollTop = pane.scrollTop;
    shrinkAway(ghost, 1);
  }

  function setView(view) {
    state.view = view;
    closePopovers();
    hideWordCard();
    renderView();
  }

  /* Toolbar reflects the active tab */
  function syncToolbar() {
    const tab = activeTab();
    const paired = !!partnerOf(tab);
    const on = !!(isText(tab) && tab.split) && !paired;
    el.splitBtn.classList.toggle('active', on);
    el.splitBtn.classList.toggle('disabled', paired);
    el.splitBtn.setAttribute('aria-pressed', String(on));
    el.splitBtn.setAttribute('aria-disabled', String(paired));
    el.splitBtn.dataset.tip = paired ? 'Unavailable in split view' : 'Parallel English';
  }

  /* The name in the top bar turns Greek while a Greek text is the open tab */
  function renderBrand() {
    const tab = activeTab();
    const greek = isText(tab) && workOf(tab).shortLanguage === 'Greek';
    el.brandTitle.textContent = greek ? '\u0395\u03C0\u03BF\u03C2' : 'Epos';
    el.brandTitle.lang = greek ? 'grc' : 'en';
  }

  function renderAll() {
    renderView();
    if (notebookDirty && !el.viewNotebook.hidden && !el.panes.hidden) renderNotebook();
    renderTabs();
    renderSegments();
    renderBrand();
    syncToolbar();
    const tab = activeTab();
    if (isText(tab)) syncSettingsChips(tab.work);
  }

  /* ==========================================================
     TABS (sidebar)
     ========================================================== */
  const iconName = (tab) => (isNotebook(tab) ? 'notebook' : isText(tab) ? WORK_ICON[tab.work] : 'plus');
  const tabName = (tab) => (isNotebook(tab) ? 'Notebook' : isText(tab) ? workOf(tab).title : 'New Tab');

  /* Expanded: "Book II". Compact (half of a split): "II". The notebook and new tabs have no text when compact. */
  function tabHtml(tab, { compact = false, extra = '' } = {}) {
    const text = isText(tab);
    const active = tab.id === state.activeId;
    const label = text ? (compact ? tab.book : `Book ${tab.book}`) : (compact ? '' : tabName(tab));
    const full = text ? `${workOf(tab).title} · Book ${tab.book}` : tabName(tab);
    return `
      <div class="tab${compact ? ' tab-half' : ''}${active ? ' active' : ''}${extra}" data-tab-id="${tab.id}" role="tab" tabindex="0" aria-selected="${active}" aria-label="${esc(full)}">
        <span class="tab-left">
          <svg class="icon tab-icon"><use href="assets/icons.svg#i-${iconName(tab)}"/></svg>
          ${label ? `<span class="tab-title">${label}</span>` : ''}
        </span>
        <button class="tab-close" data-tip="Close Tab" data-tip-side="bottom" aria-label="Close tab">${icon('close')}</button>
      </div>`;
  }

  /* The half of a pill that shows where a dragged tab would land */
  function previewHalfHtml(tab) {
    const label = isText(tab) ? tab.book : '';
    return `
      <div class="tab tab-half preview-half" aria-hidden="true">
        <span class="tab-left">
          <svg class="icon tab-icon"><use href="assets/icons.svg#i-${iconName(tab)}"/></svg>
          ${label ? `<span class="tab-title">${label}</span>` : ''}
        </span>
      </div>`;
  }

  function renderTabs() {
    hoveredPill = null; // the old pill elements are about to be replaced
    const drag = dragging;
    const dragged = drag && getTab(drag.id);
    const activeIds = new Set(state.activeId ? groupOf(activeTab()).map((t) => t.id) : []);
    const half = (t) => tabHtml(t, {
      compact: true,
      extra: activeIds.size > 1 && activeIds.has(t.id) && t.id !== state.activeId ? ' partner' : ''
    });
    // While a tab is being dragged it counts as detached from its partner
    const livePartner = (t) => {
      const p = partnerOf(t);
      return p && !(drag && (drag.id === t.id || drag.id === p.id)) ? p : null;
    };

    const seen = new Set();
    let html = '';
    for (const tab of state.tabs) {
      if (seen.has(tab.id)) continue;
      seen.add(tab.id);
      const p = livePartner(tab);
      if (p) {
        seen.add(p.id);
        html += `<div class="tab-group">${groupOf(tab).map(half).join('')}</div>`;
      } else if (dragged && drag.previewId === tab.id) {
        html += `<div class="tab-group preview">${half(tab)}${previewHalfHtml(dragged)}</div>`;
      } else {
        html += tabHtml(tab, { extra: drag?.id === tab.id ? ' drag-ghost' : '' });
      }
    }
    el.tabList.innerHTML = html;
  }

  const newTextTab = (work, book) => ({ id: newTabId(), kind: 'text', work, book, split: false, splitPct: 50, partnerId: null, fresh: true });

  function addTab(work, book) {
    const tab = newTextTab(work, book);
    createReader(tab);
    state.tabs.push(tab);
    activateTab(tab.id);
    return tab;
  }

  function activateTab(id) {
    const tab = getTab(id);
    if (!tab) return;
    state.activeId = id;
    state.view = 'reader';
    closePopovers();
    hideWordCard();
    groupOf(tab).forEach(renderReader);
    renderAll();
  }

  function closeTab(id, opts = {}) {
    const idx = state.tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const tab = state.tabs[idx];
    const partner = partnerOf(tab);
    if (partner) growDur(opts.exit === 'push' ? 560 : 780);
    if (!opts.skipExit) playExit(tab);
    tab.ro?.disconnect();
    const snap = { tab, idx, partnerId: partner?.id ?? null, autoId: null };
    if (partner) partner.partnerId = null;
    state.tabs.splice(idx, 1);
    tab.view.hidden = true;
    if (!isNotebook(tab)) tab.view.remove();
    hideWordCard();

    if (state.tabs.length === 0) {
      // The tab bar is never empty: closing the last tab leaves a fresh New Tab behind
      state.activeId = null;
      snap.autoId = addNewTab().id;
    } else if (id === state.activeId) {
      activateTab((partner ?? state.tabs[Math.max(0, idx - 1)]).id);
    } else {
      renderAll();
    }
    if (!opts.silent) showUndo(snap);
  }

  /* Put a closed tab back where it was (and into its split, if its partner is still there) */
  function undoClose({ tab, idx, partnerId, autoId }) {
    if (getTab(tab.id)) return;
    if (isText(tab)) createReader(tab);                       // its old view was thrown away
    else if (!isNotebook(tab)) el.panes.append(tab.view);     // a New Tab keeps its view
    else notebookDirty = true;
    state.tabs.splice(Math.min(idx, state.tabs.length), 0, tab);
    const partner = getTab(partnerId);
    tab.partnerId = partner && !partner.partnerId ? partner.id : null;
    if (tab.partnerId) partner.partnerId = tab.id;
    tab.fresh = true;
    activateTab(tab.id);
    // the blank tab that appeared when the last tab closed is no longer needed
    if (autoId && getTab(autoId)?.kind === 'new') closeTab(autoId, { skipExit: true, silent: true });
  }

  /* Put `dragged` right after `target` and link them as a split pair */
  function pairTabs(targetId, draggedId) {
    const target = getTab(targetId), dragged = getTab(draggedId);
    const old = partnerOf(dragged);
    if (old) old.partnerId = null;
    state.tabs.splice(state.tabs.indexOf(dragged), 1);
    state.tabs.splice(state.tabs.indexOf(target) + 1, 0, dragged);
    target.partnerId = dragged.id;
    dragged.partnerId = target.id;
    // English parallel view isn't available inside a split view
    for (const t of [target, dragged]) if (isText(t)) t.split = false;
    state.pairPct = 50;
  }

  function unpair(tab) {
    const p = partnerOf(tab);
    if (p) p.partnerId = null;
    tab.partnerId = null;
  }

  /* ==========================================================
     READERS: one per text tab
     ========================================================== */
  function createReader(tab) {
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
      rail: rootEl.querySelector('.bm-rail'),
      passage: rootEl.querySelector('.passage'),
      translation: rootEl.querySelector('.translation'),
      titles: rootEl.querySelectorAll('.book-title'),
      renderedKey: null
    };
    el.panes.append(rootEl);
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
  function bindReader(tab) {
    const ui = tab.ui;

    ui.passage.addEventListener('click', (e) => {
      const word = e.target.closest('.word');
      if (word) showWordCard(word);
    });
    ui.rail.addEventListener('click', (e) => {
      const dot = e.target.closest('.bm-dot');
      if (dot) flashLine(scrollToLine(tab, +dot.dataset.line));
    });
    ui.paneOriginal.addEventListener('scroll', () => {
      if (selectedWord && ui.paneOriginal.contains(selectedWord) && performance.now() >= keepCardUntil) hideWordCard();
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

  function renderReader(tab) {
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

  function renderPassage(tab) {
    const ui = tab.ui;
    const key = `${tab.work}:${tab.book}`;
    if (ui.renderedKey === key) return ui.ready;
    ui.renderedKey = key;
    if (selectedWord && ui.passage.contains(selectedWord)) hideWordCard();

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

  function verseHtml({ n, words }) {
    const html = words.map((w, j) =>
      `<span class="word" data-i="${j}"${w.s?.at(-1)?.[2]?.includes('c') ? ' data-caesura' : ''}>${wordHtml(w)}</span>`
    ).join('');
    return `<div class="verse" data-line="${n}"><span class="verse-num">${n === 1 || n % 5 === 0 ? n : ''}</span><span class="verse-words">${html}</span></div>`;
  }

  /* ==========================================================
     CHUNKS: a book is split into 25-line chunks and only three are in the page at
     once (the one at the middle of the pane and its neighbours). Spacers above and
     below stand in for the rest at their exact height, so the scrollbar, scroll
     position and scroll anchoring behave as if the whole book were there.
     Every line is one row of the same height (lines never wrap, and the scansion
     marks are absolutely positioned), so one measured row height places everything.
     ========================================================== */
  const CHUNK = 25;     // lines per chunk
  const ROW_GAP = 3;    // gap between lines, as in .verses and .verse-chunk

  function makeChunker(tab, container, pane, rows, scores, pitch = 0) {
    // The lines most likely to be the widest, measured for the fit instead of the whole text
    const cand = scores.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]).slice(0, FIT_CANDIDATES).map(([, i]) => i);
    return { tab, container, pane, rows, cand, pitch, nodes: new Map(), center: -1, lo: 0, hi: -1, top: null, bottom: null };
  }

  function mountChunker(ch) {
    ch.container.innerHTML = '<div class="chunk-spacer"></div><div class="chunk-spacer"></div>';
    [ch.top, ch.bottom] = ch.container.children;
    ch.nodes.clear();
    showWindow(ch, 0);
    if (measurePitch(ch)) sizeSpacers(ch);
  }

  /* Puts chunks c-1 … c+1 in the page. Chunks already there are left alone. */
  function showWindow(ch, c) {
    const count = Math.ceil(ch.rows.length / CHUNK);
    ch.center = c;
    ch.lo = Math.max(0, c - 1);
    ch.hi = Math.min(count - 1, c + 1);
    for (const [k, node] of ch.nodes) {
      if (k >= ch.lo && k <= ch.hi) continue;
      if (selectedWord && node.contains(selectedWord)) hideWordCard();
      node.remove();
      ch.nodes.delete(k);
    }
    let next = ch.bottom;
    for (let k = ch.hi; k >= ch.lo; k--) {
      let node = ch.nodes.get(k);
      if (!node) {
        node = document.createElement('div');
        node.className = 'verse-chunk';
        node.innerHTML = ch.rows.slice(k * CHUNK, (k + 1) * CHUNK).join('');
        if (ch.container === ch.tab.ui.passage) { markNotes(ch.tab, node); markBookmarks(ch.tab, node); }
        ch.container.insertBefore(node, next);
        ch.nodes.set(k, node);
      }
      next = node;
    }
    sizeSpacers(ch);
  }

  function sizeSpacers(ch) {
    const set = (sp, rows) => {
      const h = rows * ch.pitch - ROW_GAP;   // n rows take n·pitch less one gap; the container's gap adds it back
      sp.style.display = rows && h > 0 ? '' : 'none';
      sp.style.height = `${Math.max(0, h)}px`;
    };
    set(ch.top, ch.lo * CHUNK);
    set(ch.bottom, Math.max(0, ch.rows.length - (ch.hi + 1) * CHUNK));
  }

  /* Height of one row plus the gap. Read from the computed style, which a transform (the pop-in) doesn't change. */
  function measurePitch(ch) {
    const row = ch.nodes.values().next().value?.firstElementChild;
    const h = row ? parseFloat(getComputedStyle(row).height) : 0;
    if (!(h > 0)) return false;
    const p = h + ROW_GAP;
    if (Math.abs(p - ch.pitch) < 0.001) return false;
    ch.pitch = p;
    return true;
  }

  /* Where the text block starts within the pane's scrolling content */
  function textTop({ container: c, pane: p }) {
    return c.offsetParent === p ? c.offsetTop : c.offsetTop - p.offsetTop - p.clientTop;
  }

  /* Called on every scroll: swaps chunks only when the middle of the pane moves into another chunk */
  function syncChunks(ch) {
    if (!ch?.pitch || !ch.pane.clientHeight) return;
    const count = Math.ceil(ch.rows.length / CHUNK);
    const y = ch.pane.scrollTop + ch.pane.clientHeight / 2 - textTop(ch);
    const c = clamp(Math.floor(y / (CHUNK * ch.pitch)), 0, Math.max(0, count - 1));
    if (c !== ch.center) showWindow(ch, c);
  }

  /* After a fit or a resize: row heights may have changed */
  function syncLayout(tab) {
    const ui = tab.ui;
    if (!ui?.chunkers || ui.root.hidden) return;
    for (const ch of ui.chunkers) {
      if (measurePitch(ch)) sizeSpacers(ch);
      syncChunks(ch);
    }
    renderRail(tab);
  }

  /* Scrolls a line of the original to the middle of its pane and returns its element */
  function scrollToLine(tab, line) {
    const ch = tab.ui.chunkers?.[0];
    const i = ch?.lineNums?.indexOf(line) ?? -1;
    if (i < 0) return null;
    const find = () => ch.container.querySelector(`.verse[data-line="${line}"]`);
    if (ch.pitch && ch.pane.clientHeight) {
      ch.pane.scrollTop = textTop(ch) + (i + 0.5) * ch.pitch - ch.pane.clientHeight / 2;
      syncChunks(ch);
    }
    if (!find()) showWindow(ch, Math.floor(i / CHUNK));
    return find();
  }

  /* Scansion: each syllable is [text, quantity, flags?]. Quantity is L long, S short, E elided.
     Flags: f foot starts here, c caesura after, h hiatus, z synizesis, r consonantal i,
     d lengthened syllable, m hypermetric (elided into the next line). */
  const SCAN_NOTES = { h: 'hiatus', z: 'synizesis', r: 'consonantal i', d: 'lengthened syllable', m: 'hypermetric' };

  /* A word's text, split into syllable spans when it has scansion (the spans add no width,
     so the marks can be shown or hidden without refitting the text) */
  function wordHtml(w) {
    const s = w.s;
    if (!s?.length || s.map((x) => x[0]).join('') !== w.f) return esc(w.f);
    return s.map(([text, q, x = '']) => {
      const notes = [...x].map((c) => SCAN_NOTES[c]).filter(Boolean).join(', ');
      return `<span class="syl" data-q="${q}"${x ? ` data-x="${x}"` : ''}${notes ? ` title="${notes}"` : ''}>${esc(text)}</span>`;
    }).join('');
  }

  /* A word's scansion for the word card, e.g. "vi · rum · que   ⏑ – ⏑" (elided syllables in brackets) */
  function scanText(s) {
    if (!s?.length) return '';
    const sylls = s.map(([t, q]) => {
      const bare = t.replace(/[.,;:!?·᾽—–]/g, '');
      return q === 'E' ? `(${bare})` : bare;
    }).join(' · ');
    const marks = s.filter(([, q]) => q !== 'E').map(([, q]) => (q === 'L' ? '–' : '⏑')).join(' ');
    return marks ? `${sylls}   ${marks}` : sylls;
  }

  function setBookTitles(tab) {
    tab.ui.titles.forEach((t) => { t.textContent = `Book ${tab.book}`; });
  }

  /* Text shrinks to fit its pane instead of wrapping, never below the smallest size the editor offers */
  const TWO_UP_SCALE = 0.86;
  const FIT_CANDIDATES = 40;   // lines measured at the reference sizes (picked from the text, see makeChunker)
  const FIT_STEP = 100;        // sizes round down to 1/100 rem, so tiny width changes don't relayout the book

  /* How wide one line's content is (its flex row stretches to the widest line, so the row itself can't say) */
  function lineWidth(line, padRight) {
    const left = line.getBoundingClientRect().left;
    if (line.classList.contains('verse')) {
      const last = line.lastElementChild?.lastElementChild ?? line.lastElementChild;
      return last ? last.getBoundingClientRect().right - left : 0;
    }
    const r = document.createRange();
    r.selectNodeContents(line);
    return r.getBoundingClientRect().right - left + padRight;
  }

  /* Width grows almost linearly with size (the text scales, word padding doesn't). Most of the book isn't in
     the page, so the lines likeliest to be widest are picked from the text itself (longest by letters and
     words), and only copies of those are laid out at the smallest and largest sizes. Gives each line's
     { k, b } with width = k·size + b. */
  function measureFitModel(checks) {
    const lo = MIN_FONT * TWO_UP_SCALE, hi = parseFloat(el.fontSlider.max);
    const model = new Map();
    for (const c of checks) {
      if (!c.ch.cand.length) { model.set(c.pn, []); continue; }
      const probe = document.createElement('div');
      probe.className = 'fit-probe';
      probe.setAttribute('aria-hidden', 'true');
      probe.innerHTML = c.ch.cand.map((i) => c.ch.rows[i]).join('');
      c.pn.append(probe);
      const widest = [...probe.children];
      const padRight = parseFloat(getComputedStyle(widest[0]).paddingRight) || 0;
      const at = (size) => {
        probe.style.setProperty('--reading-font-size', `${size}rem`);
        probe.style.setProperty('--reading-trans-font-size', `${size * 0.86}rem`);
        return widest.map((l) => lineWidth(l, padRight));
      };
      const wLo = at(lo), wHi = at(hi);
      probe.remove();
      model.set(c.pn, wLo.map((w, i) => {
        const k = (wHi[i] - w) / (hi - lo);
        return { k, b: w - k * lo };
      }));
    }
    return model;
  }

  /* verify: also check the result against the real layout (skipped while a pane is being dragged) */
  function fitReader(tab, verify = true) {
    const ui = tab?.ui;
    if (!ui?.chunkers || !ui.root.isConnected || ui.root.hidden || !ui.paneOriginal.clientWidth) return;
    // Two windows share the width, so the text sits a step smaller than in a single window
    const twoUp = !!partnerOf(tab) || !!tab.split;
    const max = state.fontRem * (twoUp ? TWO_UP_SCALE : 1);
    const min = Math.min(max, MIN_FONT);
    const panes = tab.split && ui.paneTranslation.clientWidth ? [ui.paneOriginal, ui.paneTranslation] : [ui.paneOriginal];
    // Padding doesn't depend on the font size, so it is read once rather than on every step of the search
    const checks = panes.map((pn, i) => {
      const cs = getComputedStyle(pn);
      return { pn, ch: ui.chunkers[i], verses: ui.chunkers[i].container, pad: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) };
    });
    // Only a few chunks are in the page, so the text block is held to the width of the book's widest
    // line; otherwise it would shift sideways as wider lines scroll in
    const widestAt = (pn, size) => Math.max(0, ...(model.get(pn) ?? []).map(({ k, b }) => k * size + b));
    const apply = (size) => {
      ui.root.style.setProperty('--reading-font-size', `${size.toFixed(3)}rem`);
      ui.root.style.setProperty('--reading-trans-font-size', `${(size * 0.86).toFixed(3)}rem`);
      for (const c of checks) c.verses.style.minWidth = `${Math.ceil(widestAt(c.pn, size))}px`;
    };
    const fits = () => checks.every((c) => c.verses.offsetWidth <= c.pn.clientWidth - c.pad + 1);

    // Every size change relays out the whole book, so the size is worked out rather than searched for,
    // from widths measured once per text and font (see measureFitModel)
    const model = tab.fitModel ??= new Map();
    const missing = checks.filter((c) => !model.has(c.pn));
    if (missing.length) {
      measureFitModel(missing).forEach((lines, pn) => model.set(pn, lines));
      tab.fitSize = null;
    }
    let size = max;
    for (const c of checks) {
      const room = c.pn.clientWidth - c.pad + 1;
      for (const { k, b } of model.get(c.pn)) if (k > 0) size = Math.min(size, (room - b) / k);
    }
    if (size < max) size = Math.floor(size * FIT_STEP + 1e-9) / FIT_STEP;
    size = clamp(size, min, max);
    const changed = tab.fitSize == null || Math.abs(size - tab.fitSize) >= 0.0005;
    if (!changed && (!verify || tab.fitVerified)) return;   // unchanged: no relayout
    if (changed) {
      tab.fitSize = size;
      tab.fitVerified = false;
      apply(size);
    }
    if (!verify) return;
    tab.fitVerified = true;
    if (size === min || fits()) return;
    // Safety net in case the estimate is off (a font still loading, say): search below it as before
    let lo = min, hi = size;
    for (let i = 0; i < 7; i++) {
      const mid = (lo + hi) / 2;
      apply(mid);
      if (fits()) lo = mid; else hi = mid;
    }
    tab.fitSize = lo;
    apply(lo);
  }

  function scheduleFit(tab, verify = true) {
    tab.fitVerify ||= verify;
    if (tab.fitRaf) return;
    tab.fitRaf = requestAnimationFrame(() => {
      const v = tab.fitVerify;
      tab.fitRaf = 0;
      tab.fitVerify = false;
      fitReader(tab, v);
      syncLayout(tab);
    });
  }

  /* remeasure: the font or spacing changed, so the widths measured for each text no longer hold */
  function fitAll(remeasure = false) {
    state.tabs.forEach((t) => {
      if (!isText(t)) return;
      if (remeasure) t.fitModel = null;
      scheduleFit(t);
    });
  }
  // A web font arriving after the text was measured changes its width
  document.fonts?.addEventListener('loadingdone', () => fitAll(true));

  /* Segmented book bar in the top bar (for the active text tab) */
  function renderSegments() {
    const tab = activeTab();
    if (!isText(tab)) return;
    el.segments.innerHTML = ROMANS.slice(0, workOf(tab).bookCount).map((r) => {
      const on = r === tab.book;
      return `<button class="segment${on ? ' active' : ''}" data-book="${r}" aria-label="Book ${r}"${on ? ' aria-current="true"' : ''}>${on ? r : ''}</button>`;
    }).join('');
  }

  function setBook(roman) {
    const tab = activeTab();
    if (!isText(tab) || tab.book === roman) return;

    // Ripple neighbours away from the newly selected segment.
    const target = ROMANS.indexOf(roman);
    const segs = [...el.segments.children];
    segs.forEach((s) => s.classList.remove('ripple-left', 'ripple-right'));
    void el.segments.offsetWidth; // restart animations on rapid clicks
    segs.forEach((s, i) => {
      const on = i === target;
      if (!on) s.classList.add(i < target ? 'ripple-left' : 'ripple-right');
      s.classList.toggle('active', on);
      s.textContent = on ? roman : '';
      s.toggleAttribute('aria-current', on);
    });

    tab.book = roman;
    tab.ui.paneOriginal.scrollTop = 0;
    renderPassage(tab);
    setBookTitles(tab);
    renderTabs();
    refreshNoteMarks([tab]);
    setView('reader');
  }

  /* English translation beside the original, per reader */
  function applySplit(tab) {
    const ui = tab.ui, on = !!tab.split;
    ui.root.dataset.split = on ? 'on' : 'off';
    ui.paneTranslation.classList.remove('squash', 'snap-target');
    ui.divider.classList.remove('elastic');
    ui.paneOriginal.style.width = on ? `${tab.splitPct}%` : '';
  }

  function toggleSplit() {
    const tab = activeTab();
    if (!isText(tab) || partnerOf(tab)) return;
    tab.split = !tab.split;
    if (tab.split && (tab.splitPct > 75 || tab.splitPct < 25)) tab.splitPct = 50;
    if (!tab.split) playTranslationExit(tab);   // copy the pane while it is still on screen
    applySplit(tab);
    syncToolbar();
    if (tab.split) playPop(tab.ui.paneTranslation);
  }

  function animateSplitTo(ui, pct) {
    ui.workspace.classList.add('snapping');
    ui.paneOriginal.style.width = `${pct}%`;
    setTimeout(() => ui.workspace.classList.remove('snapping'), 350);
  }

  function toggleScansion() {
    state.scansion = !state.scansion;
    root.dataset.scansion = state.scansion ? 'on' : 'off';
    el.meterBtn.classList.toggle('active', state.scansion);
    el.meterBtn.setAttribute('aria-pressed', String(state.scansion));
  }

  /* Clicking inside a pane focuses its tab */
  el.panes.addEventListener('pointerdown', (e) => {
    const view = e.target.closest('.tab-view');
    if (view && view.dataset.tabId !== state.activeId) activateTab(view.dataset.tabId);
  });

  /* ==========================================================
     TAB DRAGGING
     The tab itself follows the cursor. Drop it to the right of a
     single tab in the sidebar, or on the right half of the open
     tab's content, to open the two side by side. A split holds two
     tabs only, so a tab that is already paired can't take a third.
     Dragging half of a pair away and dropping it elsewhere ends
     the split.
     ========================================================== */
  const DRAG_THRESHOLD = 5;
  let pendingDrag = null;
  let tabDrag = null;
  let suppressTabClick = false;

  function canSplitWith(target) {
    if (!target || !dragging || target.id === dragging.id) return false;
    const p = partnerOf(target);
    return !p || p.id === dragging.id;
  }

  function dropTargetAt(x, y) {
    const draggedPartnerId = partnerOf(getTab(dragging.id))?.id;
    for (const tab of state.tabs) {
      if (tab.id === dragging.id || tab.id === draggedPartnerId) continue;
      const node = el.tabList.querySelector(`.tab[data-tab-id="${tab.id}"]`);
      if (!node) continue;
      const b = (node.closest('.tab-group') ?? node).getBoundingClientRect();
      if (y >= b.top - 4 && y <= b.bottom + 4 && x >= b.left + b.width * 0.5 && x <= b.right + 90) return { tab, zone: 'tab' };
    }
    const open = activeTab();
    if (open && !el.panes.hidden) {
      const m = el.main.getBoundingClientRect();
      const inRight = x >= m.left + m.width * 0.5 && x <= m.right && y >= m.top && y <= m.bottom;
      if (inRight && open.id !== dragging.id) return { tab: open, zone: 'main' };
      // Dragging the open tab itself onto the right of a single reader opens a new tab beside it
      if (inRight && isText(open) && !partnerOf(open)) return { tab: open, zone: 'main-new' };
    }
    return null;
  }

  el.tabList.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.pointerType === 'touch' || e.target.closest('.tab-close')) return;
    const pill = e.target.closest('.tab');
    if (!pill?.dataset.tabId) return;
    pendingDrag = { id: pill.dataset.tabId, x: e.clientX, y: e.clientY };
    document.addEventListener('pointermove', onTabDragMove);
    document.addEventListener('pointerup', onTabDragEnd);
    document.addEventListener('pointercancel', onTabDragCancel);
  });

  function removeDragListeners() {
    document.removeEventListener('pointermove', onTabDragMove);
    document.removeEventListener('pointerup', onTabDragEnd);
    document.removeEventListener('pointercancel', onTabDragCancel);
  }

  function onTabDragMove(e) {
    if (!pendingDrag) return;
    if (!tabDrag) {
      if (Math.hypot(e.clientX - pendingDrag.x, e.clientY - pendingDrag.y) < DRAG_THRESHOLD) return;
      if (!startTabDrag()) { pendingDrag = null; removeDragListeners(); return; }
    }
    moveTabDrag(e);
  }

  function startTabDrag() {
    const pill = el.tabList.querySelector(`.tab[data-tab-id="${pendingDrag.id}"]`);
    if (!pill) return false;
    const r = pill.getBoundingClientRect();
    // Where the pair sat before the drag. The sidebar re-renders as soon as the drag starts, and the
    // dashed ghost lands on a different side depending on which half is dragged, so "dropped back
    // where it started" has to be judged against this rect, not against the ghost.
    const home = (pill.closest('.tab-group') ?? pill).getBoundingClientRect();
    const clone = pill.cloneNode(true);
    clone.classList.add('tab-drag');
    clone.removeAttribute('data-tab-id');
    clone.removeAttribute('tabindex');
    Object.assign(clone.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    document.body.append(clone);

    tabDrag = { id: pendingDrag.id, clone, sx: pendingDrag.x, sy: pendingDrag.y, left: r.left, top: r.top, home,
      x: pendingDrag.x, y: pendingDrag.y, target: null, newTab: false, denied: false };
    dragging = { id: pendingDrag.id, previewId: null };
    hideHoverCard();
    document.body.classList.add('dragging-tab');
    renderTabs();   // the dragged tab leaves a dashed ghost behind
    return true;
  }

  function moveTabDrag(e) {
    const d = tabDrag;
    d.x = e.clientX;
    d.y = e.clientY;
    d.clone.style.transform = `translate(${e.clientX - d.sx}px, ${e.clientY - d.sy}px) scale(1.04)`;

    const hit = dropTargetAt(e.clientX, e.clientY);
    const isNew = hit?.zone === 'main-new';
    const ok = !!hit && (isNew || canSplitWith(hit.tab));
    const denied = !!hit && !ok && !partnerOf(getTab(d.id));
    d.target = ok && !isNew ? hit.tab : null;
    d.newTab = ok && isNew;

    const nextId = d.target?.id ?? null;
    if (nextId !== dragging.previewId) {
      dragging.previewId = nextId;
      renderTabs();
    }
    el.dropHint.classList.toggle('show', ok && hit.zone.startsWith('main'));
    if (denied !== d.denied) {
      d.denied = denied;
      document.body.classList.toggle('drag-denied', denied);
    }
  }

  function onTabDragEnd(e) {
    removeDragListeners();
    if (!tabDrag) { pendingDrag = null; return; }   // it was a plain click
    tabDrag.x = e.clientX;
    tabDrag.y = e.clientY;
    finishTabDrag(false);
  }

  function onTabDragCancel() {
    removeDragListeners();
    if (tabDrag) finishTabDrag(true);
    pendingDrag = null;
  }

  function cancelTabDrag() {
    if (!tabDrag) return;
    removeDragListeners();
    finishTabDrag(true);
  }

  function finishTabDrag(cancelled) {
    const d = tabDrag;
    const dragged = getTab(d.id);
    const wasPaired = !!partnerOf(dragged);
    const h = d.home;
    const overHome = d.x >= h.left - 8 && d.x <= h.right + 8 && d.y >= h.top - 8 && d.y <= h.bottom + 8;

    let change = null;
    if (!cancelled && d.newTab && isText(dragged)) {
      const nt = newTextTab(dragged.work, dragged.book);
      nt.fresh = false;
      createReader(nt);
      state.tabs.push(nt);
      pairTabs(dragged.id, nt.id);
      change = 'pair';
    } else if (!cancelled && d.target) {
      pairTabs(d.target.id, d.id);
      change = 'pair';
    } else if (!cancelled && d.denied) {
      // a split view holds two tabs: nothing happens
    } else if (!cancelled && wasPaired && !overHome) {
      // dropped anywhere else (any spot on the sidebar included): the tab leaves the split
      if (groupOf(activeTab()).includes(dragged)) {
        const leaving = groupOf(activeTab()).find((t) => t.id !== state.activeId);
        if (leaving) playExit(leaving);
      }
      unpair(dragged);
      change = 'unpair';
    }

    dragging = null;
    tabDrag = null;
    pendingDrag = null;
    document.body.classList.remove('dragging-tab', 'drag-denied');
    el.dropHint.classList.remove('show');
    suppressTabClick = true;
    setTimeout(() => { suppressTabClick = false; }, 0);

    if (change === 'pair') activateTab(d.id);
    else if (change === 'unpair') renderAll();
    else renderTabs();
    landDraggedTab(d);
  }

  /* The dragged tab glides into its slot, then hands over to the real one */
  function landDraggedTab(d) {
    const dest = el.tabList.querySelector(`.tab[data-tab-id="${d.id}"]`);
    if (!dest) { d.clone.remove(); return; }
    const r = dest.getBoundingClientRect();
    dest.style.visibility = 'hidden';
    const c = d.clone;
    c.style.transition = 'transform 240ms var(--ease-spring), width 240ms ease';
    c.style.width = `${r.width}px`;
    c.style.transform = `translate(${r.left - d.left}px, ${r.top - d.top}px) scale(1)`;
    setTimeout(() => { c.remove(); dest.style.visibility = ''; }, 260);
  }

  /* Resize bar between the two panes of a split pair */
  (() => {
    const dv = $('pair-divider');
    let drag = null;
    const apply = () => {
      groupOf(activeTab()).forEach((t, i) => { t.view.style.flex = `${i === 0 ? state.pairPct : 100 - state.pairPct} 1 0`; });
    };
    dv.addEventListener('pointerdown', (e) => {
      drag = { rect: el.panes.getBoundingClientRect() };
      el.panes.classList.add('live');
      dv.setPointerCapture(e.pointerId);
      dv.classList.add('dragging');
      document.body.classList.add('resizing');
      hideWordCard();
      e.preventDefault();
    });
    dv.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const w = drag.rect.width - dv.offsetWidth;
      if (w <= 0) return;
      const raw = ((e.clientX - drag.rect.left - dv.offsetWidth / 2) / w) * 100;
      state.pairPct = clamp(raw, 3, 97);
      apply();
      const shown = groupOf(activeTab());
      const gone = state.pairPct <= 9 ? 0 : state.pairPct >= 91 ? 1 : -1;
      if (gone >= 0 && shown.length === 2) {          // reached the edge: that pane goes right now
        release(e.pointerId);
        closeTab(shown[gone].id, { exit: 'push' });
        return;
      }
      // near either edge, the shrinking pane dims to show it will be dismissed
      const warn = state.pairPct <= 20 ? 0 : state.pairPct >= 80 ? 1 : -1;
      shown.forEach((t, i) => { t.view.style.opacity = i === warn ? '0.5' : ''; });
      dv.classList.toggle('elastic', warn >= 0);
    });
    function release(pid) {
      drag = null;
      el.panes.classList.remove('live');
      if (dv.hasPointerCapture(pid)) dv.releasePointerCapture(pid);
      dv.classList.remove('dragging', 'elastic');
      document.body.classList.remove('resizing');
      groupOf(activeTab()).forEach((t) => { t.view.style.opacity = ''; });
    }
    const end = (e) => {
      if (!drag) return;
      release(e.pointerId);
      state.pairPct = clamp(state.pairPct, 25, 75);   // bounces back inside the normal range
      apply();
    };
    dv.addEventListener('pointerup', end);
    dv.addEventListener('pointercancel', end);
    dv.addEventListener('dblclick', () => { state.pairPct = 50; apply(); });
  })();

  /* Pane dragging: grab a pane by its title and slide it side to side.
     Far enough toward its neighbour it swaps places; all the way out past its own edge it is dismissed. */
  (() => {
    const SWAP = 0.28, DISMISS = 0.55, DIVIDER = 16;
    let d = null;
    const rotFor = (dx, w) => clamp(dx / w, -1, 1) * 2.4;
    const springFrames = (from, rot, lift) => [
      { transform: `translateX(${from}px) rotate(${rot}deg) scale(${lift})`, offset: 0, easing: SPRING },
      { transform: `translateX(${-from * 0.18}px) rotate(${-rot * 0.3}deg) scale(0.996)`, offset: 0.34, easing: SPRING },
      { transform: `translateX(${from * 0.08}px) rotate(${rot * 0.1}deg) scale(1)`, offset: 0.56, easing: SPRING },
      { transform: `translateX(${-from * 0.03}px)`, offset: 0.76, easing: SPRING },
      { transform: 'translateX(0px) rotate(0deg) scale(1)', offset: 1 }
    ];

    el.panes.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || el.panes.dataset.count !== '2' || state.view !== 'reader') return;
      const handle = e.target.closest('.book-title, .nb-title');
      const view = handle?.closest('.tab-view');
      if (!view) return;
      const shown = groupOf(activeTab());
      const tab = shown.find((t) => t.view === view);
      if (!tab) return;
      const partner = shown.find((t) => t !== tab);
      const r = view.getBoundingClientRect(), pr = partner.view.getBoundingClientRect();
      d = { tab, partner, view, handle, idx: shown.indexOf(tab), id: e.pointerId, x0: e.clientX, dx: 0,
        left: r.left, top: r.top, w: r.width, h: r.height, pleft: pr.left, partnerShift: 0, willSwap: false, moved: false };
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    el.panes.addEventListener('pointermove', (e) => {
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x0;
      if (!d.moved) {
        if (Math.abs(dx) < 4) return;
        d.moved = true;
        hideWordCard();
        document.body.classList.add('pane-dragging');
        d.view.classList.add('drag-live');
      }
      d.dx = dx;
      d.view.style.transform = `translateX(${dx}px) rotate(${rotFor(dx, d.w)}deg) scale(1.015)`;
      const toward = d.idx === 0 ? dx > 0 : dx < 0;
      d.willSwap = toward && Math.abs(dx) > d.w * SWAP;
      // the neighbour trails the drag a little, then slides into the vacated slot once a swap is certain
      d.partnerShift = d.willSwap ? (d.idx === 0 ? -1 : 1) * (d.w + DIVIDER) : dx * (toward ? 0.12 : 0.06);
      d.partner.view.style.transform = `translateX(${d.partnerShift}px)`;
    });

    const end = (e) => {
      if (!d || e.pointerId !== d.id) return;
      const s = d;
      d = null;
      if (s.handle.hasPointerCapture(s.id)) s.handle.releasePointerCapture(s.id);
      if (!s.moved) return;
      document.body.classList.remove('pane-dragging');
      const outward = s.idx === 0 ? s.dx < 0 : s.dx > 0;
      if (outward && Math.abs(s.dx) > s.w * DISMISS) dismiss(s);
      else if (s.willSwap) swap(s);
      else settle(s);
    };
    el.panes.addEventListener('pointerup', end);
    el.panes.addEventListener('pointercancel', end);

    function settle(s) {
      s.view.style.transform = '';
      s.partner.view.style.transform = '';
      if (Math.abs(s.dx) < 1) { s.view.classList.remove('drag-live'); return; }
      const a = s.view.animate(springFrames(s.dx, rotFor(s.dx, s.w), 1.015), { duration: 780, easing: 'linear' });
      a.onfinish = a.oncancel = () => s.view.classList.remove('drag-live');
    }

    function swap(s) {
      const dragVisual = s.left + s.dx;
      const partnerVisual = s.pleft + s.partnerShift;
      el.panes.classList.add('instant');
      s.view.style.transform = '';
      s.partner.view.style.transform = '';
      const i = state.tabs.indexOf(s.tab), j = state.tabs.indexOf(s.partner);
      [state.tabs[i], state.tabs[j]] = [state.tabs[j], state.tabs[i]];
      state.pairPct = 100 - state.pairPct;
      renderAll();
      const nl = s.view.getBoundingClientRect().left;       // forces layout
      const npl = s.partner.view.getBoundingClientRect().left;
      el.panes.classList.remove('instant');
      const a = s.view.animate(springFrames(dragVisual - nl, rotFor(s.dx, s.w), 1.015), { duration: 820, easing: 'linear' });
      a.onfinish = a.oncancel = () => s.view.classList.remove('drag-live');
      s.partner.view.animate(springFrames(partnerVisual - npl, 0, 1), { duration: 780, easing: 'linear' });
    }

    function dismiss(s) {
      const dir = s.idx === 0 ? -1 : 1;
      shrinkAway(makeGhost(s.view, { left: s.left + s.dx, top: s.top, width: s.w, height: s.h }), dir);
      s.view.style.transform = '';
      s.partner.view.style.transform = '';
      s.view.classList.remove('drag-live');
      closeTab(s.tab.id, { skipExit: true });
    }
  })();

  /* ==========================================================
     WORD CARD
     ========================================================== */
  function showWordCard(word) {
    if (!state.popups.words) return;
    closeNote();
    selectedWord?.classList.remove('selected');
    selectedWord = word;
    word.classList.add('selected');

    const tab = getTab(word.closest('.tab-view').dataset.tabId);
    const clean = word.textContent.replace(/[.,;:!?·᾽—–]/g, '').trim();
    wordCtx = {
      work: tab.work, book: tab.book,
      line: +word.closest('.verse').dataset.line, wordIdx: +word.dataset.i, word: clean
    };

    const info = wordInfo(tab, wordCtx.line, wordCtx.wordIdx) ?? LEXICON[clean.toLowerCase()] ?? {
      lemma: clean,
      morph: workOf(tab).formLabel,
      def: `Epic gloss and grammatical analysis for “${clean}”.`
    };
    el.cardLemma.textContent = info.lemma;
    el.cardMorph.textContent = info.morph;
    el.cardDef.textContent = info.def;
    const scan = scanText(tab.bookData?.byLine.get(wordCtx.line)?.w[wordCtx.wordIdx]?.s);
    el.cardScan.hidden = !scan;
    el.cardScan.textContent = scan;

    syncCardNote();
    positionWordCard(word);

    el.wordCard.classList.remove('visible');
    void el.wordCard.offsetWidth; // replay pop animation
    el.wordCard.classList.add('visible');
  }

  function hideWordCard() {
    closeNote();
    wordCtx = null;
    el.wordCard.classList.remove('visible');
    selectedWord?.classList.remove('selected');
    selectedWord = null;
  }

  addEventListener('resize', hideWordCard);

  /* ==========================================================
     SWITCH WORK PICKER: changes the work and book of one tab
     ========================================================== */
  el.workList.innerHTML = Object.entries(WORKS).map(([key, w]) => `
    <button class="work-item" data-work="${key}">
      <span>
        <span class="work-name">${esc(w.title)}</span>
        <span class="work-author">${esc(`${w.poet} · ${w.language} · ${w.bookCount} Books`)}</span>
      </span>
      ${icon('chevron-right')}
    </button>`).join('');

  function highlightWork(workKey) {
    for (const item of el.workList.children) item.classList.toggle('active', item.dataset.work === workKey);
  }

  function showWorkList() {
    el.pickerTitle.textContent = 'Switch Tab Work';
    el.workList.hidden = false;
    el.bookPicker.hidden = true;
  }

  function showBooks(workKey) {
    const work = WORKS[workKey];
    const current = getTab(state.pickerTabId)?.book ?? 'I';
    highlightWork(workKey);
    el.pickerTitle.textContent = `${work.title} Books`;
    el.booksGrid.dataset.work = workKey;
    el.booksGrid.innerHTML = ROMANS.slice(0, work.bookCount).map((r) =>
      `<button class="book-cell${r === current ? ' active' : ''}" data-book="${r}">${r}</button>`
    ).join('');
    el.workList.hidden = true;
    el.bookPicker.hidden = false;
  }

  function openPicker(tabId, anchor) {
    state.pickerTabId = tabId;
    highlightWork(getTab(tabId)?.work);
    showWorkList();

    const r = anchor.getBoundingClientRect();
    el.picker.style.top = `${clamp(r.top - 20, 72, innerHeight - 380)}px`;
    el.picker.style.left = `${r.right + 14}px`;

    hideHoverCard();
    closePopovers(el.picker);
    setOpen(el.picker, true);
  }

  function chooseBook(workKey, book) {
    setOpen(el.picker, false);
    const tab = getTab(state.pickerTabId);
    if (!tab) return;
    tab.work = workKey;
    tab.book = book;
    renderReader(tab);
    renderAll();
  }

  el.workList.addEventListener('click', (e) => {
    const item = e.target.closest('.work-item');
    if (item) showBooks(item.dataset.work);
  });
  el.backBtn.addEventListener('click', showWorkList);
  el.booksGrid.addEventListener('click', (e) => {
    const cell = e.target.closest('.book-cell');
    if (cell) chooseBook(el.booksGrid.dataset.work, cell.dataset.book);
  });
  el.addTab.addEventListener('click', () => addNewTab());   // a new tab opens the home page
  el.addNotebook.addEventListener('click', openNotebook);

  /* ==========================================================
     HOME PAGE: a carousel of the works, shown when nothing is open and as the page
     of every new tab. Hover a card and it grows into the large slot (the others step
     down to medium and small) and keeps that size after the mouse leaves.
     Clicking a card opens Book I of that work.
     ========================================================== */
  const HOME_WORKS = ['aeneid', 'odyssey', 'iliad'];
  // Flat colours show behind the artwork until it has loaded (and if a file is ever missing)
  const HOME_BG = {
    aeneid: 'var(--primary)',
    odyssey: 'var(--secondary)',
    iliad: 'color-mix(in srgb, var(--primary) 55%, var(--secondary))'
  };
  // Artwork for each card. `pos` is the part of the painting kept in view when a narrow card crops it.
  const HOME_ART = {
    aeneid:  { src: 'assets/images/aeneas.jpg',            pos: '45% 50%' },   // Aeneas carrying Anchises
    odyssey: { src: 'assets/images/ulyssespolyphemus.jpg', pos: '38% 50%' },   // Ulysses' ship
    iliad:   { src: 'assets/images/priamachilles.jpeg',    pos: '62% 50%' }    // Priam kneeling before Achilles
  };

  const CAROUSEL_HTML = HOME_WORKS.map((key, i) => `
    <button class="home-card" data-work="${key}" data-rank="${Math.min(i, 2)}" role="listitem" aria-label="${esc(WORKS[key].title)}: open Book I" style="--card-bg: ${HOME_BG[key]}; background-image: url('${HOME_ART[key].src}'); --card-pos: ${HOME_ART[key].pos}">
      <span class="home-card-scrim"></span><span class="home-card-title">${esc(WORKS[key].title)}</span>
    </button>`).join('');

  function bindCarousel(carousel, onPick) {
    const cards = [...carousel.children];
    const setFocus = (idx) => cards.forEach((card, i) => {
      card.dataset.rank = Math.min(2, Math.abs(i - idx));
      card.classList.toggle('hot', i === idx);
    });
    // Leaving only hides the title: each card keeps the size it was last given
    const clearHot = () => cards.forEach((c) => c.classList.remove('hot'));

    carousel.addEventListener('pointerover', (e) => {
      const card = e.target.closest('.home-card');
      if (card) setFocus(cards.indexOf(card));
    });
    carousel.addEventListener('pointerleave', clearHot);
    carousel.addEventListener('focusin', (e) => {
      if (e.target.matches(':focus-visible')) setFocus(cards.indexOf(e.target));
    });
    carousel.addEventListener('focusout', (e) => {
      if (!carousel.contains(e.relatedTarget)) clearHot();
    });
    carousel.addEventListener('click', (e) => {
      const card = e.target.closest('.home-card');
      if (card) onPick(card.dataset.work);
    });
  }

  /* ==========================================================
     LOADING INDICATOR (Material 3 Expressive style): one solid shape with no track,
     spinning clockwise while it morphs through a scalloped badge, a pentagon, an
     8-point star, a clover and a 10-point starburst. Each shape is a smooth radius
     curve r(θ) sampled at the same angles, so any two can be blended point by point;
     every curve averages the same radius, so the footprint stays the same.
     ========================================================== */
  const LOADER_SHAPES = [            // [lobes, depth] terms of r(θ) = 1 + Σ depth·cos(lobes·θ)
    [[12, 0.045]],                   // 12-point scalloped badge
    [[5, 0.08], [10, 0.012]],        // rounded pentagon (the second term flattens the sides)
    [[8, 0.11], [16, -0.015]],       // 8-point star with blunt tips
    [[4, 0.17], [8, -0.035]],        // plump four-leaf clover
    [[10, 0.15], [20, -0.02]]        // deep 10-point starburst
  ];
  const LOADER_N = 144;              // points around each shape
  const LOADER_STEP = 800;           // ms per shape: a 4-second cycle
  const LOADER_RADII = LOADER_SHAPES.map((terms) => Array.from({ length: LOADER_N }, (_, i) => {
    const t = (i / LOADER_N) * Math.PI * 2;
    return 1 + terms.reduce((s, [n, a]) => s + a * Math.cos(n * t), 0);
  }));

  /* A CSS-style cubic-bezier easing function */
  function cubicBezier(x1, y1, x2, y2) {
    const bz = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
    return (x) => {
      if (x <= 0 || x >= 1) return x <= 0 ? 0 : 1;
      let lo = 0, hi = 1, t = x;
      for (let i = 0; i < 20; i++) {
        if (bz(t, x1, x2) < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return bz(t, y1, y2);
    };
  }
  const MORPH_EASE = cubicBezier(0.2, 0, 0, 1);         // fast in, long settle
  const SPIN_EASE = cubicBezier(0.34, 1.4, 0.64, 1);     // the spin burst overshoots a little as the shape lands

  /* A closed path through the points, smoothed into cubic Béziers (Catmull-Rom) */
  function loaderPath(radii, R) {
    const pts = radii.map((r, i) => {
      const t = (i / LOADER_N) * Math.PI * 2;
      return [R * r * Math.cos(t), R * r * Math.sin(t)];
    });
    const n = pts.length, f = (v) => v.toFixed(2);
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
    }
    return `${d}Z`;
  }

  /* The indicator element. Its animation runs until it is taken out of the page. */
  function createLoader() {
    const wrap = document.createElement('div');
    wrap.className = 'm3-loader';
    wrap.setAttribute('role', 'progressbar');
    wrap.setAttribute('aria-label', 'Loading');
    wrap.innerHTML = '<svg viewBox="-50 -50 100 100" aria-hidden="true"><path/></svg>';
    const path = wrap.querySelector('path');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const R = 40;   // the deepest shape reaches about 47 of the 50 units around the centre
    let t0 = 0;
    const frame = (now) => {
      if (!wrap.isConnected) return;
      t0 ||= now;
      const t = now - t0;
      const step = Math.floor(t / LOADER_STEP), p = (t % LOADER_STEP) / LOADER_STEP;
      const from = LOADER_RADII[step % LOADER_RADII.length], to = LOADER_RADII[(step + 1) % LOADER_RADII.length];
      const e = MORPH_EASE(p);
      path.setAttribute('d', loaderPath(from.map((r, i) => r + (to[i] - r) * e), R));
      // A slow steady spin, plus a quarter-turn burst that lands with each new shape
      if (!still) path.setAttribute('transform', `rotate(${((t * 0.045 + (step + SPIN_EASE(p)) * 90) % 360).toFixed(2)})`);
      requestAnimationFrame(frame);
    };
    path.setAttribute('d', loaderPath(LOADER_RADII[0], R));
    requestAnimationFrame(frame);
    return wrap;
  }

  /* Opening a work from a home page: the indicator shows for 0.3 s. The book starts downloading at once,
     the reader is built hidden behind the indicator at 0.2 s, and it is shown when the indicator goes. */
  const LOAD_BUILD_MS = 200, LOAD_SHOW_MS = 300;
  function openWithLoader(host, work, build, reveal) {
    if (host.classList.contains('loading')) return;   // one work at a time
    host.classList.add('loading');
    const loader = createLoader();
    host.append(loader);
    loadBook(work, 'I');
    setTimeout(build, LOAD_BUILD_MS);
    setTimeout(() => {
      loader.remove();
      host.classList.remove('loading');
      reveal();
    }, LOAD_SHOW_MS);
  }

  // The page shown when no tab is open
  const homeCarousel = $('home-carousel');
  homeCarousel.innerHTML = CAROUSEL_HTML;
  bindCarousel(homeCarousel, (work) => {
    let tab = null;
    openWithLoader(el.viewEmpty, work, () => {
      tab = newTextTab(work, 'I');
      createReader(tab);
      renderPassage(tab);
    }, () => {
      state.tabs.push(tab);
      activateTab(tab.id);
    });
  });

  /* "+" opens a new tab on the home page */
  function addNewTab() {
    const id = newTabId();
    const view = document.createElement('div');
    view.className = 'view empty-state tab-view';
    view.dataset.tabId = id;
    view.hidden = true;
    view.innerHTML = `<h2 class="home-title">Select a Text</h2><div class="home-carousel" role="list" aria-label="Choose a work to read">${CAROUSEL_HTML}</div>`;
    el.panes.append(view);
    const tab = { id, kind: 'new', partnerId: null, view, fresh: true };
    bindCarousel(view.querySelector('.home-carousel'), (work) => openWorkInTab(tab, work));
    state.tabs.push(tab);
    activateTab(id);
    return tab;
  }

  /* Choosing a work turns the new tab into a reader on Book I, in the same place in the sidebar and any split.
     The home page stays on screen with the loading indicator while the reader is built behind it. */
  function openWorkInTab(tab, work) {
    const old = tab.view;
    const current = () => getTab(tab.id) === tab && tab.view === old;   // not closed (or undone) in the meantime
    let built = null;
    openWithLoader(old, work, () => {
      if (!current()) return;
      Object.assign(tab, { kind: 'text', work, book: 'I', split: false, splitPct: 50 });
      createReader(tab);
      built = tab.ui.root;
      tab.view = old;   // the home page stays this tab's view until the reader is shown
      renderPassage(tab);
    }, () => {
      if (!built) return;
      if (!current()) {
        // closed while loading: the reader that was built is no longer anyone's
        if (getTab(tab.id) !== tab || tab.ui.root !== built) built.remove();
        return;
      }
      tab.view = built;
      tab.fresh = true;
      old.remove();
      if (state.activeId === tab.id) activateTab(tab.id); else renderAll();
    });
  }

  /* ==========================================================
     TAB HOVER CARD
     ========================================================== */
  const schedule = (fn, ms) => { clearTimeout(hoverTimer); hoverTimer = setTimeout(fn, ms); };
  const pillAnchor = (pill) => pill.closest('.tab-group') ?? pill;

  function showHoverCard(pill) {
    const tab = getTab(pill.dataset.tabId);
    if (!tab || dragging) return;
    hoveredTabId = tab.id;
    const text = isText(tab);
    el.hoverSwitch.hidden = !text;
    if (isNotebook(tab)) {
      el.hoverCite.textContent = 'Notebook';
      el.hoverDesc.textContent = countLabel();
    } else if (!text) {
      el.hoverCite.textContent = 'New Tab';
      el.hoverDesc.textContent = 'Choose a work to open';
    } else {
      const work = workOf(tab);
      el.hoverCite.textContent = `${work.title}.${ROMANS.indexOf(tab.book) + 1}.1`;
      el.hoverDesc.textContent = `${work.title} · Book ${tab.book}`;
    }

    const r = pillAnchor(pill).getBoundingClientRect();
    el.hoverCard.style.top = `${clamp(r.top - 2, 16, innerHeight - 120)}px`;
    el.hoverCard.style.left = `${r.right + 10}px`;
    el.hoverCard.classList.add('open');
  }

  function hideHoverCard() {
    hoveredTabId = null;
    el.hoverCard.classList.remove('open');
  }

  el.tabList.addEventListener('mouseover', (e) => {
    const pill = e.target.closest('.tab');
    if (!pill?.dataset.tabId || pill === hoveredPill || dragging) return;
    hoveredPill = pill;
    schedule(() => showHoverCard(pill), 120);
  });
  el.tabList.addEventListener('mouseout', (e) => {
    const pill = e.target.closest('.tab');
    if (!pill || pill.contains(e.relatedTarget)) return;
    hoveredPill = null;
    schedule(hideHoverCard, 280);
  });
  el.hoverCard.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
  el.hoverCard.addEventListener('mouseleave', () => schedule(hideHoverCard, 220));

  el.hoverSwitch.addEventListener('click', () => {
    if (!hoveredTabId) return;
    const pill = el.tabList.querySelector(`.tab[data-tab-id="${hoveredTabId}"]`);
    if (pill) openPicker(hoveredTabId, pillAnchor(pill));
  });

  el.tabList.addEventListener('click', (e) => {
    if (suppressTabClick) return;
    const pill = e.target.closest('.tab');
    if (!pill?.dataset.tabId) return;
    if (e.target.closest('.tab-close')) {
      hideHoverCard();
      closeTab(pill.dataset.tabId);
    } else {
      activateTab(pill.dataset.tabId);
    }
  });
  el.tabList.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('tab') && e.target.dataset.tabId) {
      e.preventDefault();
      activateTab(e.target.dataset.tabId);
    }
  });

  /* Collapse the tab bar and its buttons into one round button (remembered between visits).
     This sits after the hover card code because it hides the card. */
  const collapseBtn = $('btn-collapse-tabs');
  const SIDEBAR_KEY = 'epos.sidebar.collapsed';
  let bubbleTimer = 0;
  /* Replays the tabs bubbling out of the button bar (the CSS does the motion; --i is each tab's turn) */
  function bubbleTabs() {
    [...el.tabList.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 8)));
    el.sidebar.classList.remove('bubbling');
    void el.sidebar.offsetWidth;   // restart the animation
    el.sidebar.classList.add('bubbling');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => el.sidebar.classList.remove('bubbling'), 1500);
  }

  function setSidebarCollapsed(collapsed) {
    hideHoverCard();
    const opening = !collapsed && el.sidebar.classList.contains('collapsed');
    el.sidebar.classList.toggle('collapsed', collapsed);
    if (opening) bubbleTabs();
    else if (collapsed) el.sidebar.classList.remove('bubbling');
    const label = collapsed ? 'Expand tabs' : 'Collapse tabs';
    collapseBtn.dataset.tip = label;
    collapseBtn.setAttribute('aria-label', label);
    collapseBtn.setAttribute('aria-expanded', String(!collapsed));
    try { localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0'); } catch { /* storage unavailable */ }
  }
  collapseBtn.addEventListener('click', () => setSidebarCollapsed(!el.sidebar.classList.contains('collapsed')));
  try { if (localStorage.getItem(SIDEBAR_KEY) === '1') setSidebarCollapsed(true); } catch { /* storage unavailable */ }

  /* ==========================================================
     SETTINGS PAGE
     ========================================================== */
  el.settingsChips.innerHTML = Object.entries(WORKS).map(([key, w]) => `
    <button class="settings-chip" data-work="${key}">
      <span class="settings-chip-title">${esc(w.title)}</span>
      <span class="settings-chip-sub">${esc(`${w.poet} · ${w.shortLanguage}`)}</span>
    </button>`).join('');

  function syncSettingsChips(workKey) {
    for (const chip of el.settingsChips.children) chip.classList.toggle('active', chip.dataset.work === workKey);
  }

  el.settingsChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.settings-chip');
    if (!chip) return;
    const workKey = chip.dataset.work;
    const tab = activeTab();
    if (!isText(tab)) {
      addTab(workKey, 'I');
    } else {
      tab.work = workKey;
      tab.book = 'I';
      renderReader(tab);
      renderAll();
    }
    syncSettingsChips(workKey);
  });

  /* ==========================================================
     COLOR PALETTES (Material 3 Expressive)
     ========================================================== */
  const PALETTES = {
    green: { name: 'Pine', p: '#4E6543', on: '#FFFFFF', c: '#CFEBC0', onc: '#0C2006', s: '#54634D', sc: '#D7E8CE', onsc: '#121F0E' },
    red: { name: 'Coral', p: '#8C4A56', on: '#FFFFFF', c: '#FFD9DF', onc: '#3A0715', s: '#75565B', sc: '#FFD9DF', onsc: '#2B1519' },
    bluegray: { name: 'Slate', p: '#505F6E', on: '#FFFFFF', c: '#D5E4F7', onc: '#0C1D29', s: '#555F68', sc: '#D9E3ED', onsc: '#121C23' },
    yellow: { name: 'Golden', p: '#695F10', on: '#FFFFFF', c: '#F4E489', onc: '#201C00', s: '#635F41', sc: '#EAE3BD', onsc: '#1F1C05' },
    purple: { name: 'Lavender', p: '#7D33CF', on: '#FFFFFF', c: '#EADDFF', onc: '#24005B', s: '#625B71', sc: '#E8DEF8', onsc: '#1E192B' }
  };
  const PALETTE_KEY = 'epos.palette.v1';

  function applyPalette(key) {
    const paletteKey = PALETTES[key] ? key : 'bluegray';
    const pal = PALETTES[paletteKey];
    const vars = {
      '--primary': pal.p, '--on-primary': pal.on, '--primary-container': pal.c, '--on-primary-container': pal.onc,
      '--secondary': pal.s, '--secondary-container': pal.sc, '--on-secondary-container': pal.onsc
    };
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    for (const chip of el.paletteChips.children) chip.classList.toggle('active', chip.dataset.palette === paletteKey);
    for (const it of el.paletteMenu.children) {
      const on = it.dataset.palette === paletteKey;
      it.classList.toggle('active', on);
      it.setAttribute('aria-checked', String(on));
    }
    return paletteKey;
  }

  el.paletteChips.innerHTML = Object.entries(PALETTES).map(([key, pal]) => `
    <button class="settings-chip" data-palette="${key}">
      <span class="palette-swatch"><span class="palette-dot" style="background:${pal.p}"></span><span class="palette-dot" style="background:${pal.c}"></span><span class="palette-dot" style="background:${pal.sc}"></span></span>
      <span class="settings-chip-title">${esc(pal.name)}</span>
      <span class="settings-chip-sub">${esc(pal.p.toUpperCase())}</span>
    </button>`).join('');

  el.paletteMenu.innerHTML = Object.entries(PALETTES).map(([key, pal]) => `
    <button class="sub-item" data-palette="${key}" role="menuitemradio" aria-checked="false">
      <span class="sub-lead"><span class="sub-dot" style="background:${pal.p}"></span><svg class="icon sub-check"><use href="assets/icons.svg#i-check"/></svg></span>
      <span>${esc(pal.name)}</span>
    </button>`).join('');

  function choosePalette(key) {
    const saved = applyPalette(key);
    try { localStorage.setItem(PALETTE_KEY, saved); } catch { /* storage unavailable */ }
  }

  for (const container of [el.paletteChips, el.paletteMenu]) {
    container.addEventListener('click', (e) => {
      const it = e.target.closest('[data-palette]');
      if (it) choosePalette(it.dataset.palette);
    });
  }

  let savedPalette = null;
  try { savedPalette = localStorage.getItem(PALETTE_KEY); } catch { /* storage unavailable */ }
  applyPalette(savedPalette || 'bluegray');

  /* ==========================================================
     TOP BAR, TOOLBAR & TEXT OPTIONS
     ========================================================== */
  el.menuBtn.addEventListener('click', () => {
    const open = !el.drawer.classList.contains('open');
    closePopovers(el.drawer);
    setOpen(el.drawer, open);
    if (!open) closePaletteMenu();
  });

  const paletteItem = $('drawer-palette');
  function openPaletteMenu() {
    const d = el.drawer.getBoundingClientRect();
    const r = paletteItem.getBoundingClientRect();
    el.paletteMenu.style.left = `${d.right + 8}px`;
    el.paletteMenu.style.top = `${clamp(r.top - 8, 72, Math.max(72, innerHeight - 560))}px`;
    paletteItem.classList.add('open');
    setOpen(el.paletteMenu, true);
  }
  function closePaletteMenu() {
    paletteItem.classList.remove('open');
    setOpen(el.paletteMenu, false);
  }
  paletteItem.addEventListener('mouseenter', openPaletteMenu);

  el.drawer.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'palette') {
      openPaletteMenu();
    } else if (action === 'settings') {
      closePaletteMenu();
      setView('settings');
    } else if (action === 'about') {
      setOpen(el.drawer, false);
      closePaletteMenu();
    }
  });

  el.brandBtn.addEventListener('click', () => setView('reader'));
  el.segments.addEventListener('click', (e) => {
    const seg = e.target.closest('.segment');
    if (seg) setBook(seg.dataset.book);
  });
  el.segments.addEventListener('animationend', (e) => e.target.classList.remove('ripple-left', 'ripple-right'));

  /* The toolbar is one bar: a circle with a single button when collapsed (the default), a pill of tools when open */
  const toolBar = $('tool-bar'), toolToggle = $('btn-tools');
  function setTools(open) {
    toolBar.classList.toggle('open', open);
    const label = open ? 'Hide tools' : 'Show tools';
    toolToggle.setAttribute('aria-expanded', String(open));
    toolToggle.setAttribute('aria-label', label);
    toolToggle.dataset.tip = label;
    if (!open) { setOpen(el.flyout, false); setOpen(el.popupsFlyout, false); }
  }
  toolToggle.addEventListener('click', () => setTools(!toolBar.classList.contains('open')));
  // Clicking anywhere outside the bar (and the flyouts that belong to it) folds it back into the circle
  document.addEventListener('pointerdown', (e) => {
    if (toolBar.classList.contains('open') && !e.target.closest('#tool-bar, #flyout, #popups-flyout')) setTools(false);
  });

  el.splitBtn.addEventListener('click', toggleSplit);
  el.meterBtn.addEventListener('click', toggleScansion);
  for (const [btn, flyout] of [[el.textBtn, el.flyout], [el.popupsBtn, el.popupsFlyout]]) {
    btn.addEventListener('click', () => {
      const open = !flyout.classList.contains('open');
      closePopovers(flyout);
      setOpen(flyout, open);
    });
  }

  // View Options switches. The popup switches close the gloss so it reopens with the new setting;
  // the scansion switches set an attribute on <html> that the scansion CSS reads.
  function bindSwitch(btn, key, onChange = hideWordCard) {
    btn.addEventListener('click', () => {
      const on = !state.popups[key];
      state.popups[key] = on;
      btn.setAttribute('aria-checked', String(on));
      onChange(on);
    });
  }
  bindSwitch(el.swWords, 'words');
  bindSwitch(el.swNotes, 'notes');
  bindSwitch(el.swCaesura, 'caesura', (on) => { root.dataset.caesura = on ? 'on' : 'off'; });
  bindSwitch(el.swSynizesis, 'synizesis', (on) => { root.dataset.synizesis = on ? 'on' : 'off'; });

  // Close buttons inside popovers
  document.querySelectorAll('[data-close]').forEach((btn) =>
    btn.addEventListener('click', () => setOpen($(btn.dataset.close), false)));

  // Text size: each reader sets its own size when it fits its text, so only the chosen size is stored here
  el.fontSlider.addEventListener('input', () => {
    const val = parseFloat(el.fontSlider.value);
    const max = parseFloat(el.fontSlider.max);
    el.sizeSlider.style.setProperty('--pct', ((val - MIN_FONT) / (max - MIN_FONT)).toFixed(4));
    state.fontRem = val;
    fitAll();
  });

  // Handle squeezes while dragging, then bounces back
  const endSliderDrag = () => el.sizeSlider.classList.remove('dragging');
  el.fontSlider.addEventListener('pointerdown', () => el.sizeSlider.classList.add('dragging'));
  el.fontSlider.addEventListener('blur', endSliderDrag);
  addEventListener('pointerup', endSliderDrag);
  addEventListener('pointercancel', endSliderDrag);

  // Each pill group writes its data-value into the CSS variable named by data-var.
  el.flyout.addEventListener('click', (e) => {
    const opt = e.target.closest('.pill-opt');
    if (!opt) return;
    const group = opt.parentElement;
    for (const b of group.children) b.classList.toggle('active', b === opt);
    root.style.setProperty(group.dataset.var, opt.dataset.value);
    fitAll(true);   // a different font or spacing changes how wide the lines are
  });

  /* ==========================================================
     GLOBAL: outside-click & Escape dismissal
     ========================================================== */
  document.addEventListener('click', (e) => {
    const t = e.target;
    const startedInNote = downInNote;
    downInNote = false;
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

  /* ==========================================================
     NOTES
     - Word notes: written from the gloss popup, tied to a book,
       line and word. They show inside the gloss and mark the word.
     - Notebook notes: written and edited right on the Notebook
       page, tied to nothing.
     Saved in localStorage when available.
     ========================================================== */
  const NOTE_W = 290;

  const noteById = (id) => state.notes.find((n) => n.id === id);
  const newId = () => `n-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const isTied = (n) => !!(n.work && n.line && WORKS[n.work]);

  function findWordNote(c) {
    return state.notes.find((n) => n.wordIdx != null && n.work === c.work && n.book === c.book
      && n.line === c.line && n.wordIdx === c.wordIdx);
  }

  function countLabel() {
    const n = state.notes.filter((x) => !x.draft).length;
    return `${n} ${n === 1 ? 'note' : 'notes'}`;
  }

  const noteSource = (n) => `${WORKS[n.work]?.title ?? n.work} · Book ${n.book} · Line ${n.line}`;

  function loadNotes() {
    try {
      const raw = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
      const list = Array.isArray(raw) ? raw.filter((n) => n && n.id && typeof n.text === 'string') : [];
      // The array order is the order on the Notebook page (new notes go first). Notes saved
      // before that were shown newest-first, so put them in that order once and keep it.
      if (!localStorage.getItem('epos.notes.ordered')) {
        list.sort((a, b) => (b.created || 0) - (a.created || 0));
        localStorage.setItem(NOTES_KEY, JSON.stringify(list));
        localStorage.setItem('epos.notes.ordered', '1');
      }
      return list;
    } catch { return []; }
  }

  function saveNotes() {
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(state.notes.filter((n) => !n.draft))); }
    catch { /* storage unavailable: notes stay in memory for this session */ }
  }

  /* Everything that has to refresh after any change to the notes.
     Edits made on the Notebook page already updated their own card. */
  function noteChanged(fromNotebook = false) {
    saveNotes();
    if (fromNotebook) updateNotebookHeader();
    else if (!el.viewNotebook.hidden && !el.panes.hidden) renderNotebook();
    else notebookDirty = true;
    refreshNoteMarks();
    syncCardNote();
  }

  /* ---- Notebook tab ---- */
  function openNotebook() {
    const existing = state.tabs.find(isNotebook);
    if (existing) {
      activateTab(existing.id);
      return;
    }
    const tab = { id: 'tab-notebook', kind: 'notebook', partnerId: null, view: el.viewNotebook, fresh: true };
    el.viewNotebook.dataset.tabId = tab.id;
    state.tabs.push(tab);
    notebookDirty = true;
    activateTab(tab.id);
  }

  function updateNotebookHeader() {
    const b = state.bookmarks.length;
    el.nbCount.textContent = `${countLabel()} · ${b} ${b === 1 ? 'bookmark' : 'bookmarks'}`;
    el.nbBmCount.textContent = String(b);
    el.nbEmpty.hidden = state.notes.length > 0;
    el.noteGrid.hidden = state.notes.length === 0;
  }

  function noteCardHtml(n) {
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

  function renderNotebook() {
    notebookDirty = false;
    updateNotebookHeader();
    el.noteGrid.innerHTML = state.notes.map(noteCardHtml).join('');
    renderBookmarks();
  }

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
  let suppressNoteClick = false;
  el.noteGrid.addEventListener('click', (e) => {
    if (suppressNoteClick) return;   // the click that ends a drag
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

  /* Open the note's text in a tab (reusing one already on that book, which keeps
     a split intact), scroll to the line and open the word's gloss. */
  async function jumpToLine(work, book, line, wordIdx = null) {
    let tab = state.tabs.find((t) => isText(t) && t.work === work && t.book === book);
    if (tab) activateTab(tab.id); else tab = addTab(work, book);
    await tab.ui.ready;

    keepCardUntil = performance.now() + 600;
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

  const jumpToNote = (note) => jumpToLine(note.work, note.book, note.line, note.wordIdx);

  /* ---- Dragging notes ----
     Press a card and a gray ripple spreads from the cursor; drag it and it is filled gray and lifted.
     Other cards slide out of its way as it passes over them, and the new order is saved. */
  (() => {
    const THRESHOLD = 5, EDGE = 56, MAX_SCROLL = 18;
    const scroller = el.notebookPane;
    let press = null;   // pointer is down on a card but hasn't moved far enough to be a drag yet
    let drag = null;    // a card is being dragged

    const cards = () => [...el.noteGrid.children];
    const rectOf = (n) => n.getBoundingClientRect();
    const activeId = () => (drag ?? press)?.id;

    el.noteGrid.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.pointerType === 'touch' || press || drag) return;
      if (e.target.closest('.note-del')) return;
      const card = e.target.closest('.note-card');
      const note = card && noteById(card.dataset.noteId);
      if (!note || note.draft) return;
      const ta = e.target.closest('.note-text');
      if (ta && document.activeElement === ta) return;   // already editing: dragging selects text
      press = { card, id: e.pointerId, x: e.clientX, y: e.clientY, ta, ripple: null };
      startRipple(e);
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onCancel);
    });

    // Keep the text box from taking focus until we know the press was a click and not the start of a drag
    el.noteGrid.addEventListener('mousedown', (e) => {
      if (press?.ta && e.button === 0) e.preventDefault();
    });

    function startRipple(e) {
      const { card } = press;
      const r = rectOf(card);
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const rad = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
      const rp = document.createElement('span');
      rp.className = 'note-ripple';
      Object.assign(rp.style, { width: `${rad * 2}px`, height: `${rad * 2}px`, left: `${x - rad}px`, top: `${y - rad}px` });
      card.prepend(rp);
      card.classList.add('pressed');
      void rp.offsetWidth;
      rp.classList.add('grow');
      press.ripple = rp;
    }

    function endPress(s) {
      s.card.classList.remove('pressed');
      const rp = s.ripple;
      if (!rp) return;
      rp.classList.add('fade');
      setTimeout(() => rp.remove(), 260);
    }

    function stopListening() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onCancel);
    }

    function onMove(e) {
      if (e.pointerId !== activeId()) return;
      if (!drag) {
        if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < THRESHOLD) return;
        startDrag(e);
      }
      drag.px = e.clientX;
      drag.py = e.clientY;
      update();
    }

    function onUp(e) {
      if (e.pointerId !== activeId()) return;
      if (drag) { drop(false); return; }
      // No drag: it was a click
      const s = press;
      press = null;
      stopListening();
      endPress(s);
      if (s.ta) {
        s.ta.focus();
        s.ta.setSelectionRange(s.ta.value.length, s.ta.value.length);
      }
    }

    function onCancel() {
      if (drag) { drop(true); return; }
      if (!press) return;
      const s = press;
      press = null;
      stopListening();
      endPress(s);
    }

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drag) drop(true); });

    /* Layout positions of the other cards, so hit-testing isn't thrown off by their sliding animations */
    function measureSlots() {
      drag.slots = new Map(cards().filter((c) => c !== drag.card).map((c) => [c, rectOf(c)]));
      drag.slotScroll = scroller.scrollTop;
    }

    function startDrag(e) {
      const s = press;
      press = null;
      cards().forEach((c) => c.getAnimations().forEach((a) => a.cancel()));
      if (s.card.contains(document.activeElement)) document.activeElement.blur();
      getSelection()?.removeAllRanges();
      const r = rectOf(s.card);
      drag = { ...s, grabX: s.x - r.left, grabY: s.y - r.top, px: e.clientX, py: e.clientY,
        order: cards(), slots: null, slotScroll: 0, raf: 0 };
      measureSlots();
      s.card.classList.add('dragging');
      el.noteGrid.classList.add('sorting');
      document.body.classList.add('note-dragging');
      hideWordCard();
      drag.raf = requestAnimationFrame(tick);
    }

    /* The card follows the cursor: its transform is the gap between where the cursor wants it and where its slot is */
    function place() {
      const { card } = drag;
      card.style.transform = '';
      const base = rectOf(card);
      const left = drag.px - drag.grabX, top = drag.py - drag.grabY;
      card.style.transform = `translate(${left - base.left}px, ${top - base.top}px) scale(1.02)`;
      return { left, top, w: base.width, h: base.height };
    }

    function update() {
      const { left, top, w, h } = place();
      const cx = left + w / 2, cy = top + h / 2;
      const shift = drag.slotScroll - scroller.scrollTop;
      for (const [c, r] of drag.slots) {
        if (cx >= r.left && cx <= r.right && cy >= r.top + shift && cy <= r.bottom + shift) {
          reorder(c);
          place();
          break;
        }
      }
    }

    /* Move the dragged card into another card's slot; the cards in between slide to their new places */
    function reorder(over) {
      const { card } = drag;
      const others = cards().filter((c) => c !== card);
      const first = new Map(others.map((c) => [c, rectOf(c)]));
      others.forEach((c) => c.getAnimations().forEach((a) => a.cancel()));
      const all = cards();
      if (all.indexOf(over) > all.indexOf(card)) over.after(card); else over.before(card);
      measureSlots();
      for (const c of others) {
        const f = first.get(c), l = drag.slots.get(c);
        const dx = f.left - l.left, dy = f.top - l.top;
        if (!dx && !dy) continue;
        c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
          { duration: 360, easing: 'cubic-bezier(0.34, 1.3, 0.64, 1)' });
      }
    }

    /* Scroll the page when the card is held near its top or bottom edge */
    function tick() {
      if (!drag) return;
      const r = rectOf(scroller);
      let v = 0;
      if (drag.py < r.top + EDGE) v = -Math.ceil((1 - clamp((drag.py - r.top) / EDGE, 0, 1)) * MAX_SCROLL);
      else if (drag.py > r.bottom - EDGE) v = Math.ceil((1 - clamp((r.bottom - drag.py) / EDGE, 0, 1)) * MAX_SCROLL);
      if (v) {
        const before = scroller.scrollTop;
        scroller.scrollTop += v;
        if (scroller.scrollTop !== before) update();
      }
      drag.raf = requestAnimationFrame(tick);
    }

    function drop(cancel) {
      const s = drag;
      drag = null;
      cancelAnimationFrame(s.raf);
      stopListening();
      suppressNoteClick = true;
      setTimeout(() => { suppressNoteClick = false; }, 0);
      document.body.classList.remove('note-dragging');
      el.noteGrid.classList.remove('sorting');

      cards().forEach((c) => { if (c !== s.card) c.getAnimations().forEach((a) => a.cancel()); });
      if (cancel) s.order.forEach((c) => el.noteGrid.append(c));

      // The card settles into its slot with a little bounce, then drops back to its resting look
      const { card } = s;
      const from = rectOf(card);
      card.style.transform = '';
      const to = rectOf(card);
      const settle = card.animate(
        [{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(1.02)` }, { transform: 'none' }],
        { duration: 380, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' });
      settle.onfinish = settle.oncancel = () => { card.classList.remove('dragging'); endPress(s); };

      if (!cancel) {
        // Reorder by position on the page (a map lookup per note instead of indexOf per comparison)
        const pos = new Map(cards().map((c, i) => [c.dataset.noteId, i]));
        const before = state.notes.map((n) => n.id).join();
        state.notes.sort((a, b) => pos.get(a.id) - pos.get(b.id));
        if (state.notes.map((n) => n.id).join() !== before) saveNotes();
      }
    }
  })();

  /* ---- Marks and gloss ---- */
  function refreshNoteMarks(tabs = state.tabs) {
    for (const tab of tabs) {
      if (!isText(tab)) continue;
      tab.ui.passage.querySelectorAll('.word.has-note').forEach((w) => w.classList.remove('has-note'));
      markNotes(tab, tab.ui.passage);
    }
  }

  /* Marks the noted words inside `scope` (the passage, or one chunk as it is added) */
  function markNotes(tab, scope) {
    for (const n of state.notes) {
      if (n.wordIdx == null || n.work !== tab.work || n.book !== tab.book) continue;
      scope.querySelector(`.verse[data-line="${n.line}"] .word[data-i="${n.wordIdx}"]`)?.classList.add('has-note');
    }
  }

  function positionWordCard(word) {
    const r = word.getBoundingClientRect();
    const left = Math.max(16, Math.min(r.left + r.width / 2 - 160, innerWidth - 340));
    let top = r.top - el.wordCard.offsetHeight - 10;   // sits just above the word, whatever its height
    if (top < 70) top = r.bottom + 12;
    el.wordCard.style.left = `${left}px`;
    el.wordCard.style.top = `${top}px`;
  }

  /* Shows the word's note inside the gloss and updates the icon */
  function syncCardNote() {
    syncCardBookmark();
    const note = wordCtx && findWordNote(wordCtx);
    const label = note ? 'Edit note' : 'Add note';
    el.cardNote.classList.toggle('has-note', !!note);
    el.cardNote.dataset.tip = label;
    el.cardNote.setAttribute('aria-label', label);
    el.cardNote.hidden = !state.popups.notes;
    el.cardUserNote.hidden = !note || !state.popups.notes;
    if (note) el.cardUserNoteText.textContent = note.text;
    if (selectedWord && el.wordCard.classList.contains('visible')) positionWordCard(selectedWord);
  }

  /* ---- Floating note box (word notes) ---- */
  function placeNoteBox(a) {
    const gap = 12, h = el.noteBox.offsetHeight || 200;
    let left, top = a.y;
    if (a.x + a.w + gap + NOTE_W <= innerWidth - 12) left = a.x + a.w + gap;
    else if (a.x - gap - NOTE_W >= 12) left = a.x - gap - NOTE_W;
    else { left = a.x; top = a.y + a.h + gap; }
    el.noteBox.style.left = `${clamp(left, 12, innerWidth - NOTE_W - 12)}px`;
    el.noteBox.style.top = `${clamp(top, 72, Math.max(72, innerHeight - h - 12))}px`;
  }

  function openWordNote() {
    if (!wordCtx) return;
    if (noteCtx) { closeNote(); return; }
    const existing = findWordNote(wordCtx);
    noteCtx = { ...wordCtx, noteId: existing?.id };
    el.noteTitle.textContent = `Note on “${wordCtx.word}”`;
    el.noteInput.value = existing?.text ?? '';
    placeNoteBox({
      x: parseFloat(el.wordCard.style.left), y: parseFloat(el.wordCard.style.top),
      w: el.wordCard.offsetWidth, h: el.wordCard.offsetHeight
    });
    el.noteBox.classList.add('open');
    el.cardNote.setAttribute('aria-expanded', 'true');
    el.noteInput.focus({ preventScroll: true });
    el.noteInput.setSelectionRange(el.noteInput.value.length, el.noteInput.value.length);
  }

  function closeNote() {
    const ctx = noteCtx;
    if (!ctx) return;
    noteCtx = null;
    el.noteBox.classList.remove('open');
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

  el.cardNote.addEventListener('click', openWordNote);
  el.cardUserNote.addEventListener('click', openWordNote);
  el.noteInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); closeNote(); }
  });
  document.addEventListener('pointerdown', (e) => { downInNote = !!e.target.closest('#note-box'); }, true);

  /* ==========================================================
     BOOKMARKS
     A bookmark is tied to one line of a book and is added or removed from the word card. It shows as a
     marker at the right of the line and as a dot on the original pane's scrollbar (click it to jump),
     and is listed on the Notebook page below the notes. Saved in localStorage when available.
     ========================================================== */
  const TRACK_PAD = 24;   // the scrollbar track's end margin, as set on .pane::-webkit-scrollbar-track (--radius-xl)
  const THUMB_MIN = 32;   // the thumb's shortest length: its min-height in styles.css

  function loadBookmarks() {
    try {
      const raw = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
      return Array.isArray(raw)
        ? raw.filter((b) => b && b.id && WORKS[b.work] && typeof b.book === 'string' && Number.isInteger(b.line))
        : [];
    } catch { return []; }
  }

  function saveBookmarks() {
    try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(state.bookmarks)); }
    catch { /* storage unavailable: bookmarks stay in memory for this session */ }
  }

  /* The start of the line, kept with the bookmark so the Notebook can show it without opening the book */
  function lineSnippet(tab, line) {
    const l = tab.bookData?.byLine.get(line);
    const words = l ? l.w.map((w) => w.f) : (WORKS[tab.work]?.lines?.[line - 1] ?? '').trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 7).join(' ') + (words.length > 7 ? '…' : '');
  }

  const isMarked = (b, tab) => b.work === tab.work && b.book === tab.book;

  function toggleBookmark(tab, line) {
    const i = state.bookmarks.findIndex((b) => isMarked(b, tab) && b.line === line);
    if (i >= 0) state.bookmarks.splice(i, 1);
    else state.bookmarks.push({ id: newId(), work: tab.work, book: tab.book, line, text: lineSnippet(tab, line), created: Date.now() });
    bookmarksChanged();
  }

  /* Everything that has to refresh after any change to the bookmarks */
  function bookmarksChanged() {
    saveBookmarks();
    refreshBookmarkMarks();
    syncCardBookmark();
    if (!el.viewNotebook.hidden && !el.panes.hidden) { updateNotebookHeader(); renderBookmarks(); }
    else notebookDirty = true;
  }

  /* ---- Marks in the text and dots on the scrollbar ---- */
  function refreshBookmarkMarks(tabs = state.tabs) {
    for (const tab of tabs) {
      if (!isText(tab)) continue;
      tab.ui.passage.querySelectorAll('.verse.bookmarked').forEach((v) => v.classList.remove('bookmarked'));
      markBookmarks(tab, tab.ui.passage);
      renderRail(tab);
    }
  }

  /* Marks the bookmarked lines inside `scope` (the passage, or one chunk as it is added) */
  function markBookmarks(tab, scope) {
    for (const b of state.bookmarks) {
      if (isMarked(b, tab)) scope.querySelector(`.verse[data-line="${b.line}"]`)?.classList.add('bookmarked');
    }
  }

  /* Puts the rail over the original pane's scrollbar and a dot on it for each bookmark. The dot sits where the
     scrollbar thumb's centre is when that line is centred in the pane (which is where a jump puts it), using
     the browser's own thumb maths: thumb top = scrollTop / (scrollHeight - clientHeight) * (track - thumb).
     The spacers keep scrollHeight at the whole book's height, so this holds whichever chunks are in the page. */
  function renderRail(tab) {
    const ui = tab.ui;
    const ch = ui?.chunkers?.[0];
    const pane = ui?.paneOriginal;
    if (!ui?.rail) return;
    const marks = ch?.pitch && !ui.root.hidden && pane.scrollHeight > pane.clientHeight
      ? state.bookmarks.filter((b) => isMarked(b, tab) && ch.lineNums.includes(b.line)) : [];
    ui.rail.style.display = marks.length ? 'block' : '';
    if (!marks.length) {
      ui.rail.innerHTML = ui.railHtml = '';
      ui.railMarks = [];
      pane?.classList.remove('bm-near');
      return;
    }

    ui.rail.style.left = `${pane.offsetLeft + pane.clientLeft + pane.clientWidth}px`;
    ui.rail.style.top = `${pane.offsetTop + pane.clientTop}px`;
    ui.rail.style.height = `${pane.clientHeight}px`;

    const C = pane.clientHeight, H = pane.scrollHeight, T = C - 2 * TRACK_PAD;
    const L = Math.min(T, Math.max((T * C) / H, THUMB_MIN));   // thumb length
    const top = textTop(ch);
    ui.railMarks = marks.map((b) => {
      const p = top + (ch.lineNums.indexOf(b.line) + 0.5) * ch.pitch;   // the line's centre in scroll space
      const s = clamp(p - C / 2, 0, H - C);                              // scrollTop with that line centred
      return { line: b.line, p, y: TRACK_PAD + (s / (H - C)) * (T - L) + L / 2 };
    });
    const html = ui.railMarks.map((m) =>
      `<button class="bm-dot" data-line="${m.line}" data-tip="Line ${m.line}" data-tip-side="left"
        aria-label="Go to line ${m.line}" style="top:${m.y.toFixed(1)}px"></button>`).join('');
    if (ui.railHtml !== html) { ui.rail.innerHTML = html; ui.railHtml = html; }
    updateRailNear(tab);
  }

  /* Scrolled to within a quarter-screen of a bookmark: its dot grows into a circle and the thumb's pill hides,
     so the scrollbar looks like it has turned into the bookmark. */
  function updateRailNear(tab) {
    const ui = tab.ui;
    const pane = ui?.paneOriginal;
    const marks = ui?.railMarks;
    if (!marks?.length) return;
    const centre = pane.scrollTop + pane.clientHeight / 2;
    const reach = pane.clientHeight * 0.75;
    let any = false;
    marks.forEach((m, i) => {
      const near = Math.abs(m.p - centre) <= reach;
      ui.rail.children[i]?.classList.toggle('near', near);
      any ||= near;
    });
    pane.classList.toggle('bm-near', any);
  }

  function flashLine(verse) {
    if (!verse) return;
    verse.classList.remove('flash');
    void verse.offsetWidth;   // replay the animation if it is still running
    verse.classList.add('flash');
    setTimeout(() => verse.classList.remove('flash'), 1300);
  }

  /* ---- Word card button ---- */
  function syncCardBookmark() {
    const tab = selectedWord && getTab(selectedWord.closest('.tab-view')?.dataset.tabId);
    const on = !!(wordCtx && tab && state.bookmarks.some((b) => isMarked(b, tab) && b.line === wordCtx.line));
    el.cardBookmark.classList.toggle('has-bookmark', on);
    el.cardBookmark.setAttribute('aria-pressed', String(on));
    el.cardBookmark.dataset.tip = on ? 'Remove bookmark' : 'Bookmark this line';
  }

  el.cardBookmark.addEventListener('click', () => {
    const tab = selectedWord && getTab(selectedWord.closest('.tab-view')?.dataset.tabId);
    if (wordCtx && tab) toggleBookmark(tab, wordCtx.line);
  });

  /* ---- Notebook list ---- */
  const bookmarkOrder = Object.keys(WORKS);

  function bookmarkCardHtml(b) {
    return `
      <article class="bm-card" data-bm-id="${b.id}" tabindex="0" role="button" aria-label="Go to ${esc(noteSource(b))}">
        <div class="bm-src">${icon('bookmark')}<span>${esc(noteSource(b))}</span></div>
        ${b.text ? `<div class="bm-text">${esc(b.text)}</div>` : ''}
        <button class="note-del" data-tip="Remove bookmark" aria-label="Remove bookmark">${icon('trash')}</button>
      </article>`;
  }

  function renderBookmarks() {
    const list = [...state.bookmarks].sort((a, b) =>
      bookmarkOrder.indexOf(a.work) - bookmarkOrder.indexOf(b.work)
      || ROMANS.indexOf(a.book) - ROMANS.indexOf(b.book)
      || a.line - b.line);
    el.bmEmpty.hidden = list.length > 0;
    el.bmList.hidden = list.length === 0;
    el.bmList.innerHTML = list.map(bookmarkCardHtml).join('');
  }

  el.bmList.addEventListener('click', (e) => {
    const card = e.target.closest('.bm-card');
    const b = card && state.bookmarks.find((x) => x.id === card.dataset.bmId);
    if (!b) return;
    if (e.target.closest('.note-del')) {
      state.bookmarks.splice(state.bookmarks.indexOf(b), 1);
      bookmarksChanged();
    } else {
      jumpToLine(b.work, b.book, b.line);
    }
  });

  el.bmList.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target !== e.target.closest('.bm-card')) return;
    const b = state.bookmarks.find((x) => x.id === e.target.dataset.bmId);
    if (b) jumpToLine(b.work, b.book, b.line);
  });

  /* Hover tips: any element with data-tip gets a small popup in the style of the tab hover card */
  (() => {
    const tip = $('tip');
    let timer = 0, current = null, px = 0, py = 0;
    const FROM = { left: 'translateX(6px)', right: 'translateX(-6px)', top: 'translateY(6px)', bottom: 'translateY(-6px)', pointer: 'translateY(4px)' };

    function hide() {
      clearTimeout(timer);
      current = null;
      tip.classList.remove('show');
    }
    function show(target) {
      tip.textContent = target.dataset.tip;
      const r = target.getBoundingClientRect();
      const w = tip.offsetWidth, h = tip.offsetHeight;
      let side = target.dataset.tipSide
        || (target.closest('.toolbar') ? 'left' : target.closest('.sidebar') ? 'right' : target.closest('.top-bar') ? 'bottom' : 'top');
      if (r.height > 200 || r.width > 400) side = 'pointer';   // long handles: follow the cursor instead
      let x, y;
      if (side === 'left') { x = r.left - w - 10; y = r.top + r.height / 2 - h / 2; }
      else if (side === 'right') { x = r.right + 10; y = r.top + r.height / 2 - h / 2; }
      else if (side === 'bottom') { x = r.left + r.width / 2 - w / 2; y = r.bottom + 8; }
      else if (side === 'pointer') { x = px + 12; y = py + 18; }
      else { x = r.left + r.width / 2 - w / 2; y = r.top - h - 8; }
      tip.style.left = `${clamp(x, 8, innerWidth - w - 8)}px`;
      tip.style.top = `${clamp(y, 8, innerHeight - h - 8)}px`;
      tip.style.setProperty('--from', FROM[side]);
      tip.classList.add('show');
    }

    document.addEventListener('pointerover', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      px = e.clientX; py = e.clientY;
      const target = e.target.closest?.('[data-tip]');
      if (target === current) return;
      hide();
      if (!target) return;
      current = target;
      timer = setTimeout(() => show(target), 350);
    });
    // The cursor position is only needed for long handles, so it is tracked only while one is hovered
    document.addEventListener('pointermove', (e) => { if (current) { px = e.clientX; py = e.clientY; } }, { passive: true });
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('scroll', hide, true);
    addEventListener('blur', hide);
  })();

  addNewTab();   // a New Tab is always open when the page loads
