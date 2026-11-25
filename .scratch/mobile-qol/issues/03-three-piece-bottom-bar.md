# Bottom bar in three pieces: Format text, the open tab, all tabs

Status: resolved

## What

The bottom bar was one translucent pill: EN on the left, the tab's name in the middle, the tab count on the right. It should follow the layout of Safari's bottom bar, without the glass: a circle, a pill and a circle.

## Done when

- Left: a solid "Aa" circle that opens the Format text sheet.
- Centre: a solid pill with the EN chip at its left end (filled while the English is showing; on a tablet it opens the side-by-side English), the tab's name and Lines, swiping between tabs, and the progress line along its top edge.
- Right: a solid circle with the open-tab count that opens the tab grid.
- The menu button is solid to match. No blur anywhere.

## Comments

**2026-11-25:** Resolved.

- `index.html`: `#bottom-bar` holds `.bb-format`, `.bb-main` (progress, EN chip, pill) and `.bb-tabs`, each a `.bb-piece`.
- `css/styles.css`: the bar itself is a transparent row that lets touches through its gaps; each piece has the surface colour, border and shadow. The EN chip has a soft fill, and while it shows, the pill's slots are padded on the right so the tab's name stays centred. `#btn-menu` lost its blur.
- `js/bottom-bar.js` opens the Format text sheet from `#btn-format`; `js/main.js` doesn't close the sheet for a tap on that button.
- Checked in Chromium at 390×844 (light and dark) and 768×1024; the Aa button opens the sheet over the bar.

**2026-11-25:** Follow-up: more contrast, in the theme's colour.

- The three pieces and the menu button are filled with `--primary-container`, with text and icons in `--on-primary-container`, matching the word card and Format text sheet. The strong `--primary` marks the EN chip when it is on, the progress line and the tab count's box.
- The left button shows the toolbar's paintbrush (`i-text`) instead of "Aa".
- Checked in Chromium at 390×844 in Amber (light and dark), Pine (dark, English showing) and Slate (light), and at 768×1024 in Lavender (dark).
