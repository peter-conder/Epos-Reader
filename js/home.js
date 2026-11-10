import { WORKS } from './data.js';
import { $, el, esc, icon } from './dom.js';
import { getTab, newTabId, state } from './state.js';
import { loadBook } from './book-data.js';
import { renderAll } from './layout.js';
import { activateTab, newTextTab } from './tabs.js';
import { createReader, renderPassage } from './reader.js';
import { createLoader } from './loader.js';

/* ==========================================================
   HOME PAGE: a carousel of the works, shown when nothing is open and as the page
   of every new tab. Hover a card and it grows into the large slot (the others step
   down to medium and small) and keeps that size after the mouse leaves.
   Clicking a card opens Book I of that work.
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
  <button class="home-card" data-work="${key}" data-rank="${Math.min(i, 2)}" role="listitem" aria-label="${esc(WORKS[key].title)}: open Book I" style="--card-bg: ${HOME_BG[key]}; background-image: url('${HOME_ART[key].src}'); --card-pos: ${HOME_ART[key].pos}">
    <span class="home-card-scrim"></span><span class="home-card-title">${esc(WORKS[key].title)}</span>
  </button>`).join('');

export function bindCarousel(carousel, onPick) {
  const cards = [...carousel.children];
  const setFocus = (idx) => cards.forEach((card, i) => {
    card.dataset.rank = Math.min(2, Math.abs(i - idx));
    card.classList.toggle('hot', i === idx);
  });
  // Leaving only hides the title: each card keeps the size it was last given
  const clearHot = () => cards.forEach((c) => c.classList.remove('hot'));

  carousel.addEventListener('pointerover', (e) => {
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
    if (card) onPick(card.dataset.work);
  });
}

/* Opening a work from a home page: the indicator shows for 0.3 s. The book starts downloading at once,
   the reader is built hidden behind the indicator at 0.2 s, and it is shown when the indicator goes. */
const LOAD_BUILD_MS = 200, LOAD_SHOW_MS = 300;
export function openWithLoader(host, work, build, reveal) {
  if (host.classList.contains('loading')) return;   // one work at a time
  host.classList.add('loading');
  const loader = createLoader();
  host.append(loader);
  loadBook(work, 'I');
  setTimeout(build, LOAD_BUILD_MS);
  setTimeout(() => {
    loader.remove();
    host.classList.remove('loading');
    reveal();
  }, LOAD_SHOW_MS);
}

/* "+" opens a new tab on the home page */
export function addNewTab() {
  const id = newTabId();
  const view = document.createElement('div');
  view.className = 'view empty-state tab-view';
  view.dataset.tabId = id;
  view.hidden = true;
  view.innerHTML = `<button class="pane-close" aria-label="Close pane" data-tip="Close pane" data-tip-side="bottom">${icon('close')}</button><h2 class="home-title">Select a Text</h2><div class="home-carousel" role="list" aria-label="Choose a work to read">${CAROUSEL_HTML}</div>`;
  el.panes.append(view);
  const tab = { id, kind: 'new', partnerId: null, view, fresh: true };
  bindCarousel(view.querySelector('.home-carousel'), (work) => openWorkInTab(tab, work));
  state.tabs.push(tab);
  activateTab(id);
  return tab;
}

/* Choosing a work turns the new tab into a reader on Book I, in the same place in the sidebar and any split.
   The home page stays on screen with the loading indicator while the reader is built behind it. */
export function openWorkInTab(tab, work) {
  const old = tab.view;
  const current = () => getTab(tab.id) === tab && tab.view === old;   // not closed (or undone) in the meantime
  let built = null;
  openWithLoader(old, work, () => {
    if (!current()) return;
    Object.assign(tab, { kind: 'text', work, book: 'I', split: false, splitPct: 50 });
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
  });
}

export function initHome() {
  // The page shown when no tab is open
  const homeCarousel = $('home-carousel');
  homeCarousel.innerHTML = CAROUSEL_HTML;
  bindCarousel(homeCarousel, (work) => {
    let tab = null;
    openWithLoader(el.viewEmpty, work, () => {
      tab = newTextTab(work, 'I');
      createReader(tab);
      renderPassage(tab);
    }, () => {
      state.tabs.push(tab);
      activateTab(tab.id);
    });
  });
}
