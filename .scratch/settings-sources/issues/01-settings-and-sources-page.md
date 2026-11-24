# Make the Settings page useful, and credit every Source there

Status: resolved

## What

The Settings page ("Reading & Work Options") mostly duplicated other controls. Its "Active Epic" chips switched the open tab to Book I of another Work, and its "Color Palette" chips repeated the palette menu. Nowhere in the app were the Sources credited, and "About Epos Reader" in the desktop menu did nothing (`js/toolbar.js`). The site had no favicon.

## Done when

- The Work and Color Palette sections are gone from the page. Palettes stay in the menu.
- The page lists every Source by language (what it supplies, a link and its licence), the licence notes, and Credits for the Home paintings, the fonts and the hand-written Homer glosses.
- "About Epos Reader" opens the page at the Sources.
- The site has a favicon (the book from the brand) and a home-screen icon.
- The README's "Sources and credits" matches the page.

## Comments

**2026-11-24:** Resolved.

- The page is now **Settings & Sources** (`index.html`), and the menu item says "Settings & Sources". It keeps "Tapping a Line Number", then lists Sources (Latin, Greek, English), the licence notes, and Credits.
- The lists live in `SOURCES`, `LICENCE_NOTES` and `CREDITS` in `js/data.js`, and `js/settings.js` draws them. The README table is a hand-kept copy.
- Removed `syncSettingsChips`, the Work chips, the palette chips and their styles (`js/settings.js`, `js/layout.js`, `js/dom.js`, `css/styles.css`).
- "About Epos Reader" opens the page scrolled to Sources.
- Paintings, identified from the JPEG comment in `aeneas.jpg` and by search for the other two: van Loo, *Aeneas Carrying Anchises* (Louvre); Ivanov, *Priam Begging Achilles for the Return of Hector's Body* (collection not verified, so not named); Turner, *Ulysses deriding Polyphemus* (National Gallery, NG508).
- The English Translation has no known Source yet, so it is listed as "Credit to be added" and tracked on GitHub: peter-conder/Epos-Reader#5.
- Added `assets/favicon.svg` (the `i-logo` book, dark in a light browser and light in a dark one) and `assets/apple-touch-icon.png` (180×180, white book on Slate).
- Checked in Chromium at 1280×800, 768×1024 and 390×844, in light and dark mode: no page errors, no sideways scroll, and both icons served.
