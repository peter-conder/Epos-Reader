/* Small DOM helpers and the map of fixed page elements */

export const $ = (id) => document.getElementById(id);
export const root = document.documentElement;
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const icon = (name) => `<svg class="icon"><use href="assets/icons.svg#i-${name}"/></svg>`;

export const el = {
  menuBtn: $('btn-menu'), brandBtn: $('btn-brand'), brandTitle: $('brand-title'), drawer: $('drawer'), paletteMenu: $('palette-menu'),
  progress: $('progress'), segments: $('segments'),
  sidebar: $('sidebar'), tabList: $('tab-list'), addTab: $('btn-add-tab'), addNotebook: $('btn-add-notebook'),
  topLeft: document.querySelector('.top-left'), topRight: document.querySelector('.top-right'),
  main: $('main'), panes: $('panes'), dropHint: $('drop-hint'), tplReader: $('tpl-reader'),
  viewEmpty: $('view-empty'), viewSettings: $('view-settings'), viewNotebook: $('view-notebook'),
  notebookPane: $('notebook-pane'), noteGrid: $('note-grid'), nbCount: $('nb-count'), nbEmpty: $('nb-empty'),
  newNoteBtn: $('btn-new-note'),
  bmList: $('bm-list'), bmEmpty: $('bm-empty'), nbBmCount: $('nb-bm-count'), cardBookmark: $('card-bookmark'),
  sourcesList: $('sources-list'), creditsList: $('credits-list'),
  licenceNotes: $('licence-notes'), sourcesHeading: $('settings-sources'),
  splitBtn: $('btn-split'), meterBtn: $('btn-meter'), textBtn: $('btn-text'),
  popupsBtn: $('btn-popups'), themeBtn: $('btn-theme'), popupsFlyout: $('popups-flyout'), swWords: $('sw-words'), swNotes: $('sw-notes'),
  swCaesura: $('sw-caesura'), swRareScansion: $('sw-rare-scansion'),
  flyout: $('flyout'), fontSlider: $('font-size'), sizeSlider: $('size-slider'),
  picker: $('picker'), pickerTitle: $('picker-title'), workList: $('work-list'),
  bookPicker: $('book-picker'), booksGrid: $('books-grid'), backBtn: $('btn-back'),
  hoverCard: $('hover-card'), hoverCite: $('hover-cite'), hoverDesc: $('hover-desc'), hoverSwitch: $('btn-hover-switch'),
  wordCard: $('word-card'), cardLemma: $('card-lemma'), cardMorph: $('card-morph'), cardScan: $('card-scan'), cardDef: $('card-def'),
  cardNote: $('card-note'), cardUserNote: $('card-user-note'), cardUserNoteText: $('card-user-note-text'),
  noteBox: $('note-box'), noteTitle: $('note-title'), noteInput: $('note-input'), noteDone: $('note-done'),
  toast: $('toast'),
  bottomBar: $('bottom-bar'), bbPill: $('bb-pill'), bbTrack: $('bb-track'), bbProgress: $('bb-progress-fill'),
  bbCount: $('bb-count'), tabsBtn: $('btn-tabs'), formatBtn: $('btn-format'), pageBackBtn: $('btn-page-back'), bmRibbon: $('bm-ribbon'), backChip: $('back-chip'), backChipText: $('back-chip-text'),
  tabGrid: $('tab-grid'), tgCount: $('tg-count'), tgNew: $('tg-new'), tgDone: $('tg-done'), tgList: $('tg-list'),
  langBtn: $('btn-lang'), lineMenu: $('line-menu'), lineTapChips: $('linetap-chips'),
  drawerSwatches: $('drawer-swatches'), swTheme: $('sw-theme'),
  formatSheet: $('format-sheet'), fsBody: $('fs-body'), fsClose: $('fs-close'), fsGrip: $('fs-grip'), swScansion: $('sw-scansion'),
  chapterList: $('chapter-list'), clTitle: $('cl-title'), clClose: $('cl-close'), clBody: $('cl-body')
};

export const MIN_FONT = parseFloat(el.fontSlider.min);

