# Motion lag after the M3E springs

Status: needs-info
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
