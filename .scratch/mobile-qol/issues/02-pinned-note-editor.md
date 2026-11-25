# Write notes above the keyboard on a phone

Status: resolved

## What

On a phone the note editor opened inside the word card, which is pinned to the bottom of the screen. iOS doesn't shrink the page when the keyboard opens, so the keyboard covered the editor and you couldn't see what you were writing.

## Done when

- While a note is written (phones and tablets), the card steps away and the editor is pinned to the top of the screen: the word, the text box and a ✓.
- The text box grows with the note, down to the keyboard's top edge.
- ✓ saves and brings the full card back; an emptied note is deleted.
- Dismissing the keyboard leaves the editor up.
- Tapping the text below saves and closes the editor and the card (tapping another word swaps the card, as before).
- Desktop and Notebook notes are unchanged.

## Comments

**2026-11-25:** Resolved.

- `js/word-card.js`: `pinNote` / `unpinNote` move the note box to the top of the page with `.pinned` and set `.note-pinned` on the root; `fitPinnedNote` follows `visualViewport` (its `offsetTop` and `height`, on `resize` and `scroll`) to keep the editor in view and size the text box short of the keyboard; `revealBelowNote` scrolls the noted Line out from under the editor where the pane has room. `closeNote` unpins.
- `index.html`: the note box has a head row with a ✓ (`#note-done`), shown only when pinned.
- `css/styles.css`: `.note-box.pinned` sits under the safe area, 16px text so iOS doesn't zoom; `.note-pinned` steps the card down and the menu button aside. The old `.note-box.in-sheet` rule is gone.
- Checked in Chromium at 390×844, light and dark: a long note grows the box; ✓ saved the note and brought the card back with it. The real iOS keyboard can't be simulated here, so the keyboard edge needs checking on an iPhone.
