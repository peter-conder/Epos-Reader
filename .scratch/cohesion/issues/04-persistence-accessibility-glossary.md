# Phase 4: Persistence, accessibility, cleanup, and glossary alignment

Status: ready-for-agent

## What

- Persist reading font, line spacing, pane margins, all View Options switches (including rare Scansion marks), tab recency (`usedAt`), compact `tab.lang`, and `pageOnly` across launches; add debounced session saves on mutations.
- Fix `restoreSession()` mid-loop `addNewTab()` renders, Book validation/clamping, and inactive Tab Grid `restoreAt` previews.
- Disconnect scrollbar `ResizeObserver`s on tab close; fix `viewport.js` `599.99px` gap; remove dead code, stray `''` in `assets/icons.svg`, and unused imports.
- Accessibility: layered `Escape` handling, keyboard access for words/bookmarks/dialogs, hover/active states on `<= 1024px` controls for pointer devices, Copy Line toast confirmation and clean elision/punctuation joining.
- Align drifted UI copy with `CONTEXT.md` (Work, Book, Line, Word card, Split, Parallel translation, Translation, Home).

## Done when

- All preferences and reading sessions survive reload cleanly; keyboard navigation and `Escape` layering work; UI copy matches `CONTEXT.md`; verified at 390×844, 768×1024, and 1280×800.

## Comments
