# Phase 4: Persistence, accessibility, cleanup, and glossary alignment

Status: resolved

## What

- Persist reading font, line spacing, pane margins, all View Options switches (including rare Scansion marks), tab recency (`usedAt`), compact `tab.lang`, and `pageOnly` across launches; add debounced session saves on mutations.
- Fix `restoreSession()` mid-loop `addNewTab()` renders, Book validation/clamping, and inactive Tab Grid `restoreAt` previews.
- Disconnect scrollbar `ResizeObserver`s on tab close; fix `viewport.js` `599.99px` gap; remove dead code, stray `''` in `assets/icons.svg`, and unused imports.
- Accessibility: layered `Escape` handling, keyboard access for words/bookmarks/dialogs, hover/active states on `<= 1024px` controls for pointer devices, Copy Line toast confirmation and clean elision/punctuation joining.
- Align drifted UI copy with `CONTEXT.md` (Work, Book, Line, Word card, Split, Parallel translation, Translation, Home).

## Done when

- All preferences and reading sessions survive reload cleanly; keyboard navigation and `Escape` layering work; UI copy matches `CONTEXT.md`; verified at 390×844, 768×1024, and 1280×800.

## Comments

- 2026-11-26: Implemented versioned preferences persistence (`epos.prefs.v1`), full debounced session persistence (`usedAt`, `lang`, `pageOnly`, validated Book, clamped ratios/font size, clean `createNewTab()`), Tab Grid `restoreAt` fix, `markStrip` observer cleanup, `viewport.js` subpixel gap fix, `assets/icons.svg` XML fix, layered `Escape` handling with focus restoration, keyboard access for words/bookmarks/notes, pointer hover/active polish on `<= 1024px`, Copy Line toast confirmation, and `CONTEXT.md` glossary alignment. Verified via `node --check js/*.js`, XML parse of `assets/icons.svg`, and headless Chromium at `1280×800`, `768×1024`, and `390×844`.
