# Move motion onto the M3E springs and add shape morphing

Status: needs-info
Blocked by: 01

## What

Every transition and animation uses an M3E token: spatial properties take the spatial spring for the element's size, colour and opacity take the effects curve. Delete `--ease-spring`, `--ease-bouncy`, `--ease-springy`, `--chrome-ease` and the hardcoded curves. Splits use `--m3-standard-default-spatial`, unless decided otherwise below.

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
