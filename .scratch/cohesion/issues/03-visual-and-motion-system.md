# Phase 3: Unified visual, typography, and motion system

Status: resolved

## What

- Typography: keep Roboto as default reading font, apply `var(--reading-font)` to Word card Lemmas, Scansion, and Note words, update Credits/README copy to reflect Gentium Plus as the serif reading option, normalize unloaded font weights (`600`/`800` → `500`/`700` or load needed weights), and fix `.card-scan` wrapping.
- Rare Scansion marks: off by default; add a "Rare scansion marks" toggle in Format Text / View Options (replacing the default-on Synizesis toggle) that enables visual marks (including Hiatus and Hypermetric) and Word card explanations when Scansion is on.
- Surfaces & Dark Mode: eliminate light-mode palette FOUC (sync `:root` Slate defaults and restore `epos.palette.v1` before paint); add `startViewTransition` to palette switches; replace hardcoded shadows with elevation tokens; separate dark-mode `.format-sheet`; fix `.switch::after` and `.nb-empty` contrast; frame `#view-settings` consistently on desktop; make `.bm-ribbon` outline truly hollow; sync `<meta name="theme-color">` with active palette/theme.
- Motion: consolidate 9+ easing curves into shared CSS/JS Material Expressive tokens (subtle spatial spring for small controls, Emphasized decelerate for structural movement); implement complete `prefers-reduced-motion` across CSS and JS (including instant bottom-bar tab switch); add symmetric exit animations for sheets/overlays; fix `.drawer` stagger and `.tg-card` re-animation; await `loadBook()` in `openWithLoader`; avoid per-frame `ResizeObserver` thrash during Split/Sidebar animations.

## Done when

- Motion and visual tokens are unified across phone, tablet, and desktop; reduced motion is respected everywhere; verified in light and dark mode across palettes.

## Comments

- 2026-11-26: Implemented unified typography, Rare Scansion toggle (off by default), light/dark surface tokens, hollow Bookmark ribbon, unified Material Expressive motion system (`--ease-spatial` / `--ease-emphasized`), symmetric sheet/overlay exits, and complete `prefers-reduced-motion` support. Verified with `node --check js/*.js` and headless Chromium across desktop (1280x800), phone (390x844), and reduced-motion tablet (768x1024).
