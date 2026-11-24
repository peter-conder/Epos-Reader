import { WORKS } from './data.js';
import { clamp, el, esc, icon } from './dom.js';
import { activeTab, getTab, isText, partnerOf, state } from './state.js';
import { anchorIndex, jumpToIndex, syncLayout } from './chunks.js';
import { toggleSplit } from './reader.js';
import { refreshBottomBar } from './bottom-bar.js';
import { isMobileTier, onTierChange, tier } from './viewport.js';
import { isMarked, toggleBookmark } from './bookmarks.js';
import { hideWordCard, openWordNote, showWordCard } from './word-card.js';
import { findWordNote } from './notes.js';

/* ==========================================================
   ENGLISH AND LINE ACTIONS (phones and tablets)
   - The EN button on the bottom bar. On a phone it swaps the whole view between the Latin and the English,
     keeping your place (the line at the top stays at the top). On a tablet it opens the English beside the
     Latin, as the desktop's Parallel English does.
   - Tapping a line number bookmarks the line, or, with "Show its English" chosen in Settings, opens that
     line's English under it (hidden while the Format Text sheet is open, so you can see the text you are
     formatting).
   - A long press on a line opens a menu: bookmark it, add a note, copy it.
   ========================================================== */
const LINE_TAP_KEY = 'epos.linetap.v1';
const LONG_PRESS_MS = 500;
const PRESS_SLOP = 10;   // px a finger may wander before the press stops counting

export const lineTapMode = () => state.lineTap;
const tabOf = (node) => getTab(node.closest('.tab-view')?.dataset.tabId);
const lineIndex = (tab, line) => tab.ui?.chunkers?.[0]?.lineNums?.indexOf(line) ?? -1;
const englishFor = (tab, line) => {
  const i = lineIndex(tab, line);
  return tab.book === 'I' && i >= 0 ? WORKS[tab.work]?.translations?.[i] ?? null : null;
};

/* ---------- Swap (phone) / side by side (tablet) ---------- */
export function syncLangButton() {
  const tab = activeTab();
  const text = isText(tab);
  el.langBtn.hidden = !text;
  if (!text) return;
  const onPhone = tier() === 'compact';
  const on = onPhone ? tab.lang === 'en' : !!tab.split;
  const unavailable = !onPhone && !!partnerOf(tab);
  el.langBtn.setAttribute('aria-pressed', String(on));
  el.langBtn.disabled = unavailable;
  el.langBtn.textContent = onPhone && on ? 'LA' : 'EN';
  el.langBtn.setAttribute('aria-label', onPhone ? (on ? 'Show the Latin' : 'Show the English') : (on ? 'Hide the English' : 'Show the English beside the Latin'));
}

export function setLang(tab, lang) {
  if (!isText(tab) || !tab.ui?.chunkers) return;
  if ((tab.lang ?? 'la') === lang) return;
  const [la, en] = tab.ui.chunkers;
  const [from, to] = lang === 'en' ? [la, en] : [en, la];
  const at = from.anchor ? anchorIndex(from) : null;   // null: still at the top, title showing
  tab.lang = lang;
  tab.ui.root.dataset.lang = lang;
  hideWordCard();
  syncLayout(tab);                                       // the pane just shown may never have been laid out
  // Back to the Latin without having moved in the English: return exactly where you were. (Past the end of
  // the English, the English can only show its last lines, which would otherwise send you back to them.)
  if (lang === 'la' && tab.swapBack && anchorIndex(en) === tab.swapBack.enAt) {
    const saved = tab.swapBack.la;
    tab.swapBack = null;
    jumpToIndex(la, saved ? saved.i : null, saved?.frac ?? 0);
  } else {
    jumpToIndex(to, at == null ? null : Math.min(at, to.rows.length - 1));
    tab.swapBack = lang === 'en' ? { la: la.anchor && { ...la.anchor }, enAt: anchorIndex(en) } : null;
  }
  syncLangButton();
  refreshBottomBar(tab);
}

