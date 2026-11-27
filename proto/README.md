# Prototype: design-language skins

Throwaway code to answer one question: **what should Epos Reader's new design language be?** Each direction is a
skin, one stylesheet layered over `css/styles.css`. A skin re-sets the tokens and adds a few targeted overrides.
The real stylesheet is not edited.

## Use

Serve the repo root (for example `python3 -m http.server`) and open:

- `/?skin=codex` for **Codex**, a printed scholarly edition: paper and ink, an oxblood rubric, EB Garamond,
  hairline rules, square corners, no overshoot in motion. Dark mode is lamplight.
- `/?skin=agora` for **Agora**, a bright modern study tool: Aegean blue and terracotta, Literata + Inter,
  big soft corners, real elevation, springy motion. Dark mode is a night-sea navy.
- `/?skin=default` for the current design.

The chip in the bottom-left corner (just above the bottom bar on phones and tablets) switches live. The choice is kept in
`localStorage` (`epos.proto.skin`).

## Files

- `proto/skin-switcher.js` is loaded by one `<script>` line in `index.html`'s `<head>`. It sets `data-skin` on
  `<html>`, loads the skin's stylesheet and fonts, and draws the chip.
- `proto/skins/<name>.css` holds one skin. Every rule is scoped to `[data-skin="<name>"]`.

## Known limits (on purpose)

- While a skin is on, its colours and reading font use `!important` to outrank the inline values that the
  palette menu and the Font pill set. So those two controls do nothing under a skin.
- Only tokens and a handful of components are restyled: the Line, the Word, the Word card, the Book selector,
  tabs, the tool bar, flyouts, Notes and the Home cards. Structure and layout are unchanged.

## Adding a direction

Copy a skin to `proto/skins/<name>.css`, change the selector, and add `<name>` to `SKINS` in
`skin-switcher.js`, with its Google Fonts URL. Check that any new font has the `greek-ext` subset
(U+1F00–1FFF), or polytonic Greek falls back to another face.
