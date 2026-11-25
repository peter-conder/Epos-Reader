# Slide the pages when swiping between tabs

Status: resolved

## What

Swiping the bottom bar's pill slid the tab names, but the page underneath jumped straight from one tab to the next once you let go.

## Done when

- While the pill is dragged, the open tab's page and the neighbouring tab's page move with the finger, side by side with a small gap, flat (no scaling or shadow), the same share of the screen as the pill's labels move of the pill.
- Past the threshold or a flick, both finish the slide and the tab opens; otherwise both spring back. At the first tab the page gives a little.
- Past the last tab, the chapter list slides in from the right the same way.
- With Reduce Motion, only the pill moves and the switch is instant.
- Swiping on the text itself doesn't switch tabs.

## Comments

**2026-11-25:** Resolved.

- `js/bottom-bar.js`: once a drag on the pill turns out to be sideways, `startPeek` shows both neighbours' pages (laid over the panes with `.peeking`, rendering a Book that hasn't been opened yet) and moves all three by `translateX`. On release they settle in 300ms with the pill; `end` puts every page back for the layout (with the panes' own springy transition switched off for that moment) before the tab is activated. A page that slides in doesn't also play the pop-in.
- `js/chapters.js`: `peekChapterList` / `endPeekChapterList` show and fill the list under the bottom bar for a swipe; `openChapterList` keeps a peeked list as it is.
- `css/styles.css`: `.tab-view.peeking` and `.chapter-list.peek`.
- Checked in Chromium at 390×844: mid-drag both pages show; release switches Aen. I → Aen. II; a short drag springs back with one page left; past the last tab the chapter list slides in and opens; swiping back returns to Aen. I at Lines 20–31, where it was.
