# Add the M3E motion and shape tokens

Status: resolved

## What

Define the M3E motion springs, the Standard no-overshoot curve and the M3E corner scale as CSS custom properties, and the same values in `js/motion.js`. Nothing uses them yet, so nothing on screen changes.

## Done when

- `:root` has `--m3e-{fast,default,slow}-{spatial,effects}` (an easing and a duration each), `--m3-standard-default-spatial`, and `--shape-corner-*` for 0, 4, 8, 12, 16, 20, 28, 32, 48 and full.
- `js/motion.js` exports the same curves from one place.
- Screenshots before and after are identical.

## Comments

**2026-11-27:** Resolved.

- `css/styles.css` `:root`: `--shape-corner-*` (none through full), `--m3e-{fast,default,slow}-{spatial,effects}` with a matching `-dur` each, and `--m3-standard-default-spatial` (+ `-dur`). Nothing uses them yet.
- `js/motion.js`: `motionToken(name)` returns `{ easing, duration }` read from those custom properties on first use, so the CSS is the one source.
- Checked in Chromium (Reduce Motion on) at 390×844, 768×1024 and 1280×800, in Slate and Amber, light and dark: the few differing pixels match the run-to-run noise of `HEAD` against itself (Home carousel images). `motionToken('m3e-fast-spatial')` returns `cubic-bezier(0.42, 1.67, 0.21, 0.9)`, 350ms. No page errors.
