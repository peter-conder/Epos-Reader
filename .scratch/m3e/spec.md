# Material 3 Expressive pass

Agreed in a design review on 2026-11-27, starting from an external comparison of Epos Reader with Google's Material 3 Expressive (M3E) spec. Each section is a decision, not a proposal. One ticket per pull request under `issues/`, landed in order.

## Scope

- **M3E chrome, calm text.** Controls, menus, sheets and motion become M3E. The reading text (Lines, Words, Scansion, Parallel translation) stays quiet.
- **Kept structures, restyled.** The Safari-style three-piece bottom bar keeps its layout (Aa circle, citation pill, tab-count circle) but takes M3E colour, springs and a rounded progress line. The left-edge back swipe and the Bookmark corner ribbon stay, with M3E springs.
- **Replaced.** The iOS 44×26 switch becomes the M3E 52×32 switch.
- **Not changing.** The 1024px mobile/desktop breakpoint, the reading fonts, and the bottom bar's layout and gestures.

## Decisions

1. **Tokens are replaced, not added alongside.** The M3E motion springs and corner scale replace `--ease-spring`, `--ease-bouncy`, `--ease-springy`, `--chrome-ease` and the hardcoded curves and radii. Each old name is deleted in the phase that stops using it. The JS constants in `js/motion.js` take the same values.
2. **Splits never overshoot.** Opening and closing a Split uses M3's Standard (non-Expressive) default spatial curve, so the two panes don't bounce into each other.
3. **Reduce Motion.** One global rule swaps every spatial spring for its effects (non-overshoot) curve, on desktop and mobile.
4. **Surfaces.** Five tonal surface containers plus `--outline` and `--outline-variant`. The Zinc `--gray-*` scale is removed. Menus, flyouts, the picker and sheets move off `--primary-container` onto calm surfaces. The tool bar, `.add-split`, the word card and note cards stay Vibrant.
5. **Tertiary.** Hand-tuned per palette, generated with `@material/material-color-utilities` and approved from a swatch sheet first. Used only on Note and Bookmark chrome. Noted Words in the text stay icon-only (see `ec05a60`).
6. **Type.** Stay on static Roboto and add the 600 and 800 weights. Roboto Flex is dropped: it has no `greek-ext` subset (U+1F00–1FFF), and the Iliad and Odyssey use polytonic Greek. Selected Words keep the `text-shadow` thickening. The 7 uppercase headers become sentence case, 14px bold, in `--primary`.
7. **Icons.** Only the stroked Lucide icons are replaced with Material Symbols Rounded. Active icons switch to filled.
8. **Lists.** Settings `.src-list`, `#drawer`, the work picker and the chapter list become M3E segmented lists.
9. **Loader.** 650ms per shape. Keep the 5 custom shapes. The contained variant is used only over Home's carousel cards.
10. **Rail.** The collapsed desktop sidebar shows tab indicators as an M3E rail. It is a separate pull request because it is the only change that adds behaviour.

## Checking

- **Screenshots** at 390×844, 768×1024 and 1280×800, in Slate and Amber, light and dark, before and after.
- **By hand on a phone:** pull the branch, run `python3 -m http.server 8000 --bind 0.0.0.0`, and open it on the computer's LAN IP. Each ticket ends with a feel checklist, since springs can't be judged from screenshots.

## Corrections to the source comparison

- `'GRAD' 150` can't replace the `text-shadow` on selected Words: Gentium Plus has no variable axes, and Roboto Flex lacks polytonic Greek.
- Pressing a selected pill must not shrink it: the press widening needs `:not(.active)`, since `.pill-opt.active` already sets `flex-grow: 1.45`.
- Radius morphs only animate between explicit pixel values. Every `9999px` / `var(--radius-full)` on a morphing element has to go.
- Changing fonts must never load a new face mid-read: `loadingdone` refits the Book (`css/styles.css`, comment above `.word.selected`).
