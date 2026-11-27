# Tonal surfaces, tertiary, segmented lists and the bottom bar colours

Status: needs-info
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
