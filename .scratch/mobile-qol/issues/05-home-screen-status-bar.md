# Let the text run behind the status bar in the Home Screen app

Status: needs-info

## What

Epos is used as a Home Screen web app on iPhone. The text stopped short of the status bar and was blurred under it, rather than running up around the Dynamic Island. The page already had `viewport-fit=cover` but no web app manifest and no `apple-mobile-web-app-*` tags.

## Done when

- The Home Screen app draws the text up behind the status bar, around the Dynamic Island, with the status bar's clock and icons over it.
- It is kept only if it helps on a real iPhone.

## Comments

**2026-11-25:** Added; waiting on a check on an iPhone.

- `manifest.webmanifest` (name, `display: standalone`, colours, icons) and, in `index.html`, `apple-mobile-web-app-capable`, `mobile-web-app-capable`, `apple-mobile-web-app-title` and `apple-mobile-web-app-status-bar-style: black-translucent`.
- The panes already pad their top by `env(safe-area-inset-top)`, so the first Line starts below the island and later Lines scroll up behind it.
- Known risks, from WebKit's tracker: an installed app keeps its old status-bar style until the icon is removed and added again (bug 260508); `black-translucent` gives white status-bar text in both themes and is marked deprecated (bug 210597); iOS 26.1 is reported to have stopped drawing Home Screen apps behind the status bar (bug 301994). The blur may be iOS 26's own scroll edge effect, which a page can't turn off.
- To check: delete the Home Screen icon, add it again from Safari, open a Book and scroll. If light mode's white status-bar text is hard to read, the fallback is a strip of the page colour behind the status bar in light mode only.
