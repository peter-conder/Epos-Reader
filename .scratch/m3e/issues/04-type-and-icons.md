# Add the missing Roboto weights, drop uppercase headers, replace Lucide icons

Status: ready-for-agent
Blocked by: 03

## What

- Load Roboto 600 and 800 alongside 400, 500 and 700 in `index.html`.
- The 7 uppercase headers (`.flyout-header`, `.panel-title`, `.settings-section-title`, `.nb-divider`, `.lm-title`, and the two mobile ones) become sentence case, 14px, weight 700, letter-spacing 0.1px, in `--primary`. Check that the source text reads well in sentence case.
- Replace the stroked Lucide symbols in `assets/icons.svg` with Material Symbols Rounded. Active icons show the filled variant.

## Done when

- No `text-transform: uppercase` is left.
- Loading the app doesn't refit the Book a second time.
