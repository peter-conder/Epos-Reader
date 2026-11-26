# Show the Translation in the Parallel translation, with linked scrolling

Status: resolved
Blocked by: 01

## What

Replace the one-English-row-per-Line pane (`js/reader.js`, `renderPassage`) with passage blocks loaded from `NN.en.json`, and link the two panes' scrolling (see `../spec.md`, decisions 2, 4, 8, 11).

## Notes

- Today the panes scroll separately (`js/reader.js`, the scroll listeners on `paneOriginal`/`paneTranslation`) and look aligned only because the rows match one for one.
- The English pane uses the same chunking idea as `js/chunks.js` but with blocks as rows, or plainly renders all blocks if that's fast enough. Measure on the longest Book.
- Mapping: top Line `L` in block `[a, b)` at fraction `(L − a + frac) / (b − a)` maps to the same fraction of that block's height, and back. Guard against feedback loops, for example by ignoring the scroll event the sync itself caused.
- Load the English the first time the English is shown in a tab, and cache it per Book. A load failure shows a retry, like the Book load error.

## Done when

- Every Book of all three Works shows its full English beside the original on desktop and tablet.
- Scrolling either pane keeps the other on the matching block, exact at block edges, with no jitter.
- Resizing, refitting and swapping Books keep the link.
- Checked in Chromium at 1280×800 and at tablet width, light and dark, with no page errors.

## Comments

**2026-11-26:** Resolved.

- **New `js/parallel.js`.** It maps an anchor in the original ({row, frac}) to its block and back (`toEnglish`, `toOriginal`), with block spans in reading order (`blockRows`, so Aeneid X's 717–718-before-714 maps correctly). It also links the panes: each pane's scroll handler calls `paneScrolled`, which moves the other pane with the new `placeAt` in `js/chunks.js`. Scrolls the link causes are ignored for 150 ms unless that pane is the one you last touched, wheeled or keyed in, so there are no echoes and no jitter. `syncLayout` calls `relinkIfNeeded`, so the English starts from the original once it is laid out (on load, and each time the pane opens).
- **English rows are now blocks.** The English chunker's rows are blocks (`.trans-block`), so the existing anchor, chunk and resize machinery works unchanged. Blocks wrap at a 34em measure and aren't width-fitted (no fit candidates). Williams's lines are `.trans-l`, with wrapped lines hanging under them.
- **Lazy loading.** `loadEnglish` in `js/book-data.js` fetches and caches `NN.en.json`. `showEnglish` in `js/reader.js` loads it the first time the English is shown (opening the pane, or a Book opening with the pane already open). A failed load shows "Couldn't load the English…" with Try again.
- **The build** now writes `form: "verse" | "prose"` in each `NN.en.json`.
- **Removed:** the "English is available for lines…" message, its `.trans-more` style, and `.translation-line`, which were part of issue 04 but lived in the code replaced here.
- **Phone swap:** `setLang` now waits for the English to load before swapping. Its mapping is still row index to row index, which is issue 03.
- **Checked in Chromium** (Playwright) at 1280×800 and 1100×800, with no page errors:
  - Iliad Α, Odyssey α–γ and Aeneid I and X, in light and dark.
  - Wheeling either pane moves the other to the matching block and fraction (e.g. Il. Α.123 → block 92 at 0.824 = 31.3/38 Lines), and both stay still afterwards.
  - Resizing keeps the link, and changing Book reloads and relinks.
  - A failed load followed by Try again works.
  - On an iPad Pro 11 (landscape), the English opens beside the original and links too.
- **Already there before this change:** at 1280×800 with the sidebar open and the pane at 50%, the Greek is clipped on the right (same with the old code).
