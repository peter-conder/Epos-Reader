# Corner ribbon, dots and "Back to" on phones and tablets

Status: resolved

## What

See `../spec.md`. Phones and tablets could already bookmark a Line (line-number tap, long press, word card), but there was no obvious way to bookmark your place or see where your Bookmarks are.

## Done when

- The ribbon bookmarks the top Line, shows filled while a Bookmark is on screen, and a tap on it removes the topmost one.
- The dots strip shows every Bookmark in the Book and jumps to it, with a "Back to line N" chip.
- Nothing changes on desktop, in the English swap view, or on the Notebook and Home.

## Comments

**2026-11-25:** Resolved.

- New `js/mobile-bookmarks.js`: `syncRibbon` (called from the bottom bar's render and refresh, which run on scroll, layout and tab changes, and from `bookmarksChanged`), the ribbon tap, `jumpFromDot` and the back chip.
- `js/chunks.js`: `readableRange` gives the first and last Lines between the top padding and the bottom bar.
- `js/scrollbar.js`: the strip now also shows below desktop, its track running from below the menu button to above the bottom bar. `js/reader.js` sends a dot tap to `jumpFromDot` there.
- `index.html` / `css/styles.css`: `#bm-ribbon` and `#back-chip`; the strip fades with `.chrome-hidden`; dots get 44px targets.
- Checked in Chromium at 390×844 (Amber dark, light) and 768×1024 (Pine light): the ribbon is filled at the top of Book I (Line 3 is Bookmarked); at Lines 42–53 a tap bookmarked Line 43 and a second tap removed it; a dot jumped to Line 300 at the top with "Back to line 43", which returned to Lines 42–53; the chip went after scrolling a screen; the ribbon hides while the English is swapped in. No page errors at 1280×800.
