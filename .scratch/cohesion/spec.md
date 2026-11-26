# Cross-Device Cohesion & Data Integrity

Make Epos Reader feel cohesive, intentional, and resilient across phone (`compact`), tablet (`medium`), and desktop, and fix data-integrity and persistence gaps.

## Agreed decisions

- **Delivery:** Frontend and data fixes split into four phased PRs, each checked at phone (390×844), tablet (768×1024), and desktop (1280×800).
- **Reading typography:** Keep Roboto as the default reading font, but apply `var(--reading-font)` to classical text in Word cards (Lemmas, Scansion) and Notes too; update Credits/README copy to match.
- **Motion:** Unified Material Expressive system across all devices — subtle spring on small interactive controls, smooth Emphasized deceleration (no overshoot) on structural movement (panes, sheets, page swipes, sidebar), with full `prefers-reduced-motion` support.
- **Mobile bottom bar & drawer:** Leave the bottom-bar Citation pill swipe-only; remove the duplicate Format Text row from the hamburger drawer (the bottom-bar paintbrush button owns it).
- **Phone ergonomics:** Hide Pane Margins below 600px (keep fixed 16px margin without desktop overrides); tuck the right-edge Bookmark dot strip flush-right with a narrow 24px horizontal hit zone and matching right text padding so dots never steal word taps; single-column Notebook cards on narrow screens.
- **Tablet (600–1024px):** Give tablet Parallel translation rounded cards with outer padding like desktop; scale Tab Grid to 3 columns on wider tablets; ignore desktop Splits so tablet tabs use full width and keep the Translation toggle enabled.
- **Scansion:** Rare Scansion marks (Hiatus, Synizesis, Consonantal i, Lengthened syllable, Hypermetric syllable) are **off by default** and controlled by a toggle in Format Text / View Options; when on (with Scansion on), show both text marks and Word card explanations.
- **Missing definitions & unanalysed words:** Unify Latin and Greek Lexicons on `def: null` so proper nouns show `"Proper name."`, other missing definitions show `"No definition yet."`, and unanalysed words show `"No analysis for this word yet."`.

## Phases

1. `.scratch/cohesion/issues/01-data-integrity-and-loading.md` — Data integrity (`build_homer.py`, `data2/`) and resilient loading/caching.
2. `.scratch/cohesion/issues/02-cross-device-layout-and-interactions.md` — Cross-device layout, swipe, tablet, phone ergonomics, and interaction bug fixes.
3. `.scratch/cohesion/issues/03-visual-and-motion-system.md` — Unified visual tokens, dark mode, typography, rare Scansion toggle, and unified motion / reduced motion.
4. `.scratch/cohesion/issues/04-persistence-accessibility-glossary.md` — Complete settings/session persistence, keyboard accessibility, cleanup, and `CONTEXT.md` glossary alignment.
