# M3E switch, slider and loader

Status: ready-for-agent
Blocked by: 04

## What

- `.switch`: 52×32 with a 2px `--outline` border when off. The thumb is 16px off, 24px on (`--on-primary` on a `--primary` track) and 28px while pressed, using `--m3e-fast-spatial`.
- `.m3-slider`: while dragging, the handle narrows by width and gap (no `scale()` warp), and an `--inverse-surface` pill above it shows the value.
- `js/loader.js`: `LOADER_STEP` goes to 650, and `MORPH_EASE` / `SPIN_EASE` (its own JS cubic-beziers) move to the M3E spring values. Keep the 5 shapes. Over Home's carousel cards the loader sits in a 48px `--primary-container` circle.

## Feel checklist

- Flick a switch in Settings, then press and hold one.
- Drag the text-size slider: the value shows and the handle stays crisp.
- Reload on Home: the loader is contained over the cards.
