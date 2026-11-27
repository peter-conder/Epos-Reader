# Move motion onto the M3E springs and add shape morphing

Status: resolved
Blocked by: 01

## What

Every transition and animation uses an M3E token: spatial properties take the spatial spring for the element's size, colour and opacity take the effects curve. Delete `--ease-spring`, `--ease-bouncy`, `--ease-springy`, `--chrome-ease` and the hardcoded curves. Splits use a no-overshoot pane curve (decided below).

Round buttons (`.tool-btn`, `.icon-button`, `.bb-format`, `.bb-tabs`, `.bb-lang`, `.btn-new-note`) rest at explicit half-height radii, morph to 12px while pressed and to 14px while selected, in place of `scale()` on press. `.pill-opt:not(.active):active` and `.add-half:active` widen (flex-grow) and their neighbours narrow.

A global `prefers-reduced-motion: reduce` rule swaps spatial springs for effects curves.

## Done when

- No `cubic-bezier` or `ease` keyword is left outside the token definitions.
- Pressing a selected pill doesn't shrink it.

## Feel checklist

- Press and hold Aa on a phone: the corners square off, then spring back with a small overshoot on release.
- Toggle Scansion in the desktop tool bar: the button settles into a rounded square.
- Open and close a Split: the panes land without bouncing.
- Open the Format sheet and the word card on a phone: they settle with a slight spring.
- Turn on Reduce Motion: nothing overshoots.

## Comments

**2026-11-27:** Open question before starting. M3's Standard default spatial curve, `cubic-bezier(0.27, 1.06, 0.18, 1)`, still overshoots slightly (about 6% on the curve; the spring behind it has damping 0.9). The review decided that Splits must not overshoot. Either accept that small overshoot, or keep Splits on a no-overshoot curve such as `--m3e-slow-effects` or today's `cubic-bezier(0.2, 0, 0, 1)` under a token name.

**2026-11-27:** Decided: (b). Splits keep today's no-overshoot curve under a token name, `--motion-pane`. `--m3-standard-default-spatial` is removed.

**2026-11-27:** Resolved.

- `css/styles.css` tokens: shorthands `--sp-{fast,default,slow}` and `--fx-{fast,default,slow}` (duration and curve together). `--motion-pane`, `--motion-pane-trailing` and `--motion-pane-dur` for edges that never overshoot. `--motion-accelerate` for things falling away (the closing-pane ghost, the Bookmark ribbon's drop), since M3E has no accelerating curve. `--ease-spring`, `--ease-bouncy`, `--ease-springy` and `--chrome-ease` are gone.
- Every transition and animation was moved by hand (111 declarations): colour, opacity and shadow take an effects curve; movement, size and corners take a spatial spring. Exceptions that never overshoot, on purpose: the reading pane's padding and width (they reflow the text), the Book selector pills' width and margin (see the comment there), the slider following the pointer, the tool bar closing, and the full-page chapter list.
- Durations JS waits on are unchanged: page and bar swipe settles (280/300ms), the line flash (1200ms, cleared at 1300), the tab-drag clone (240ms, removed at 260), the translation snap (320ms, cleared at 350). The word card's `visibility` delay follows `--m3e-default-spatial-dur`.
- Bottom sheets that now spring up (Format sheet, word card on a phone) carry a 24px strip of their own colour below them as a second `box-shadow`, so the overshoot (2px measured on the word card) never opens a gap.
- Shape morphs: round buttons rest at explicit half-height radii. Pressed: 12px (`--shape-corner-medium`), or 8px on the 34px word-card buttons. Selected: 16px (`--shape-corner-large`), or 12px on the word-card buttons. This differs from the source comparison's 14px, which isn't an M3E token. Covers `.icon-button` (incl. `#btn-menu` at 48px), `.tool-toggle`, `.tool-btn`, `.card-note`, `.card-bookmark`, `.btn-new-note`, the bottom-bar circles and `.bb-lang`. `.pill-opt:not(.active):active` and `.add-half:active` widen to `flex-grow: 1.15` instead of shrinking.
- Reduce Motion: a global rule points the three spatial springs at their effects curves. JS picks this up too, since `motionToken()` reads the computed values.
- JS: `motion.js` drops `SPRING`, `EMPHASIZED`, `TRAILING` and `PANE_DUR`. `playPop` is now a two-keyframe spring and fade. `panes.js` drops the hand-keyed wobble for the slow spatial spring. `note-drag.js`, `tab-drag.js`, `tab-grid.js`, `pages.js` and `bottom-bar.js` use the tokens.
- Checked in Chromium, with no page errors at either size:
  - Desktop 1280×800: the tool button goes 24px → 12px pressed → 16px selected. A Split opens and closes through `beginSplitOpen`/`beginSplitClose`, pixel-identical to `HEAD` once settled.
  - Phone 390×844: `#btn-format` goes 28px → 12px pressed, and the Format sheet opens. Sampled while rising, the word card's bottom edge went 998 → 842 → 844.
  - The static grid (3 sizes × Slate/Amber × light/dark) matches `HEAD` apart from image-scaling noise in the Home carousel.
- Not touched: `js/loader.js` still has its own JS curves (`MORPH_EASE`, `SPIN_EASE`). Left for ticket 05.
- Review fixes (after the pass):
  - `motionToken` no longer reports a NaN duration. `motion-pane-trailing` and `motion-accelerate` have no `-dur` of their own, so they give `{ easing }` only. The tokens are read again when Reduce Motion changes.
  - Pane widths (`.tab-view` flex-grow, and `drag-live`) now move on `--motion-pane` / `--motion-pane-dur`, not the overshooting `--m3e-slow-spatial`. Before, only the scripted Split open and close were overshoot-free (decision 2). The never-set `--grow-dur` is gone.
  - Reduce Motion now covers the overshoots written into keyframes. `bookPop` and `bookShove` are emptied, `popBounce` loses its 1.05 swell, and `shrinkAway` skips its 1.045 swell. Checked in Chromium at 390×844: sampled mid-animation, popBounce is 0.955 with no overshoot, and bookPop is `none`.
