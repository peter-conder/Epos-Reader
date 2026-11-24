# Notebook shows Notes only

Status: wontfix

## What

`CONTEXT.md` defines the **Notebook** as the tab that gathers all of the reader's Notes, with Bookmarks not part of it. The code still mixes Bookmarks in:

- `js/notes.js:62–63`: the Notebook header counts Bookmarks (`N notes · M bookmarks`).
- `js/notes.js:88`: rebuilding the Notebook also calls `renderBookmarks()`.

## Done when

- The Notebook header and body mention Notes only.
- Bookmarks are still listed and reachable wherever else they appear (check `js/bookmarks.js` and `js/sidebar.js`), so nothing is lost.

## Comments

**2026-11-24:** Won't fix. Taking Bookmarks out would have left them with no list anywhere else (in a Book they only show as margin marks), so the owner decided to keep Bookmarks in the Notebook. `CONTEXT.md` now defines the Notebook as gathering Notes and Bookmarks, which matches the code.
