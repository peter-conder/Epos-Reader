# Mobile layout plan

Agreed design for making Epos usable on phones and tablets. Settled in a design review; each section is a decision, not a proposal.

## Tiers and detection

| Tier    | Width          | Layout |
|---------|----------------|--------|
| compact | < 600px        | Mobile layout (below) |
| medium  | 600–1024px     | Mobile layout, plus the side-by-side Latin/English dual pane |
| desktop | > 1024px       | Unchanged |

- **Width decides layout.** `@media (hover: hover)` / `(pointer: coarse)` decide interactions (hover cards, tooltips, touch target size). A narrow desktop window keeps hover; a touch laptop gets bigger targets.
- Breakpoints live in `js/viewport.js` and are mirrored by the media queries in `css/styles.css`; change both together.
- Touch targets are at least 44px on coarse pointers (48px for menu rows).

## Scope

Reading first: one chapter on screen at a time, with scansion, word cards, translation and bookmarks. No split view; notes can't be dragged to reorder (already disabled for touch).

## Long lines

- **Compact:** lines wrap with a fixed hanging indent (1.25em). No shrink-to-fit: text follows the font slider, drawn at 0.8× its size (a phone is read closer than a monitor, the same idea as the existing 0.86× for two-up), and `fit.js` does not fit. Word spacing and the line-number gutter are tighter than on desktop.
- **Medium:** keeps shrink-to-fit, as on desktop.
- `js/chunks.js` must support chunks of different heights. Because the hanging indent is fixed, a wrapped line is always a whole number of rows, so a chunk's height is (rows × pitch) and can mostly be counted rather than measured. Unseen chunks are estimated from the average and corrected as they render; scroll restore and the progress bar use cumulative heights.

## Screen layout (compact and medium)

- **Floating hamburger** at top left; no top bar.
- **Bottom bar** (Safari-style, three solid pieces, no glass): an **"Aa" circle** on the left opens the Format text sheet; a **pill** in the middle holds the EN chip, the citation and line range, and a thin progress line along its top edge; a **tab-grid circle** on the right shows the number of open tabs. The hamburger is solid to match.
- **Swiping across the pill** switches between open tabs. The pages follow the finger: the open page and the neighbour's slide side by side with a small gap, flat, and finish the slide or spring back with the pill. Past the last tab the chapter list slides in the same way. With Reduce Motion the switch is instant. Swiping on the text itself does not switch tabs.
- Both the hamburger and the bottom bar **fade away** (opacity and a slight shrink) while you read a text: on scroll down, or after 3 seconds without a touch. Not over the Notebook or Home, and never while a sheet, menu, the tab grid or the note editor is open. They come back on scroll up, at either end, or on a tap outside a word.
- The bottom bar stays clear of the home indicator with `env(safe-area-inset-bottom)`.
- **Home Screen app:** a web app manifest, with iOS's own status bar. `black-translucent` was tried so the text could run behind the status bar, but iOS can't hide the status icons and the setting left a gap the height of the status bar at the bottom of the screen (a WebKit bug), so it was dropped.
- **Scrollbar:** the browser's own, thin and grey; on phones and tablets the system one fades by itself. Bookmark dots sit beside it (on phones and tablets, between the floating controls).

## Tabs

- Several tabs can be open; one is shown at a time. The Notebook is a page, not a tab (see Pages below), so it isn't in the tab grid or the swipe order; a Notebook tab saved on desktop is kept and comes back there.
- **Tab grid:** two columns, most recently used first. Each card shows the citation, last position and a Latin snippet. Close with ✕ or a sideways swipe; the "Tab closed · Undo" toast appears above the bottom bar. Leave with the grid button or "Done".
- **Ordering:** the most-recently-used order only updates when a tab is opened from the grid or picker, or when you start scrolling in it. A quick swipe to peek and back leaves the order alone, so grid order and swipe order always match.

## Opening chapters

- "+" in the tab grid, or swiping past the last tab, opens a **chapter list**, grouped by work.
- Works with no data file are hidden (decided by whether the data exists, not a hard-coded list). Currently only the Aeneid has data.
- Chapters already open carry an "Open" badge; tapping one switches to its tab instead of duplicating it.
- **Home screen (no tabs open):** the work carousel, stacked vertically. Tapping a work opens its chapter list. Works with no data are left off the stacked cards too, so a tap never leads to an empty list (desktop still shows all three).

## Menus and sheets

- The hamburger opens a **dropdown**, top to bottom:
  1. Settings (opens the full settings view)
  2. Notebook (opens or switches to the notebook tab)
  3. Format text (opens the half-height sheet)
  4. Palette (inline row of swatches)
  5. Light/dark mode switch
- **Format text sheet:** covers the bottom half of the screen, Kindle-style, so the text stays visible while you change it.
- **Word cards:** a bottom sheet. The selected line scrolls into view above it; tapping another word swaps the card's contents.
- **Writing a note:** the keyboard would cover the sheet, so while a note is written the card steps away and the editor is pinned to the top of the screen (the word, a text box that grows down to the keyboard, and ✓). ✓ saves and brings the card back; dismissing the keyboard keeps the editor; tapping the text below saves and closes both.
- **One sheet at a time.** Opening one closes the other. An open sheet covers the bottom bar. Tapping the text above a sheet closes it, except tapping a word, which swaps the word card.

