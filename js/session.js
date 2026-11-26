import { ROMANS, WORKS } from './data.js';
import { clamp, el, MIN_FONT } from './dom.js';
import { isNotebook, isText, shared, state } from './state.js';
import { activateTab, newTextTab } from './tabs.js';
import { createNewTab } from './home.js';
import { createReader, toggleScansion } from './reader.js';
import { isMobileTier, tier } from './viewport.js';

/* ==========================================================
   READING SESSION: the open tabs, Splits, which tab is in front, each reader's place in its Book,
   the text size and Scansion, saved in localStorage so the app opens where you left it.

   A phone can close a Home Screen web app at any moment once it's in the background, with no unload
   event, so the session is saved on mutations (debounced) as well as whenever the page is hidden.
   A reader's place is the Line at the top of its pane (the chunker's anchor, see chunks.js), kept as a
   Line number so it still points at the same Line if the layout or text size changes.
   ========================================================== */
const SESSION_KEY = 'epos.session.v1';
let saveTimer = 0;

/* The Line at the top of a reader's pane, and how far into it the pane starts */
function placeOf(tab) {
  const ch = tab.ui?.chunkers?.[0];
  if (!ch) return tab.restoreAt ?? null;            // restored but not shown yet: keep where it was
  if (!ch.anchor) return null;                      // at the very top of the Book
  return { line: ch.lineNums[ch.anchor.i], frac: ch.anchor.frac };
}

export function saveSession() {
  clearTimeout(saveTimer);
  saveTimer = 0;
  const tabs = state.tabs.map((t) => {
    const base = { id: t.id, kind: t.kind, partnerId: t.partnerId ?? null, usedAt: t.usedAt ?? 0 };
    if (isNotebook(t)) return t.pageOnly ? { ...base, pageOnly: true } : base;
    return isText(t)
      ? { ...base, work: t.work, book: t.book, split: !!t.split, splitPct: t.splitPct ?? 50,
          lang: t.lang === 'en' ? 'en' : 'la', place: placeOf(t) }
      : base;
  });
  const session = { tabs, activeId: state.activeId, pairPct: state.pairPct, fontRem: state.fontRem, scansion: state.scansion };
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* storage unavailable */ }
}

export function scheduleSessionSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveSession, 400);
}

function loadSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    return s && Array.isArray(s.tabs) && s.tabs.length ? s : null;
  } catch { return null; }
}

/* Rebuilds the saved tabs. Returns false (and changes nothing) when there is no session to restore. */
export function restoreSession() {
  const s = loadSession();
  if (!s) return false;
  const ids = new Map();   // saved id → id now
  for (const saved of s.tabs) {
    const usedAt = Number.isFinite(saved.usedAt) ? saved.usedAt : 0;
    if (saved.kind === 'text' && WORKS[saved.work] && typeof saved.book === 'string') {
      const validBook = ROMANS.slice(0, WORKS[saved.work].bookCount).includes(saved.book) ? saved.book : 'I';
      const splitPct = Number.isFinite(saved.splitPct) ? clamp(saved.splitPct, 25, 80) : 50;   // as the divider allows (reader.js)
      const lang = saved.lang === 'en' && tier() === 'compact' ? 'en' : 'la';
      const tab = Object.assign(newTextTab(saved.work, validBook), {
        // A saved place belongs to the saved Book: when that Book was invalid and became Book I, start at its top
        id: saved.id, split: !!saved.split, splitPct, lang, usedAt, restoreAt: validBook === saved.book ? saved.place ?? null : null
      });
      createReader(tab);
      tab.ui.root.dataset.lang = lang;
      state.tabs.push(tab);
      ids.set(saved.id, tab.id);
    } else if (saved.kind === 'notebook' && !state.tabs.some(isNotebook)) {
      const tab = { id: 'tab-notebook', kind: 'notebook', partnerId: null, usedAt, view: el.viewNotebook, fresh: true };
      if (saved.pageOnly && isMobileTier()) tab.pageOnly = true;
      el.viewNotebook.dataset.tabId = tab.id;
      shared.notebookDirty = true;
      state.tabs.push(tab);
      ids.set(saved.id, tab.id);
    } else if (saved.kind === 'new') {
      const tab = createNewTab();
      tab.usedAt = usedAt;
      state.tabs.push(tab);
      ids.set(saved.id, tab.id);
    }
  }
  if (!state.tabs.length) return false;

  // Splits: both halves must have come back, and point at each other
  for (const saved of s.tabs) {
    const tab = state.tabs.find((t) => t.id === ids.get(saved.id));
    const partner = state.tabs.find((t) => t.id === ids.get(saved.partnerId));
    if (tab && partner && s.tabs.find((p) => p.id === saved.partnerId)?.partnerId === saved.id) tab.partnerId = partner.id;
  }
  if (Number.isFinite(s.pairPct)) state.pairPct = clamp(s.pairPct, 25, 75);

  // Text size goes through the slider, which also widens the pane and refits the text
  const maxFont = parseFloat(el.fontSlider.max) || 1.8;
  if (Number.isFinite(s.fontRem)) {
    const clamped = clamp(s.fontRem, MIN_FONT, maxFont);
    if (clamped !== state.fontRem) {
      el.fontSlider.value = String(clamped);
      el.fontSlider.dispatchEvent(new Event('input'));
    }
  }
  if (!!s.scansion !== state.scansion) toggleScansion();

  activateTab(ids.get(s.activeId) ?? state.tabs[0].id, { promote: false });
  return true;
}

export function initSession() {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveSession(); });
  addEventListener('pagehide', saveSession);
}
