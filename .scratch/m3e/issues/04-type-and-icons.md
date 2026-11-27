# Add the missing Roboto weights, drop uppercase headers, replace Lucide icons

Status: resolved
Blocked by: 03

## What

- Load Roboto 600 and 800 alongside 400, 500 and 700 in `index.html`.
- The 7 uppercase headers (`.flyout-header`, `.panel-title`, `.settings-section-title`, `.nb-divider`, `.lm-title`, and the two mobile ones) become sentence case, 14px, weight 700, letter-spacing 0.1px, in `--primary`. Check that the source text reads well in sentence case.
- Replace the stroked Lucide symbols in `assets/icons.svg` with Material Symbols Rounded. Active icons show the filled variant.

## Done when

- No `text-transform: uppercase` is left.
- Loading the app doesn't refit the Book a second time.

## Comments

**2026-11-27:** Resolved.

- Fonts: `index.html` loads Roboto 400, 500, 600, 700, 800 and 400 italic. 600 and 800 only appear in a few places (menu labels, the English pane's line headers, a Bookmarked Line's number on phones), so `initFit` preloads both on startup, and its `loadingdone` handler refits only when a face the Lines are set in arrives (Gentium Plus or Roboto at 400/700). Checked in Chromium: a cold start loads every face on Home in one batch, and opening a Book fires no `loadingdone`. Reloading straight into a Book: one extra event, Roboto 800 alone, which no longer refits.
- Headers: no `text-transform` is left. `.flyout-header`, `.panel-title`, `.settings-section-title`, `.nb-divider`, `.lm-title` and `.cl-work-title` are 14px, weight 700, letter-spacing 0.1px, in `--primary`; `.cl-badge` ("Open") also lost its uppercase. Text now in sentence case: "View options", "Text appearance", "Tapping a Line number" and "Switch this tab's Work" (in `index.html` and `js/sidebar.js`; "Switch Tab Work" read oddly). CONTEXT.md terms keep their capitals. Every header sits on a surface container, where primary passes in every palette (5:1 or better).
- Icons: the 13 stroked Lucide symbols in `assets/icons.svg` are now Material Symbols Rounded (`@material-symbols/svg-400` 0.49.0, Apache-2.0), named in a comment in each symbol: check, close, dark_mode, light_mode, info, chevron_right/left, swap_horiz (Switch Work), note_stack (Notebook), edit (Note), delete, bookmark, arrow_outward (jump). The custom glyphs (text size A, line spacing, margins, the Scansion mark) and the icons that were already Material are unchanged.
- Filled when active: a symbol whose Material filled form differs carries both shapes, picked by `--icon-o`/`--icon-f`. Custom properties reach into the `<use>` copy, so `:is(.active, [aria-pressed="true"], [aria-expanded="true"], .has-note) > .icon` switches to the filled shape. Checked: the Word card's Note button goes filled when open, and the theme button's sun is filled in dark mode.
- The Bookmark masks (`--bookmark-*-icon`) come from the same set: bookmark, its filled form, and bookmark_add split into the opened outline and the "+" (its scale origin moved to the plus's centre, 76% 24%).
- Not changed: Title Case labels that aren't uppercase headers ("Format Text", "Line Spacing", "Pane Margins", "Open a Book", "Settings & Sources").
