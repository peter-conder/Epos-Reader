# Make the collapsed desktop sidebar an M3E rail

Status: resolved
Blocked by: 05

## What

When `.sidebar.collapsed` (76px) is on, show each tab as a compact 56×44 rail pill with its Book numeral, or the Notebook icon for the Notebook, instead of hiding `.tab-list`. The active tab has the selected pill indicator. Clicking a pill switches tab.

## Feel checklist

- Collapse and expand the sidebar with several tabs open: the pills morph between the two widths.

## Comments

**2026-11-27:** Resolved.

- `js/tabs.js`: every tab carries a second, rail label (`.tab-rail`): the Book's numeral (`bookLabel`, so Greek numerals for Homer) under the Work's abbreviation, the Notebook's icon, or the app's icon for a New Tab. The abbreviation was added so that, say, two Book I's in different Works can be told apart; the hover card still names the tab in full.
- `css/styles.css`: collapsed, the tab list stays. Each tab is a 56×44 pill showing only its rail label (no close button); the tabs already fill the sidebar, so they morph between the two widths on the sidebar's own spring, and their height (48 → 44) on the same slow spring. The active tab keeps its filled primary pill as the selected indicator, and its icon is filled. A Split's two tabs stack as one segmented pill (22px outer, 8px inner corners). The collapsed sidebar scrolls if the pills overflow it, with no scrollbar.
- Checked in Chromium, Slate light and Amber dark, with a Split pair, a single tab and the Notebook: the pills measure 56×44; clicking one makes it the active tab; expanding again shows the full tabs, with the bubbling entrance as before.
- Not tried: dragging a rail pill to reorder or pair. The drag code works on `.tab` and doesn't depend on the label, but it was built for the wide list.
