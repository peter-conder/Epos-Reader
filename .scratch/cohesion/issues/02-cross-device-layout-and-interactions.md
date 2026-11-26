# Phase 2: Cross-device layout, swipe, and interaction fixes

Status: ready-for-agent

## What

- Fix `#chapter-list` edge-swipe `z-index` drop and Tab Grid underlay in `js/pages.js`; fix `sheetUp` replay after horizontal swipe-in in `js/chapters.js`; fix rapid-swipe timer race and Settings `canHide()` bug in `js/bottom-bar.js`; hide `.back-chip` over pages/sheets/grid.
- Remove duplicate Format Text row from the mobile hamburger drawer (`index.html`).
- Fix compact Scansion Foot/Caesura offsets and wrapped row vertical clearance (`css/styles.css`); hide Pane Margins below 600px and keep compact's 16px margin immune to desktop inline overrides; relax `.bb-pill` right padding on small phones so Citations don't truncate.
- Tuck the mobile Bookmark dot strip flush-right with a 24px horizontal hit zone and matching right text padding so dots never steal word taps; drop Notebook `.note-grid` / `.bm-list` to 1 column on narrow screens.
- Tablet (`medium`, 600–1024px): give Parallel translation rounded cards with outer padding like desktop; scale Tab Grid to 3 columns on wider tablets; ignore desktop Splits in `js/fit.js` and `js/english.js`.
- Fix Greek `GR`/`Greek` labels in `js/english.js`; fix `js/panes.js` wheel hijacking over mobile overlays; reset scrollTop in `chooseBook()`; close Format Text sheet when navigating to Notebook/Settings; add timeout reset to long-press `swallowClick`; reset compact `tab.lang` in `jumpToLine()`; align `visibleLines()` with `topInset()`.
- Desktop: hide `#progress` and normalize brand on Settings & Sources; disable `#btn-split` on non-text views; add viewport clamping/scrolling to flyouts and Switch Work picker; prevent 3-digit `.verse-bm` clipping.

## Done when

- Verified in headless browser at 390×844, 768×1024, and 1280×800 with no layout overlap or console errors.

## Comments
