# Greek Book numbering for the Iliad and Odyssey

Status: resolved

## What

`CONTEXT.md` says each Work's Books are numbered by that Work's own tradition: Roman numerals for the Aeneid (I–XII), Greek capitals for the Iliad (Α–Ω), Greek lower case for the Odyssey (α–ω). A **Citation** reads e.g. *Iliad Α.1–25*, shortened to *Il.* / *Od.* / *Aen.* where space is short.

The code numbers every Work with Roman numerals:

- `js/data.js`: `ROMANS` (I–XXIV) is the only numbering.
- `js/book-data.js`: `loadBook` turns the Roman numeral back into the file number (`01.json`…), so the display numbering and the file numbering are tied together.
- `js/state.js:44`: `tabRef` builds the tab label from `tab.book`.

## Done when

- The Iliad and Odyssey show Greek Book numbers everywhere a Book is named (tab labels, bottom bar, Book list, Home, word cards, Notes, Bookmarks).
- Data files keep their plain numbers (`01.json` … `24.json`); only what's displayed changes.
- Tab labels and the bottom bar use the short Work abbreviations; fuller views use the full name.
- Saved Notes, Bookmarks and tabs from before the change still load.


## Comments

**2026-11-24:** Resolved. Tabs, Notes and Bookmarks still store the Book as a Roman numeral and data files keep their plain numbers, so saved state is unaffected. Only what's displayed changed:

- `js/data.js`: each Work has an `abbr` and a `numerals` style, plus `bookLabel()`, `workName()` and `citation()` helpers.
- The display sites now use `bookLabel()`: tab pills (`Aen. I.1–25`), bottom bar (`Aen. II`), toolbar segments, Book titles, the Book list, the Book picker, the hover card, the tab grid, and the source line on Notes and Bookmarks.
- Checked in Chromium at 1280×800 and 390×844 with no page errors: the Aeneid shows I, II, III…, and the Iliad shows Α, Β, Γ… with "Book Α". The Greek data isn't here yet, so the Iliad was checked with the sample lines in `js/data.js`.

**2026-11-24 (after code review):** Follow-up fixes:

- Home's screen-reader labels now name the first Book in each Work's numbering ("open Book Α").
- The "*Work* · Book *n*" label comes from one `bookTitle()` helper, so every view says "Iliad · Book Α".
- Each Work stores its numeral list directly (`numerals: GREEK_UPPER`) rather than a style name.
- Line ranges use an en dash ("I.1–25"), as in `CONTEXT.md`.

Checked in Chromium at 1280×800, 768×1024 and 390×844, with no page errors. Desktop shows `Il. Α.1–16` and `Α Β Γ`. On tablet and phone, the Iliad stays hidden until its data file exists.
