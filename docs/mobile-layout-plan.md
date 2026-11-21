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
- **Bottom bar** (Safari-style): citation and line range, with a thin progress line along its top edge. A **tab-grid button** sits to its right. **Swiping across the bar** switches between open tabs.
- Both the hamburger and the bottom bar **hide on scroll down** and come back on scroll up or a tap on the text.
- The bottom bar stays clear of the home indicator with `env(safe-area-inset-bottom)`.

## Tabs

- Several tabs can be open; one is shown at a time. The notebook is its own tab.
- **Tab grid:** two columns, most recently used first. Each card shows the citation, last position and a Latin snippet. Close with ✕ or a sideways swipe; the "Tab closed · Undo" toast appears above the bottom bar. Leave with the grid button or "Done".
- **Ordering:** the most-recently-used order only updates when a tab is opened from the grid or picker, or when you start scrolling in it. A quick swipe to peek and back leaves the order alone, so grid order and swipe order always match.

## Opening chapters

- "+" in the tab grid, or swiping past the last tab, opens a **chapter list**, grouped by work.
- Works with no data file are hidden (decided by whether the data exists, not a hard-coded list). Currently only the Aeneid has data.
- Chapters already open carry an "Open" badge; tapping one switches to its tab instead of duplicating it.
- **Home screen (no tabs open):** the work carousel, stacked vertically. Tapping a work opens its chapter list.

## Menus and sheets

- The hamburger opens a **dropdown**, top to bottom:
  1. Settings (opens the full settings view)
  2. Notebook (opens or switches to the notebook tab)
  3. Format text (opens the half-height sheet)
  4. Palette (inline row of swatches)
  5. Light/dark mode switch
- **Format text sheet:** covers the bottom half of the screen, Kindle-style, so the text stays visible while you change it.
- **Word cards:** a bottom sheet. The selected line scrolls into view above it; tapping another word swaps the card's contents.
- **One sheet at a time.** Opening one closes the other. An open sheet covers the bottom bar. Tapping the text above a sheet closes it, except tapping a word, which swaps the word card.

## English translation

- **Default (compact): swap toggle.** Flips the whole view between Latin and English, keeping your place.
- **Optional (setting): line-tap mode.** Tapping a line number shows that line's English. The English hides while the Format text sheet is open.
- **Medium:** the existing side-by-side dual pane.

## Line numbers and hover-only controls

- **Tap a line number:** shows its English when line-tap mode is on; otherwise toggles the bookmark. Settings says which.
- **Long press a line:** action menu (bookmark, note, copy).
- Tooltips are dropped on touch devices; menu items get visible text labels instead.
- The tab hover card is retired on mobile; the tab grid replaces it.

## Crossing tiers

Rotating a tablet, resizing a window, iPad multitasking:

- A split shows only its active pane; the split (and `pairPct`) comes back when the window widens.
- The side-by-side English becomes the swap toggle on compact, and comes back when the window widens.
- Open popovers, hover cards and sheets close.
- Scroll stays anchored to the top visible line.
- **Saved state never changes** when crossing tiers; compact is only a different view of the same tabs.

## Build order

Each phase is its own commit.

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
