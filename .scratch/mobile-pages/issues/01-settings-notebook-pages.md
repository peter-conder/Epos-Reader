# Settings and the Notebook as pages, with a back button and edge swipe

Status: resolved

## What

On phones and tablets, Settings opened under the hamburger and bottom bar with no way back but picking a tab, and the Notebook was a tab like any Book. Both should be pages you visit: no floating controls, a back button, and a swipe from the left edge to go back, as on iOS.

## Done when

- Settings and the Notebook show no hamburger, bottom bar, ribbon or dots; a back button stands where the hamburger was and returns to the tab you were reading.
- The Notebook is left out of the tab grid and the swipe order on phones and tablets. Opening it there doesn't leave a tab behind; a Notebook tab saved on desktop is kept, and back from it goes to the most recent tab (or a New Tab).
- A swipe from the left edge goes back from Settings, the Notebook and the chapter list, with the page following the finger and the previous view underneath.
- Desktop is unchanged.

## Comments

**2026-11-25:** Resolved.

- New `js/pages.js`: `syncPages` (from `renderAll` and `setView`) sets `.page-open` and the back button, and closes a page-only Notebook tab once you leave it; `goBack`; the edge swipe (pointer events from the first 24px, with `touch-action: pan-y` on the pages so the browser leaves sideways moves to it).
- `js/state.js`: `readingTabs()`, the tabs without the Notebook, used by the tab grid, the bottom bar's swipe order and count, and the fallback when a tab closes on a phone.
- `js/notes.js`: on a phone or tablet the Notebook tab is made `pageOnly`.
- `index.html` / `css/styles.css`: `#btn-page-back`; `.page-open` hides the hamburger, bottom bar, ribbon and dots.
- Checked in Chromium at 390×844: Settings and the Notebook open as pages with the back button; the back button and an edge swipe return to Aen. I; the Notebook's temporary tab is gone afterwards and the grid lists only the two Books; the chapter list closes with an edge swipe. At 1280×800 the Notebook still opens as a tab.
