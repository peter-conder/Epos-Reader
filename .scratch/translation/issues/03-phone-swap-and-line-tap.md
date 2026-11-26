# Phone: EN/LA swap and "Show its English" with passages

Status: resolved
Blocked by: 02

## What

Move the phone views in `js/english.js` from per-Line English to blocks (see `../spec.md`, decisions 9 and 10).

## Done when

- **Swap:** LA → EN opens the block containing the top Line at the proportional point, and EN → LA maps back the same way. An unscrolled round trip still returns exactly where you were (`tab.swapBack`).
- **Line tap:** with "Show its English" chosen, tapping a Line number opens its whole block under that Line, headed *Lines a–b*. Tapping again closes it. Opening another closes the first. The heading appears only here.
- `englishFor` and the "No English for this line yet." text are gone.
- Checked in Chromium with a phone device profile (for example iPhone 13), light and dark, with no page errors.

## Comments

**2026-11-26 (from issue 02):**
- The mapping to use is `toEnglish` / `toOriginal` in `js/parallel.js`, which works on chunker anchors.
- `setLang` already waits for `showEnglish` before swapping, but still jumps row index to row index. Replace that with the mapping.
- The bottom bar's Line range while the English is showing (`visibleLines` on chunker 1, in `js/bottom-bar.js`) reports block start Lines. It should give the first visible block's start to the last visible block's end.
- `englishFor` in `js/english.js` still reads the old `WORKS[work].translations`.

**2026-11-26:** Resolved.

- **Swap** (`setLang`, `js/english.js`): maps the top anchor with `toEnglish` / `toOriginal`. The unscrolled round trip now compares whole anchors (row and fraction, with 0.01 slack) rather than row indices, since an English row is a whole passage and scrolling within it would otherwise go unnoticed.
- **Line tap:** opens the Line's whole passage (`passageHtml`), headed *Lines a–b*, with the first and last Lines in reading order and *Line a* for a one-Line passage. It uses the same `blockHtml` as the pane (Williams keeps his lines). Opening one closes any other, and tapping again closes it. If the English isn't loaded yet, it loads first, and a failure says so under the Line. The heading appears only here. `englishFor` is gone, and the line's English is no longer italic, matching the pane.
- **Bottom bar:** while the English is showing, it gives the first visible passage's first Line to the last visible passage's last Line (`englishLines`, using the new `visibleRows` in `js/chunks.js`).
- **`js/reader.js`** keeps the loaded blocks and form on `tab.ui` (`englishBlocks`, `englishForm`) and exports `blockHtml`.
- **Checked in Chromium** with the iPhone 13 profile, light and dark, Iliad Α and Aeneid I, with no page errors:
  - LA → EN from Il. Α.123.5 lands in the passage from 92 at 0.829 (31.5/38).
  - An unscrolled swap back returns exactly to 123.5.
  - After scrolling the English, swapping back maps 0.525 of the 130–171 passage to Line 152.05.
  - Line taps open "Lines 102–123", then "Lines 124–141" (closing the first), and a second tap closes it.
  - The bar reads "Lines 92–171" in the English.