function toggleEnglish() {
  const tab = activeTab();
  if (!isText(tab)) return;
  if (tier() === 'compact') setLang(tab, tab.lang === 'en' ? 'la' : 'en');
  else toggleSplit();
  syncLangButton();
}

/* ---------- Tapping a line number ---------- */
function toggleLineEnglish(tab, verse) {
  const open = verse.querySelector('.line-en');
  if (open) open.remove();
  else {
    const en = englishFor(tab, +verse.dataset.line);
    verse.insertAdjacentHTML('beforeend', `<div class="line-en">${en ? esc(en) : '<em>No English for this line yet.</em>'}</div>`);
  }
  syncLayout(tab);   // the line is taller or shorter now
}

/* Called for a tap on a line's number (below desktop). Returns whether it was handled. */
export function lineNumberTap(verse) {
  const tab = tabOf(verse);
  if (!isText(tab)) return false;
  if (state.lineTap === 'english') toggleLineEnglish(tab, verse);
  else toggleBookmark(tab, +verse.dataset.line);
  return true;
}

/* ---------- Long press: the line menu ---------- */
let menuFor = null;   // { tab, verse, word }

function openLineMenu(tab, verse, word, x, y) {
  const line = +verse.dataset.line;
  const marked = state.bookmarks.some((b) => isMarked(b, tab) && b.line === line);
  const w = word ?? verse.querySelector('.word');
  menuFor = { tab, verse, word: w };
  const ctx = w && { work: tab.work, book: tab.book, line, wordIdx: +w.dataset.i };
  const hasNote = !!(ctx && findWordNote(ctx));
  el.lineMenu.innerHTML = `
    <div class="lm-title">Line ${line}</div>
    <button class="lm-item" data-act="bookmark">${icon('bookmark')}<span>${marked ? 'Remove Bookmark' : 'Bookmark Line'}</span></button>
    ${w ? `<button class="lm-item" data-act="note">${icon('note')}<span>${hasNote ? 'Edit Note' : 'Add Note'}</span><span class="lm-sub">on “${esc(w.textContent.trim())}”</span></button>` : ''}
    <button class="lm-item" data-act="copy">${icon('snippet')}<span>Copy Line</span></button>`;
  el.lineMenu.classList.add('open');
  const m = el.lineMenu.getBoundingClientRect();
  const top = y - m.height - 16 >= 12 ? y - m.height - 16 : y + 24;   // above the finger, or below if no room
  el.lineMenu.style.left = `${clamp(x - m.width / 2, 12, innerWidth - m.width - 12)}px`;
  el.lineMenu.style.top = `${clamp(top, 12, innerHeight - m.height - 12)}px`;
  verse.classList.add('pressed');
  el.lineMenu.querySelector('.lm-item')?.focus({ preventScroll: true });
}

export function closeLineMenu() {
  if (!menuFor) return;
  menuFor.verse.classList.remove('pressed');
  menuFor = null;
  el.lineMenu.classList.remove('open');
}

async function lineMenuAction(act) {
  const { tab, verse, word } = menuFor ?? {};
  if (!tab) return;
  closeLineMenu();
  if (act === 'bookmark') toggleBookmark(tab, +verse.dataset.line);
  // After this tap has finished: the page's own click handling would otherwise close the card at once
  else if (act === 'note' && word) setTimeout(() => { showWordCard(word); openWordNote(); });
  else if (act === 'copy') {
    copyText([...verse.querySelectorAll('.word')].map((w) => w.textContent.trim()).join(' '));
  }
}

/* The clipboard API exists only on secure (https) pages; elsewhere a selected, off-screen textarea is copied */
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return; } catch { /* no clipboard API here */ }
  const ta = Object.assign(document.createElement('textarea'), { value: text, readOnly: true });
  Object.assign(ta.style, { position: 'fixed', top: '-200px', opacity: '0' });
  document.body.append(ta);
  ta.select();
  try { document.execCommand('copy'); } catch { /* copying not allowed */ }
  ta.remove();
}

