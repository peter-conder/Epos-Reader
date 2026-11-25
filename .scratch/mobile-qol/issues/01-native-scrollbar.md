# Use the browser's scrollbar; keep Bookmark dots on desktop

Status: resolved

## What

The panes hid the browser's scrollbar and drew their own: a primary-coloured pill that squished at either end and, near a Bookmark, hid itself while the Bookmark's dot morphed into a circle. It behaved oddly in places, and on a phone it sat over the end of long lines.

## Done when

- Every pane (original, translation, Notebook) scrolls with the browser's own scrollbar.
- On desktop, the original text has a dot per Bookmark in the Book on a strip just left of its scrollbar; clicking one jumps to that Line.
- Below desktop there are no dots.

## Comments

**2026-11-25:** Resolved.

- `js/scrollbar.js` no longer draws a thumb. `attachMarkStrip` lays a 14px strip over the original pane's right padding, against `clientWidth` (so it sits beside the scrollbar whatever its width), and `stripY` places a point in scroll space on it.
- `js/bookmarks.js`: the dot morph (pill, random shape, circle) and `updateRailNear` are gone; `renderRail` draws plain dots at each Line's centre.
- `css/styles.css`: panes use `scrollbar-width: thin` in `--gray-400` on a clear track; the strip is hidden at 1024px and below.
- Checked in Chromium with scrollbars shown at 1280×800, light and dark, scrolled to Line 226 with Bookmarks at Lines 3, 300 and 600. No page errors.
