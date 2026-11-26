# Phase 5: Cleanup, scope review, and design calls

Status: ready-for-agent

Follow-up to the two-axis review (Standards and Spec) of Phases 1–4. Bugs, Spec gaps and hard Standards violations were fixed on the phase branches. This phase covers the decisions taken after that review, one by one with the user.

## What

### Design calls
- **Easing:** Note card reflow and drop, and tab drop, use Emphasized deceleration (`--ease-emphasized` / `EMPHASIZED`), with no overshoot, as the spec asks for structural movement. The popover item stagger keeps the subtle spring, because popover items are small controls.
- **Keyboard access to words:** use a roving tabindex, so each pane is one Tab stop.
  - Tab enters on the selected word, or otherwise the first visible word. Tab again leaves the text.
  - ← / → go to the previous or next word, carrying on across Line ends.
  - ↑ / ↓ go to the word in the same position on the Line above or below, or that Line's last word if it is shorter.
  - Home / End go to the first or last word of the Line.
  - Enter / Space open the Word card. Escape closes it and returns focus to the word.
  - The pane scrolls so the focused word stays in view.
  - In a Split or with Parallel translation, each pane is its own Tab stop.

### Scope review: keep
- `jumpToLine()` lands the Line through `scrollToLine()`, with no extra centring.
- The compact bottom-bar pill keeps 12px right padding when EN is shown.
- The loader keeps its 90ms delay and 220ms minimum.
- The Home card `aria-label` stays "Title — poet".
- Also kept: the cached drag position for Note cards, the Roboto italic axis, the Word card transform-origin flip, `snap.autoId` on mobile Undo, and `setBook()` resetting the Translation pane's scroll.

### Scope review: change
- Remove the Notebook count label from the bottom-bar subtitle, the sidebar hover card and the Tab Grid card, showing only "Notebook". The Notebook page header keeps its count.

### Smells: cheap
- One `fetchJson()` and `bookKey()` in `js/book-data.js`.
- JS reads easing and durations from the CSS tokens instead of copying them.
- Every reduced-motion check goes through `prefersReducedMotion()`.
- Remove the dead aliases `SPRING`, `--ease-bouncy` and `--ease-spring`.
- One table drives the View Options switches in `js/toolbar.js`.
- `js/viewport.js` takes the 1024px query from `TIER_QUERIES`.
- `js/main.js` uses the `$` helper.

### Smells: medium
- One close-with-timer helper for the Chapter list, Tab Grid and Format Text sheet.
- A `readingText()` guard for `state.view === 'reader' && isText(tab)`.
- A tier-aware `activePartner()`, so "ignore desktop Splits below desktop" lives in one place.
- A language code on each Work in `js/data.js`.
- Named z-index values in `js/pages.js`.

### Not in this phase
These are the big refactors, left out by decision:
- a central session save
- an Escape layer stack
- removing the palette copy from the inline script in `index.html`
- decoupling `book-data.js` from tab state

## Done when

- Everything above is in place.
- `node --check` passes on every module.
- Screenshots are taken in headless Chromium at 390×844, 768×1024 and 1280×800 and sent to the user. They cover:
  - the reader with Scansion
  - Rare Scansion marks
  - the Word card
  - Parallel translation on tablet
  - the Format Text sheet in light and dark mode
  - the Tab Grid
  - the Notebook
  - the error state for a failed Book load
  - keyboard focus on a word

## Comments
