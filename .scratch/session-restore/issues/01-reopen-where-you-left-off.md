# Reopen where you left off, and keep dark mode

Status: resolved

## What

As a Home Screen web app on iPhone, Epos Reader started fresh every time it was closed and reopened. The colour palette, Notes and Bookmarks came back, but the open tabs, the place in each Book and dark mode did not.

Two causes:

- **Tabs and reading position were never saved.** Startup always opened one New Tab (`js/main.js`), even though the README said open tabs were saved.
- **Dark mode saved the old mode.** `toggleTheme` (`js/settings.js`) wrote `state.theme` to storage right after starting a view transition, but the transition only calls `applyTheme` later, so the mode being left was saved. With Reduce Motion on there is no transition, which is why it sometimes worked.

## Done when

- Closing and reopening the app (as a Home Screen app or a browser tab) brings back the same tabs, Splits, front tab, Book and Line, text size and Scansion.
- Dark mode survives a relaunch.
- A first visit, or broken saved data, still starts on a New Tab.

## Comments

**2026-11-25:** Resolved.

- New `js/session.js` saves the session to `epos.session.v1` whenever the page is hidden (`visibilitychange`, plus `pagehide`), since iOS can close a Home Screen app in the background without an unload event. On launch `restoreSession()` rebuilds the tabs, Splits and Notebook and brings the front tab back; `js/main.js` falls back to a New Tab when there is nothing to restore.
- A reader's place is saved as the Line at the top of its pane (the chunker's anchor), and `renderPassage` (`js/reader.js`) jumps back to it once the Book has loaded. Tabs that are restored but not opened yet keep their saved place.
- `toggleTheme` now saves the mode it is switching to.
- README updated: it now describes what is saved, and lists `js/session.js`.
- Checked in Chromium: desktop 1280×800 (Odyssey α at Line 141 with Scansion on; three tabs with the Notebook and the Iliad in front) and iPhone 13 (Odyssey β at Line 87, dark mode). All came back after a reload with no page errors. Broken or unknown saved data starts on a New Tab, or on Book I where the saved Book doesn't exist.
