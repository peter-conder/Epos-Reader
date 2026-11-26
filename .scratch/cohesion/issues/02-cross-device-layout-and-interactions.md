# Phase 2: Cross-device layout, swipe, and interaction fixes

Status: resolved

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

**2026-11-26:** Resolved.
- Fixed edge-swipe z-index & Tab Grid underlay (`js/pages.js`), horizontal swipe-in `sheetUp` replay (`js/chapters.js`, `css/styles.css`), rapid-swipe settle timer race & Settings `canHide()` (`js/bottom-bar.js`), and `.back-chip` overlay hiding (`js/mobile-bookmarks.js`, `css/styles.css`).
- Removed duplicate Format Text row from `#drawer` (`index.html`, `js/toolbar.js`).
- Parameterized Scansion `--word-px` / `--word-gap` and added compact wrapped row spacing + `syncLayout` on `toggleScansion`; hid Pane Margins below 600px and kept compact margins fixed with 28px right clearance for the flush-right 24px Bookmark dot strip; relaxed compact bottom-bar pill padding; made Notebook grids 1-column on narrow screens.
- Gave tablet (`600–1024px`) Parallel translation rounded cards with outer padding, scaled Tab Grid to 3 columns at `>= 720px`, and ignored desktop Splits below desktop in `js/fit.js`, `js/english.js`, and `js/reader.js`.
- Fixed Greek `GR`/`Greek` labels, wheel forwarding over mobile overlays, `chooseBook()` / `setBook()` scroll resets, Format Text dismissal on navigation, `swallowClick` timeout, `jumpToLine()` compact Translation reset, `visibleLines()` `topInset()`, mobile Undo `autoId`, desktop Settings chrome/brand/toolbar states, flyout/picker viewport clamping, and 3-digit `.verse-bm` gutter clearance.
- Verified in headless Chromium at 1280×800, 768×1024, and 390×844 with 0 errors.
