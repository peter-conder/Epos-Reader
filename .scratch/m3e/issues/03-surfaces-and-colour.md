# Tonal surfaces, tertiary, segmented lists and the bottom bar colours

Status: resolved
Blocked by: 02

## What

- Add `--surface-container-{lowest,low,,high,highest}`, `--outline`, `--outline-variant` and `--on-surface-variant`, and remove the `--gray-*` scale.
- Move `#drawer`, `#flyout`, `#popups-flyout`, `#picker` and the Format sheet to `--surface-container-high` (sheets: `-low`). Keep the tool bar, `.add-split`, `#word-card` and `.note-card` on `--primary-container`.
- Add tertiary roles to `PALETTES` in `js/settings.js`, generated with `@material/material-color-utilities`, and use them for `.card-note` / `.card-bookmark` when active, `.note-card` and the Bookmark ribbon.
- Bottom bar: the middle pill on `--surface-container-high`, the flanking circles Vibrant, a 4px progress line with rounded ends.
- Segmented lists for `.src-list`, `#drawer`, the work picker and the chapter list.

## Needs info

A swatch sheet of the generated tertiary colours (6 palettes, light and dark) for approval before this starts.

## Feel checklist

- Open the drawer, Settings and the work picker in Amber and Coral: no borders look cool-grey.
- The bottom bar's flanking circles stand out from the pill.
- Notes and Bookmarks read as their own colour, while noted Words in the text show only the icon.

**2026-11-27:** Palettes regenerated, replacing the tertiary-only sheet approved earlier. Decisions from the grilling session:
- Every palette is regenerated with `@material/material-color-utilities` 0.4.0, as `SchemeVibrant` on the 2025 colour spec. The user first asked for Fidelity; the library only supports Fidelity on the 2021 spec (see `maybeFallbackSpecVersion` in its `dynamiccolor/dynamic_scheme.js`), so they chose between that and Vibrant from two sheets.
- Seeds: today's light primaries, except Coral, which takes a warmer seed (`#E2654C`, hue 30°).
- The palettes carry the tinted neutral roles (surface containers, outline, outline-variant, on-surface-variant). The page uses the generated surface in both modes.
- They are now in `PALETTES`. `applyPalette` sets the tertiary and neutral variables, which no CSS uses yet. `bg`/`onbg` aren't mapped yet.

Open (asked as Q21): in the app, Vibrant makes the Scansion tints and the light page loud, against the spec's "M3E chrome, calm text". Proposed: keep Vibrant on the chrome, and give the reading text calmer neutral roles in this ticket. Also, Limoncello's tertiary is only 14° from its secondary.

**2026-11-27:** Decided (Q21a): Vibrant stays on the chrome; the reading text takes a calm set of its own. Limoncello's tertiary, 14° from its secondary, was moved by hand to the opposite hue (292°, as Fidelity picks) at Vibrant's tones.

**2026-11-27:** Resolved.

- `js/settings.js`: each palette mode carries the Vibrant roles (primary, secondary and tertiary families; `bg` page, `onbg`, `onv`, `ol`, `olv`, `c0`–`c4`) plus a calm reading set from SchemeTonalSpot (2025) on the same seed: `rbg` pane, `ron` text, `rhl` long-syllable highlight and Word hover, `rmk` Scansion marks, `rsel`/`ronsel` selected Word. `applyPalette` sets them all as CSS variables.
- `css/styles.css` tokens: `--gray-*` and `--mix-base` are gone. New: tertiary, `--page`, `--on-surface(-variant)`, `--outline(-variant)`, the five surface containers, `--read-*`, and `--segment` (a segmented-list row: lowest container in light, highest in dark). `--bg` is the page, `--surface` the reading pane, `--soft` the highest container. Slate's values are the defaults for both modes.
- Every `--gray-*` use is mapped: borders to `--outline-variant` (stronger ones to `--outline`), hover fills to the containers, muted text to `--on-surface-variant` (`--read-mk` inside the text).
- Menus (`.popover`, drawer, flyouts, picker, line menu, palette submenu) on `--surface-container-high` with `--on-surface` text; the Format sheet, tabs, chapter rows and Sources on `--surface-container-low`. The Format sheet's gap-fill shadow follows its new colour. The tool bar, `.add-split`, the word card and the bottom bar's circles stay on `--primary-container`.
- Tertiary: `.card-note`/`.card-bookmark` when active, `.note-card` (it moved off `--primary-container`, which this ticket's What still listed; decision 5 in the spec wins), the Bookmark ribbon, the Line's Bookmark glyph, the Bookmarked Line's number and bar, and the Bookmark dots on the pane edge. Noted Words stay icon-only, in `--read-sel`.
- Reading text: Word hover, the selected Word, its note icon, Scansion highlight and marks, the foot line, the caesura, a flashed or pressed Line, and the pane's text colour all use `--read-*`.
- Bottom bar: the middle pill on `--surface-container-high` with `--on-surface`/`--on-surface-variant` text; the circles stay Vibrant; the progress line is 4px with rounded ends (the track rounds the ends; the fill still grows by `scaleX`).
- Segmented lists (2px apart, 4px inner corners, 20px outer): the drawer (first and last rows by layout), `#work-list`, `.src-list` and `.cl-rows`, the last three clipping their outer corners. `.cl-row.is-open` became an inset outline.
- Contrast. Under Vibrant dark, primary is the same tone as primary-container (1.1–1.5:1), so nothing on a primary container may be drawn in primary: the selected tool button is now `--on-primary-container` on `--primary-container` inverted, inactive Book pills moved to `--secondary-container`, and the word card's Scansion line, its note icon, the tab count and the EN circle use `--on-primary-container`. A scripted audit of every visible text run (6 palettes × light/dark × desktop/phone: Home, Book list, reading, word card, Text options or Format sheet, drawer) finds nothing under WCAG AA except the Home card titles, white on darkened paintings, which the script can't see behind (checked by eye).
- Not done here: the Home cards' flat fallback colour (`--primary`, shown only before a painting loads) is light in dark mode under white titles.
