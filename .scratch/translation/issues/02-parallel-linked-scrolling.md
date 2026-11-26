# Show the Translation in the Parallel translation, with linked scrolling

Status: ready-for-agent
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
