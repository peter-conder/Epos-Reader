# Greek Book numbering for the Iliad and Odyssey

Status: needs-triage

## What

`CONTEXT.md` says each Work's Books are numbered by that Work's own tradition: Roman numerals for the Aeneid (I–XII), Greek capitals for the Iliad (Α–Ω), Greek lower case for the Odyssey (α–ω). A **Citation** reads e.g. *Iliad Α.1–25*, shortened to *Il.* / *Od.* / *Aen.* where space is short.

The code numbers every Work with Roman numerals:

- `js/data.js`: `ROMANS` (I–XXIV) is the only numbering.
- `js/book-data.js`: `loadBook` turns the Roman numeral back into the file number (`01.json`…), so the display numbering and the file numbering are tied together.
- `js/state.js:44`: `tabRef` builds the tab label from `tab.book`.

## Done when

- The Iliad and Odyssey show Greek Book numbers everywhere a Book is named (tab labels, bottom bar, chapter list, Home, word cards, Notes, Bookmarks).
- Data files keep their plain numbers (`01.json` … `24.json`); only what's displayed changes.
- Tab labels and the bottom bar use the short Work abbreviations; fuller views use the full name.
- Saved Notes, Bookmarks and tabs from before the change still load.

Blocked until the Greek data is committed.

## Comments
