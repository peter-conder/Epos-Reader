import { WORKS } from './data.js';
import { $, el, esc, icon } from './dom.js';
import { getTab, newTabId, state } from './state.js';
import { loadBook } from './book-data.js';
import { renderAll } from './layout.js';
import { activateTab, newTextTab } from './tabs.js';
import { createReader, renderPassage } from './reader.js';
import { createLoader } from './loader.js';
import { availableWorks, openChapterList } from './chapters.js';
import { isMobileTier } from './viewport.js';
import { scheduleSessionSave } from './session.js';

/* ==========================================================
   HOME PAGE: a carousel of the Works, shown when nothing is open and as the page
   of every Home tab. Hover a card and it grows into the large slot (the others step
   down to medium and small) and keeps that size after the mouse leaves.
   Clicking a card opens Book I of that Work on desktop, or its Book list on phones and tablets.
   ========================================================== */
const HOME_WORKS = ['aeneid', 'odyssey', 'iliad'];
// Flat colours show behind the artwork until it has loaded (and if a file is ever missing)
const HOME_BG = {
  aeneid: 'var(--primary)',
  odyssey: 'var(--secondary)',
  iliad: 'color-mix(in srgb, var(--primary) 55%, var(--secondary))'
};
// Artwork for each card. `pos` is the part of the painting kept in view when a narrow card crops it.
const HOME_ART = {
  aeneid:  { src: 'assets/images/aeneas.jpg',            pos: '45% 50%' },   // Aeneas carrying Anchises
  odyssey: { src: 'assets/images/ulyssespolyphemus.jpg', pos: '38% 50%' },   // Ulysses' ship
  iliad:   { src: 'assets/images/priamachilles.jpeg',    pos: '62% 50%' }    // Priam kneeling before Achilles
};

const CAROUSEL_HTML = HOME_WORKS.map((key, i) => `
  <button class="home-card" data-work="${key}" data-rank="${Math.min(i, 2)}" role="listitem" aria-label="${esc(`${WORKS[key].title} — ${WORKS[key].poet}`)}" style="--card-bg: ${HOME_BG[key]}; background-image: url('${HOME_ART[key].src}'); --card-pos: ${HOME_ART[key].pos}">
    <span class="home-card-scrim"></span><span class="home-card-title">${esc(WORKS[key].title)}</span>
  </button>`).join('');

/* Below desktop the cards stack, and a work with no data yet is left out (as in the chapter list) */
function markUnavailable(carousel) {
  availableWorks().then((have) => {
    for (const card of carousel.children) card.toggleAttribute('data-unavailable', !have.includes(card.dataset.work));
  });
}

export function bindCarousel(carousel, onPick) {
  const cards = [...carousel.children];
  markUnavailable(carousel);
  const setFocus = (idx) => cards.forEach((card, i) => {
    card.dataset.rank = Math.min(2, Math.abs(i - idx));
    card.classList.toggle('hot', i === idx);
  });
  // Leaving only hides the title: each card keeps the size it was last given
  const clearHot = () => cards.forEach((c) => c.classList.remove('hot'));

  carousel.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'touch') return;   // a tap goes straight to the click below
    const card = e.target.closest('.home-card');
    if (card) setFocus(cards.indexOf(card));
  });
  carousel.addEventListener('pointerleave', clearHot);
  carousel.addEventListener('focusin', (e) => {
    if (e.target.matches(':focus-visible')) setFocus(cards.indexOf(e.target));
  });
  carousel.addEventListener('focusout', (e) => {
    if (!carousel.contains(e.relatedTarget)) clearHot();
  });
  carousel.addEventListener('click', (e) => {
    const card = e.target.closest('.home-card');
    if (!card) return;
    // On a phone or tablet a work leads to its list of books; on desktop it opens Book I
    if (isMobileTier()) openChapterList({ only: card.dataset.work, into: carousel.closest('.tab-view') ? state.tabs.find((t) => t.view === carousel.closest('.tab-view')) : null });
    else onPick(card.dataset.work);
  });
}

/* Opening a work from Home: starts downloading at once. If it finishes quickly (e.g. cached), reveal right
   away; otherwise show the morphing loader until the Book data is ready (with a brief minimum so it doesn't flash). */
const LOADER_DELAY_MS = 90, LOADER_MIN_MS = 220;
export function openWithLoader(host, work, book, build, reveal) {
  if (host.classList.contains('loading')) return;   // one work at a time
  host.classList.add('loading');
  let loader = null, shownAt = 0;
  const showTimer = setTimeout(() => {
    loader = createLoader();
    host.append(loader);
    shownAt = performance.now();
  }, LOADER_DELAY_MS);
  loadBook(work, book).finally(() => {
    clearTimeout(showTimer);
    const finish = () => {
      build();
      loader?.remove();
      host.classList.remove('loading');
      reveal();
    };
    const wait = shownAt ? Math.max(0, LOADER_MIN_MS - (performance.now() - shownAt)) : 0;
    if (wait > 0) setTimeout(finish, wait); else finish();
  });
}

/* Builds a Home tab and appends its view, without activating or rendering (used by addNewTab and restoreSession) */
export function createNewTab(id = newTabId()) {
  const view = document.createElement('div');
  view.className = 'view empty-state tab-view';
  view.dataset.tabId = id;
  view.hidden = true;
  view.innerHTML = `<button class="pane-close" aria-label="Close pane" data-tip="Close pane" data-tip-side="bottom">${icon('close')}</button><h2 class="home-title">Select a Work</h2><div class="home-carousel" role="list" aria-label="Choose a Work to read">${CAROUSEL_HTML}</div>`;
  el.panes.append(view);
  const tab = { id, kind: 'new', partnerId: null, view, fresh: true };
  bindCarousel(view.querySelector('.home-carousel'), (work) => openWorkInTab(tab, work));
  return tab;
}

/* "+" opens a new Home tab */
export function addNewTab() {
  const tab = createNewTab();
  state.tabs.push(tab);
  activateTab(tab.id);
  return tab;
}

/* Choosing a work turns the new tab into a reader on Book I (or the book chosen from the chapter list), in the
   same place in the sidebar and any split. The home page stays on screen with the loading indicator while the
   reader is built behind it. */
export function openWorkInTab(tab, work, book = 'I') {
  const old = tab.view;
  const current = () => getTab(tab.id) === tab && tab.view === old;   // not closed (or undone) in the meantime
  let built = null;
  openWithLoader(old, work, book, () => {
    if (!current()) return;
    Object.assign(tab, { kind: 'text', work, book, split: false, splitPct: 50 });
    createReader(tab);
    built = tab.ui.root;
    tab.view = old;   // the home page stays this tab's view until the reader is shown
    renderPassage(tab);
  }, () => {
    if (!built) return;
    if (!current()) {
      // closed while loading: the reader that was built is no longer anyone's
      if (getTab(tab.id) !== tab || tab.ui.root !== built) built.remove();
      return;
    }
    tab.view = built;
    tab.fresh = true;
    old.remove();
    if (state.activeId === tab.id) activateTab(tab.id); else renderAll();
    scheduleSessionSave();
  });
}

export function initHome() {
  // The page shown when no tab is open
  const homeCarousel = $('home-carousel');
  homeCarousel.innerHTML = CAROUSEL_HTML;
  bindCarousel(homeCarousel, (work) => {
    let tab = null;
    openWithLoader(el.viewEmpty, work, 'I', () => {
      tab = newTextTab(work, 'I');
      createReader(tab);
      renderPassage(tab);
    }, () => {
      state.tabs.push(tab);
      activateTab(tab.id);
    });
  });
}
