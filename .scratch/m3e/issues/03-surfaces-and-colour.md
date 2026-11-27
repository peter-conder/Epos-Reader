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
