# Motion lag after the M3E springs

Status: resolved
Blocked by: 02

## What

After ticket 02 the user sees lag in three places:

- Desktop: switching Books in the top bar (the segmented Book selector).
- Desktop: opening and closing a Split.
- Phone: the Bookmark ribbon dropping in.

Fix it without changing what is seen: same curves, durations and overshoot. Only the technique may change (for example compositor-only properties in place of layout ones). Anything that would look different, however slightly, goes to the user as a before/after first. Durations the JS waits on stay as listed in ticket 02's comments.

## Feel checklist

- Click from Book I to Book VI and back a few times quickly: the pills spring without a stutter.
- Open a Split and close it again: both panes glide, the text doesn't hitch.
- On the phone, Bookmark a line and remove it: the ribbon drops and springs up smoothly.

## Comments

**2026-11-27:** Opened from a grilling session. The user chose a separate ticket that lands before 03, and "change technique, keep what I see".

**2026-11-27:** First measurement, in Chromium (Playwright), `HEAD` against `1a8acd0` (before ticket 02), with CPU throttling at 2× and 4×:

- Book switch: main-thread time, layout count and paint are within run-to-run noise of `1a8acd0`.
- Split open: about 10% more paint and script time on `HEAD` (Paint 420ms vs 364ms over 1s at 2×), but the frame drops are the same before and after. The cost is old: the staying pane's `width`/`max-width` is animated, so the text reflows and repaints every frame.
- Ribbon (390×844, touch): cheap in both, no long tasks.

So Chromium doesn't reproduce a regression. Open question to the user: which browser (Safari on macOS/iOS is likely, given the Home Screen app), and is the lag a stutter (dropped frames) or a slow response (the motion feels late or drawn out)?

**2026-11-27:** The user's browsers are Chrome on a Mac and Safari on an iPhone, and the lag is a stutter "throughout, though not all of it". A sweep of desktop (1512×982 at 2×) and phone (390×844, CPU 4×) interactions, `HEAD` against `1a8acd0`, counting incomplete and dropped frames in Chromium traces:

- Cause 1, fixed: ticket 02 swapped `transform: scale()` presses (run by the GPU) for corner-radius morphs and press widening (run on the main thread every frame). Each morphing control now gets its own layer (`will-change: transform`), and the rows whose pills widen (`.add-split`, `.pill-group`, `.segments`) get `contain: layout`. (A single run showed pressing "Open new tab" going from 56 incomplete frames to 0; repeated runs below show that was noise.) Screenshots in Amber, light and dark, at both sizes: only anti-aliasing differs, which macOS and iOS don't use.
- Cause 2, open: a corner morph still stutters when the same press starts heavy work on the main thread (Scansion re-renders the text: 20–41 incomplete frames vs 8–9 before). Neither `border-radius` nor `clip-path` runs on the GPU in Chromium 158 (tested), so no change of technique fixes it without the user's decision.
- Cause 3, open: some animations got longer in 02, so more frames are drawn: the phone tab grid 240 → 500ms (paint 227ms vs 76ms, 23 incomplete frames vs 3–4), its cards 360 → 500ms, the ribbon drop 420 → 500ms.
- Splits: the stutter there predates 02 (the staying pane's width reflows the text every frame).

**2026-11-27:** Decided with the user: (17a) heavy work behind a toolbar press starts once the morph is mostly done; (18) the durations 02 lengthened go back, on the M3E curves; (19) Split text wraps once instead of every frame. The user will check the Split by hand, with no recording.

**2026-11-27:** Resolved.

- `js/toolbar.js`: the Parallel English and Scansion buttons take their new state at once, and the toggle runs `MORPH_LEAD` (150ms) later. A quick double click still ends with the button matching the text (checked: Scansion and Parallel English, single and double clicks). The phone's Scansion switch and session restore call the toggle directly, with no delay.
- `css/styles.css`: the phone tab grid 500 → 240ms, its cards 500 → 360ms, the ribbon drop 500 → 420ms, each on `--m3e-default-spatial`.
- `js/motion.js`: while a Split opens or closes, the staying pane's text column is held at its final width (`holdColumn`/`releaseColumn`) on a layer of its own, instead of animating `max-width`. The card's edges still glide; the Lines wrap once. Desktop 1512×982 at 2×, CPU 2×: close layout 107 → about 60ms and paint about 270 → 105ms; open paint about 370 → 120–190ms. Dropped frames on open are still about 10–15: the new pane's first layout is one long task, which wasn't touched.
- Repeated runs (6 each, 1512×982 at 2×, CPU 2×, median incomplete frames): Scansion press 8 now, 21 on ticket 02, 9 on `1a8acd0`. Pressing "Open new tab" drops no frames on any of the three (only the first press after loading is slow, in all of them), so the containment rules from the first fix show no measurable gain there. They stay, since they change nothing drawn.
- Not checked here: iPhone Safari. The ribbon, the tab grid and the sheets need the feel checklist on the phone.
