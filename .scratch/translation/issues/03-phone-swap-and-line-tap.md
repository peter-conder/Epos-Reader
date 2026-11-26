# Phone: EN/LA swap and "Show its English" with passages

Status: ready-for-agent
Blocked by: 02

## What

Move the phone views in `js/english.js` from per-Line English to blocks (see `../spec.md`, decisions 9 and 10).

## Done when

- **Swap:** LA → EN opens the block containing the top Line at the proportional point, and EN → LA maps back the same way. An unscrolled round trip still returns exactly where you were (`tab.swapBack`).
- **Line tap:** with "Show its English" chosen, tapping a Line number opens its whole block under that Line, headed *Lines a–b*. Tapping again closes it. Opening another closes the first. The heading appears only here.
- `englishFor` and the "No English for this line yet." text are gone.
- Checked in Chromium with a phone device profile (for example iPhone 13), light and dark, with no page errors.

## Comments
