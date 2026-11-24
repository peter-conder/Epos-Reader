# Notebook shows Notes only

Status: needs-triage

## What

`CONTEXT.md` defines the **Notebook** as the tab that gathers all of the reader's Notes, with Bookmarks not part of it. The code still mixes Bookmarks in:

- `js/notes.js:62–63`: the Notebook header counts Bookmarks (`N notes · M bookmarks`).
- `js/notes.js:88`: rebuilding the Notebook also calls `renderBookmarks()`.

## Done when

- The Notebook header and body mention Notes only.
- Bookmarks are still listed and reachable wherever else they appear (check `js/bookmarks.js` and `js/sidebar.js`), so nothing is lost.

## Comments
