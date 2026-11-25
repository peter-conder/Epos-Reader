# Fade the bottom bar and menu button while reading

Status: resolved

## What

On phones and tablets the bottom bar and menu button slid off-screen when you scrolled down, but stayed up as long as you weren't scrolling. They should fade, and also go when you stop touching the screen for a moment.

## Done when

- The bar and menu button fade out (opacity and a slight shrink) instead of sliding.
- They go when you scroll down, as before, or after 3 seconds without a touch, key or scroll. Nothing fades while a finger is down.
- Only in a text tab: the Notebook and Home keep them up. Never while the Format text sheet, the word card or its note editor, the tab grid, the chapter list, the menu or the line menu is open.
- They come back on scroll up, at either end of the text, or on a tap outside a word.

## Comments

**2026-11-25:** Resolved.

- `js/bottom-bar.js`: `canHide` decides whether the bars may go (mobile tier, text tab, nothing open on top); `bindIdle` counts fingers down and restarts a 3-second wait on any pointer, key, wheel or pane scroll; showing the bars restarts it too.
- `css/styles.css`: `.chrome-hidden` now fades both (opacity, scale 0.94 for the bar from its bottom edge and 0.88 for the menu button) and stops their pieces taking touches. Sheets still slide the bar down out of their way.
- Checked in Chromium at 390×844: hidden after 3.3s idle; a tap in the margin brings them back; with the word card or the tab grid open they stay; closing the grid restarts the wait; scrolling down hides them.
