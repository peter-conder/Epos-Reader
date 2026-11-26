import { ROMANS, WORKS, bookLabel, bookTitle } from './data.js';
import { el, esc, icon } from './dom.js';
import { activeTab, getTab, isText, state } from './state.js';
import { activateTab, addTab } from './tabs.js';
import { openWorkInTab } from './home.js';
import { closeTabGrid } from './tab-grid.js';
import { showChrome } from './bottom-bar.js';
import { prefersReducedMotion } from './motion.js';

/* ==========================================================
   CHAPTER LIST (phones and tablets): every book of every work that has data, grouped by work.
   Opened from "+" in the tab grid, by swiping past the last tab, or by tapping a work on a New Tab's
   home page (then only that work is listed). A book that is already open in a tab says "Open", and
   choosing it goes to that tab instead of opening it twice. Otherwise the book opens in the New Tab it
   was chosen from (or the open tab, if that is a New Tab), or in a new tab.
   ========================================================== */
const DATA_ROOT = 'data2';   // as in book-data.js

/* Which works have their books on the server. Decided by whether Book I's file is there rather than by
   a list in the code, so a work shows up as soon as its data does. Asked once. */
let available = null;
export function availableWorks() {
  available ??= Promise.all(Object.keys(WORKS).map((key) =>
    fetch(`${DATA_ROOT}/${key}/01.json`, { method: 'HEAD' })
      .then((r) => (r.ok ? key : null))
      .catch(() => null)
  )).then((keys) => {
    const ok = keys.filter(Boolean);
    if (!ok.length) available = null;   // transient offline failure: retry next time
    return ok;
  });
  return available;
}

const CLOSE_MS = 220;

let target = null;   // the New Tab the list was opened from, if any
let closeTimer = 0;

export const chapterListOpen = () => !el.chapterList.hidden && !el.chapterList.classList.contains('closing');

const openTabFor = (work, book) => state.tabs.find((t) => isText(t) && t.work === work && t.book === book);

function listHtml(works) {
  if (!works.length) return '<p class="cl-empty">No texts are available yet.</p>';
  return works.map((key) => {
    const w = WORKS[key];
    const rows = ROMANS.slice(0, w.bookCount).map((r) => {
      const open = openTabFor(key, r);
      return `<button class="cl-row${open ? ' is-open' : ''}" data-work="${key}" data-book="${r}"
        aria-label="${esc(`${bookTitle(key, r)}${open ? ' (open)' : ''}`)}">
        <span class="cl-book">Book ${bookLabel(key, r)}</span>${open ? '<span class="cl-badge">Open</span>' : ''}</button>`;
    }).join('');
    return `<section class="cl-work" aria-label="${esc(w.title)}">
      <h3 class="cl-work-title">${esc(w.title)}<span class="cl-poet">${esc(w.poet)}</span></h3>
      <div class="cl-rows">${rows}</div></section>`;
  }).join('');
}

/* Fills the list (only: just this work). Returns false if the list was closed while the works were asked for. */
async function fillChapterList(only) {
  el.clBody.innerHTML = '';
  const works = (await availableWorks()).filter((k) => !only || k === only);
  if (el.chapterList.hidden || el.chapterList.classList.contains('closing')) return false;
  el.clTitle.textContent = only ? WORKS[only].title : 'Open a Book';
  el.clBody.innerHTML = listHtml(works);
  el.clBody.scrollTop = 0;
  return true;
}

/* only: list just this work. into: the New Tab to open the chosen book in. */
export async function openChapterList({ only = null, into = null } = {}) {
  clearTimeout(closeTimer);
  closeTimer = 0;
  el.chapterList.classList.remove('closing');
  target = into;
  // Swiped in from the bottom bar: it is already on screen and filled (see peekChapterList)
  const peeked = el.chapterList.classList.contains('peek');
  el.chapterList.classList.remove('peek');
  el.chapterList.classList.toggle('from-peek', peeked);
  el.chapterList.hidden = false;
  el.chapterList.classList.add('open');
  document.documentElement.classList.add('chapters-open');
  if (peeked && el.clBody.firstElementChild) return;
  if (await fillChapterList(only)) el.clBody.querySelector('.cl-row')?.focus({ preventScroll: true });
}

/* Shows the list under the bottom bar, without opening it, so a swipe past the last tab can slide it in.
   The caller moves it; endPeekChapterList hides it again, or openChapterList keeps it. */
export function peekChapterList() {
  if (chapterListOpen()) return null;
  clearTimeout(closeTimer);
  closeTimer = 0;
  el.chapterList.classList.remove('closing');
  target = null;
  el.chapterList.classList.add('peek');
  el.chapterList.hidden = false;
  fillChapterList(null);
  return el.chapterList;
}

export function endPeekChapterList() {
  if (!el.chapterList.classList.contains('peek')) return;
  el.chapterList.classList.remove('peek');
  el.chapterList.hidden = true;
}

export function closeChapterList({ instant = false } = {}) {
  if (!chapterListOpen()) return;
  document.documentElement.classList.remove('chapters-open');
  target = null;
  showChrome();
  el.chapterList.classList.remove('open', 'from-peek');
  if (instant || prefersReducedMotion()) {
    clearTimeout(closeTimer);
    closeTimer = 0;
    el.chapterList.classList.remove('closing');
    el.chapterList.hidden = true;
    return;
  }
  el.chapterList.classList.add('closing');
  closeTimer = setTimeout(() => {
    closeTimer = 0;
    el.chapterList.classList.remove('closing');
    el.chapterList.hidden = true;
  }, CLOSE_MS);
}

function choose(work, book) {
  const existing = openTabFor(work, book);
  const into = target && getTab(target.id) === target && target.kind === 'new' ? target
    : activeTab()?.kind === 'new' ? activeTab() : null;
  closeTabGrid({ instant: true });
  closeChapterList();
  if (existing) activateTab(existing.id);
  else if (into) { activateTab(into.id); openWorkInTab(into, work, book); }
  else addTab(work, book);
}

export function initChapters() {
  el.clBody.addEventListener('click', (e) => {
    const row = e.target.closest('.cl-row');
    if (row) choose(row.dataset.work, row.dataset.book);
  });
  el.clClose.addEventListener('click', () => closeChapterList());
  el.clClose.innerHTML = icon('close');
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeChapterList(); });
}
