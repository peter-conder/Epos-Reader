# M3E switch, slider and loader

Status: resolved
Blocked by: 04

## What

- `.switch`: 52×32 with a 2px `--outline` border when off. The thumb is 16px off, 24px on (`--on-primary` on a `--primary` track) and 28px while pressed, using `--m3e-fast-spatial`.
- `.m3-slider`: while dragging, the handle narrows by width and gap (no `scale()` warp), and an `--inverse-surface` pill above it shows the value.
- `js/loader.js`: `LOADER_STEP` goes to 650, and `MORPH_EASE` / `SPIN_EASE` (its own JS cubic-beziers) move to the M3E spring values. Keep the 5 shapes. Over Home's carousel cards the loader sits in a 48px `--primary-container` circle.

## Feel checklist

- Flick a switch in Settings, then press and hold one.
- Drag the text-size slider: the value shows and the handle stays crisp.
- Reload on Home: the loader is contained over the cards.

## Comments

**2026-11-27:** Resolved.

- Switch: a 52×32 track with a 2px `--outline` border on `--surface-container-highest` when off, `--primary` when on. The thumb is one 28px circle scaled (on the GPU, with the slide) to 16px in `--outline` off, 24px in `--on-primary` on, and 28px while pressed, on `--sp-fast`. Measured in Chromium: off 0.571, on 0.857 plus a 20px slide, pressed 1 in both states.
- Slider: `--hw` is registered with `@property`, so while dragging the handle thins from 4px to 2px by its width (the tracks either side follow); the `scale()` warps on hover and drag are gone. An `--inverse-surface` pill above the handle shows the size as a share of the default (100% at 1.45rem; 114% measured mid-drag), also shown on keyboard focus.
- Loader: `LOADER_STEP` 650ms. The morph runs on `--m3e-default-spatial` and the spin burst on `--m3e-fast-spatial`, both parsed from the CSS tokens via `motionToken`, so Reduce Motion reaches them too. The 5 shapes are unchanged. The loader only ever shows over Home's carousel cards, so it is always the contained variant: the shape (38px, `--on-primary-container`) on a 48px `--primary-container` circle.
- Found on the way, from ticket 03: `.btn-close` was still drawn in `--on-primary-container`, nearly invisible on the menus' surface containers under Vibrant dark (the text-only contrast audit missed it). It now takes its surface's text colour. An icon audit (3:1) over Coral, Limoncello and Slate found only the phone swatches' check mark, whose badge went from 35% to 55% black.
