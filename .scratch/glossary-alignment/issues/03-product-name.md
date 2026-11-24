# Show the product as "Epos Reader"

Status: resolved

## What

`CONTEXT.md` says the product is always **Epos Reader**, never "Epos" on its own, because EPOS is a common acronym. The app called itself "Epos": the page `<title>`, the top-bar brand and its tooltip, and "About Epos" in the menu (`index.html`), plus the Latin brand text in `js/layout.js`.

## Done when

- Every place the app names itself says "Epos Reader".

## Comments

**2026-11-24:** Resolved. The `<title>`, brand, tooltip and "About" item say "Epos Reader". While a Greek Work is open the brand still writes *Epos* in Greek, as before, so it reads "Επος Reader". Visible "Chapter" labels were also changed to "Book" ("Open a Book", "New Book" in the bottom bar), to match the glossary. Storage keys (`epos.*`) are unchanged, so saved settings still load.

**2026-11-24 (after code review):** Checked in Chromium at 1280×800, 768×1024 and 390×844. The brand reads "Epos Reader" at every size, and the remaining screen-reader label that said "chapter" now says "Open a Book in a new tab".