## Pages

- **Settings and the Notebook are pages:** they cover the text with no hamburger, bottom bar, ribbon or dots. A **back button** (← in a circle) stands where the hamburger was and returns to the tab you were reading. Back from the Notebook goes to the most recent tab, or a New Tab if there is none.
- **Swipe from the left edge** (the first 24px) to go back, as on iOS: the page follows the finger with the view you came from sliding in, dimmed, underneath; past a third of the width or a flick goes back, otherwise it springs back. The chapter list closes the same way. With Reduce Motion the swipe still works, with no slide.

## English translation

- **Default (compact): swap toggle.** Flips the whole view between Latin and English, keeping your place.
- **Optional (setting): line-tap mode.** Tapping a line number shows that line's English. The English hides while the Format text sheet is open.
- **Medium:** the existing side-by-side dual pane.
- The EN chip sits at the left end of the bottom bar's pill: it swaps on a phone and opens the side-by-side pane on a tablet. Swapping back without scrolling the English returns to the exact Latin line, even past the end of the English.
- English exists only for Book I, lines 1–16, so far (`translations` in `js/data.js`). Where it stops, the English pane says so; a line with none says "No English for this line yet."

## Line numbers and hover-only controls

- **Tap a line number:** shows its English when line-tap mode is on; otherwise toggles the bookmark. Settings says which.
- **Long press a line:** action menu (bookmark, note, copy).
- **Corner ribbon (Kindle-style):** a ribbon tab hangs at the top right. Tap it to bookmark the first line you can read at the top of the screen; it shows only while any bookmarked line is on screen, and tapping it then removes the topmost one. With none on screen it is tucked up out of view, but its spot still takes a tap at any time while reading. Adding drops it in; removing dips it, then springs it up out of view. Out of the way under the Word card, sheets, the tab grid, the Book list and a pinned Note. Not shown while the English is swapped in.
- **Bookmark dots** run down the right edge with the controls; tapping one puts its line at the top of the screen, and a "Back to line N" chip above the bottom bar returns you (it goes after a screen of scrolling or 8 seconds).
- A bookmarked line shows its number in the primary colour (even lines that don't usually show one) and a ribbon in the margin; the desktop's margin bookmark marker is hidden below desktop.
- Tooltips are dropped on touch devices; menu items get visible text labels instead.
- The tab hover card is retired on mobile; the tab grid replaces it.

## Crossing tiers

Rotating a tablet, resizing a window, iPad multitasking:

- A split shows only its active pane; the split (and `pairPct`) comes back when the window widens.
- The side-by-side English becomes the swap toggle on compact, and comes back when the window widens.
- Open popovers, hover cards and sheets close.
- Scroll stays anchored to the top visible line: the first line below the pane's top padding, which differs by layout. For a moment after the window's width changes, the browser's own scroll adjustments (a shrinking pane's scroll being clamped, a hidden pane coming back at the top) aren't taken as the reader moving. Height-only resizes (a phone's address bar or keyboard) don't count, so scrolling is never pulled back.
- English swapped in on a phone goes back to the Latin, at the same line, on a wider screen.
- **Saved state never changes** when crossing tiers; compact is only a different view of the same tabs.

## Build order

Each phase is its own commit. All eight are done. A later quality-of-life pass (scrollbar, note editor, three-piece bar, fading, Home Screen app, sliding pages) is recorded in `.scratch/mobile-qol/`.

1. **Tier scaffold:** width tiers, `hover`/`pointer` queries, bigger touch targets.
2. **Line wrapping:** fixed hanging indent and variable-height chunks; no fitting on compact.
3. **Bottom bar:** citation, progress line, swipe between tabs, auto-hide.
4. **Tab grid and chapter list,** with the ordering rule above.
5. **Hamburger dropdown** and the Format text sheet.
6. **Word card sheet** and the one-sheet rule.
7. **English:** swap toggle, line-tap mode, line-number tap and long press.
8. **Crossing tiers.**

## Testing

Playwright screenshots at each phase:

| Size     | Represents |
|----------|------------|
| 360×780  | Small Android |
| 390×844  | iPhone 14/15 |
| 430×932  | Large iPhone |
| 768×1024 | iPad portrait |
| 1024×768 | Just below desktop |
| 1280×800 | Desktop (regression check) |

Spot checks: scroll position across a long book, the longest lines wrapping with scansion on, and rotating mid-book.

## References

- Material 3 window size classes: https://m3.material.io/foundations/layout/applying-layout/window-size-classes
- Material 3 bottom sheets: https://m3.material.io/components/bottom-sheets/overview
- MDN `hover` media feature: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover
- MDN `pointer` media feature: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer
- MDN `env()`: https://developer.mozilla.org/en-US/docs/Web/CSS/env
- Apple Human Interface Guidelines (touch targets): https://developer.apple.com/design/human-interface-guidelines/accessibility
- Apple, supported meta tags (`apple-mobile-web-app-status-bar-style`): https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html
- WebKit bugs on Home Screen apps and the status bar: https://bugs.webkit.org/show_bug.cgi?id=260508, https://bugs.webkit.org/show_bug.cgi?id=301994
- WebKit bug on the keyboard covering fixed elements: https://bugs.webkit.org/show_bug.cgi?id=191204
