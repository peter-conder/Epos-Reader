import { $, clamp, el, MIN_FONT, root } from './dom.js';
import { state } from './state.js';
import { closePopovers, setBook, setOpen, setView } from './layout.js';
import { toggleScansion, toggleSplit } from './reader.js';
import { fitAll } from './fit.js';
import { hideWordCard } from './word-card.js';
import { toggleTheme } from './settings.js';

/* ==========================================================
   TOP BAR, TOOLBAR & TEXT OPTIONS
   ========================================================== */

const paletteItem = $('drawer-palette');
export function openPaletteMenu() {
  const d = el.drawer.getBoundingClientRect();
  const r = paletteItem.getBoundingClientRect();
  el.paletteMenu.style.left = `${d.right + 8}px`;
  el.paletteMenu.style.top = `${clamp(r.top - 8, 72, Math.max(72, innerHeight - 560))}px`;
  paletteItem.classList.add('open');
  setOpen(el.paletteMenu, true);
}
export function closePaletteMenu() {
  paletteItem.classList.remove('open');
  setOpen(el.paletteMenu, false);
}

/* The toolbar is one bar: a circle with a single button when collapsed (the default), a pill of tools when open */
const toolBar = $('tool-bar'), toolToggle = $('btn-tools');
export function setTools(open) {
  toolBar.classList.toggle('open', open);
  const label = open ? 'Hide tools' : 'Show tools';
  toolToggle.setAttribute('aria-expanded', String(open));
  toolToggle.setAttribute('aria-label', label);
  toolToggle.dataset.tip = label;
  if (!open) { setOpen(el.flyout, false); setOpen(el.popupsFlyout, false); }
}

export function initToolbar() {
  el.menuBtn.addEventListener('click', () => {
    const open = !el.drawer.classList.contains('open');
    closePopovers(el.drawer);
    setOpen(el.drawer, open);
    if (!open) closePaletteMenu();
  });

  paletteItem.addEventListener('mouseenter', openPaletteMenu);

  el.drawer.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'palette') {
      openPaletteMenu();
    } else if (action === 'settings') {
      closePaletteMenu();
      setView('settings');
    } else if (action === 'about') {
      setOpen(el.drawer, false);
      closePaletteMenu();
    }
  });

  el.brandBtn.addEventListener('click', () => setView('reader'));
  el.segments.addEventListener('click', (e) => {
    const seg = e.target.closest('.segment');
    if (seg) setBook(seg.dataset.book);
  });
  el.segments.addEventListener('animationend', (e) => e.target.classList.remove('ripple-left', 'ripple-right'));

  toolToggle.addEventListener('click', () => setTools(!toolBar.classList.contains('open')));
  // Clicking anywhere outside the bar (and the flyouts that belong to it) folds it back into the circle
  document.addEventListener('pointerdown', (e) => {
    if (toolBar.classList.contains('open') && !e.target.closest('#tool-bar, #flyout, #popups-flyout')) setTools(false);
  });

  el.splitBtn.addEventListener('click', toggleSplit);
  el.meterBtn.addEventListener('click', toggleScansion);
  el.themeBtn.addEventListener('click', toggleTheme);
  for (const [btn, flyout] of [[el.textBtn, el.flyout], [el.popupsBtn, el.popupsFlyout]]) {
    btn.addEventListener('click', () => {
      const open = !flyout.classList.contains('open');
      closePopovers(flyout);
      setOpen(flyout, open);
    });
  }

  // View Options switches. The popup switches close the gloss so it reopens with the new setting;
  // the scansion switches set an attribute on <html> that the scansion CSS reads.
  function bindSwitch(btn, key, onChange = hideWordCard) {
    btn.addEventListener('click', () => {
      const on = !state.popups[key];
      state.popups[key] = on;
      btn.setAttribute('aria-checked', String(on));
      onChange(on);
    });
  }
  bindSwitch(el.swWords, 'words');
  bindSwitch(el.swNotes, 'notes');
  bindSwitch(el.swCaesura, 'caesura', (on) => { root.dataset.caesura = on ? 'on' : 'off'; });
  bindSwitch(el.swSynizesis, 'synizesis', (on) => { root.dataset.synizesis = on ? 'on' : 'off'; });

  // Close buttons inside popovers
  document.querySelectorAll('[data-close]').forEach((btn) =>
    btn.addEventListener('click', () => setOpen($(btn.dataset.close), false)));

  // Text size: each reader sets its own size when it fits its text, so only the chosen size is stored here
  el.fontSlider.addEventListener('input', () => {
    const val = parseFloat(el.fontSlider.value);
    const max = parseFloat(el.fontSlider.max);
    el.sizeSlider.style.setProperty('--pct', ((val - MIN_FONT) / (max - MIN_FONT)).toFixed(4));
    state.fontRem = val;
    fitAll();
  });

  // Handle squeezes while shared.dragging, then bounces back
  const endSliderDrag = () => el.sizeSlider.classList.remove('dragging');
  el.fontSlider.addEventListener('pointerdown', () => el.sizeSlider.classList.add('dragging'));
  el.fontSlider.addEventListener('blur', endSliderDrag);
  addEventListener('pointerup', endSliderDrag);
  addEventListener('pointercancel', endSliderDrag);

  // Each pill group writes its data-value into the CSS variable named by data-var.
  el.flyout.addEventListener('click', (e) => {
    const opt = e.target.closest('.pill-opt');
    if (!opt) return;
    const group = opt.parentElement;
    for (const b of group.children) b.classList.toggle('active', b === opt);
    root.style.setProperty(group.dataset.var, opt.dataset.value);
    fitAll(true);   // a different font or spacing changes how wide the lines are
  });
}