function bindLongPress() {
  let press = null, swallowClick = false;
  const cancel = () => { if (press) { clearTimeout(press.timer); press = null; } };
  el.panes.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch' || !isMobileTier()) return;
    const verse = e.target.closest('.passage .verse');
    if (!verse) return;
    const tab = tabOf(verse);
    press = { x: e.clientX, y: e.clientY, id: e.pointerId, timer: setTimeout(() => {
      press = null;
      swallowClick = true;   // the finger lifting must not also open the word card
      navigator.vibrate?.(8);
      openLineMenu(tab, verse, e.target.closest('.word'), e.clientX, e.clientY);
    }, LONG_PRESS_MS) };
  });
  el.panes.addEventListener('pointermove', (e) => {
    if (press && e.pointerId === press.id && Math.hypot(e.clientX - press.x, e.clientY - press.y) > PRESS_SLOP) cancel();
  });
  el.panes.addEventListener('pointerup', cancel);
  el.panes.addEventListener('pointercancel', cancel);
  el.panes.addEventListener('scroll', cancel, true);
  // Android's own long-press menu (and text selection) would open on top of ours
  el.panes.addEventListener('contextmenu', (e) => { if (isMobileTier() && e.target.closest('.passage')) e.preventDefault(); });
  document.addEventListener('click', (e) => {
    if (swallowClick) { swallowClick = false; e.stopPropagation(); e.preventDefault(); return; }
    if (menuFor && !e.target.closest('#line-menu')) closeLineMenu();
  }, true);
}

/* ---------- Setting: what a tap on a line number does ---------- */
function renderLineTapChoices() {
  const opts = [
    ['bookmark', 'Bookmark the line', 'Tap again to remove it'],
    ['english', 'Show its English', 'Under the line, until you tap again']
  ];
  el.lineTapChips.innerHTML = opts.map(([key, title, sub]) => `
    <button class="settings-chip${state.lineTap === key ? ' active' : ''}" data-linetap="${key}" aria-pressed="${state.lineTap === key}">
      <span class="settings-chip-title">${title}</span><span class="settings-chip-sub">${sub}</span>
    </button>`).join('');
}

function setLineTap(mode) {
  state.lineTap = mode === 'english' ? 'english' : 'bookmark';
  try { localStorage.setItem(LINE_TAP_KEY, state.lineTap); } catch { /* storage unavailable */ }
  renderLineTapChoices();
  // Lines opened in the other mode close: the numbers mean something else now
  if (state.lineTap !== 'english') for (const t of state.tabs) if (t.ui?.passage.querySelector('.line-en')) {
    t.ui.passage.querySelectorAll('.line-en').forEach((n) => n.remove());
    syncLayout(t);
  }
}

/* The Format Text sheet hides lines' English while it is open (see .sheet-open .line-en), so heights change */
export function relayoutLineEnglish() {
  const tab = activeTab();
  if (isText(tab) && tab.ui?.passage.querySelector('.line-en')) syncLayout(tab);
}

export function initEnglish() {
  let saved = null;
  try { saved = localStorage.getItem(LINE_TAP_KEY); } catch { /* storage unavailable */ }
  state.lineTap = saved === 'english' ? 'english' : 'bookmark';
  renderLineTapChoices();
  el.lineTapChips.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-linetap]');
    if (chip) setLineTap(chip.dataset.linetap);
  });
  el.langBtn.addEventListener('click', toggleEnglish);
  el.lineMenu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-act]');
    if (item) lineMenuAction(item.dataset.act);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLineMenu(); });
  bindLongPress();
  onTierChange(() => {
    closeLineMenu();
    // The swap is a phone thing: wider screens show the Latin (with the English beside it if that's on)
    if (tier() !== 'compact') for (const t of state.tabs) if (t.lang === 'en') setLang(t, 'la');
    syncLangButton();
  });
}

