import { WORKS } from './data.js';
import { el, esc, icon, root } from './dom.js';
import { activeTab, isText, state } from './state.js';
import { renderAll } from './layout.js';
import { addTab } from './tabs.js';
import { renderReader } from './reader.js';

/* ==========================================================
   SETTINGS PAGE
   ========================================================== */

export function syncSettingsChips(workKey) {
  for (const chip of el.settingsChips.children) chip.classList.toggle('active', chip.dataset.work === workKey);
}

/* ==========================================================
   COLOR PALETTES (Material 3 Expressive), each with a light and a dark set of roles:
   p primary, on on-primary, c primary container, onc on-primary-container,
   s secondary, ons on-secondary, sc secondary container, onsc on-secondary-container
   ========================================================== */
const PALETTES = {
  green: { name: 'Pine',
    light: { p: '#386A42', on: '#FFFFFF', c: '#BAF3BF', onc: '#00210B', s: '#526351', ons: '#FFFFFF', sc: '#D5E8D1', onsc: '#101F11' },
    dark:  { p: '#99D5A3', on: '#043918', c: '#20512C', onc: '#BAF3BF', s: '#B9CCB6', ons: '#243425', sc: '#3A4B3A', onsc: '#D5E8D1' } },
  red: { name: 'Coral',
    light: { p: '#8F4A50', on: '#FFFFFF', c: '#FFD9DC', onc: '#3B0812', s: '#76565A', ons: '#FFFFFF', sc: '#FFD9DC', onsc: '#2C1518' },
    dark:  { p: '#FFB2B9', on: '#561D24', c: '#723339', onc: '#FFD9DC', s: '#E5B9BD', ons: '#44292D', sc: '#5D3F43', onsc: '#FFD9DC' } },
  bluegray: { name: 'Slate',
    light: { p: '#4A5C7A', on: '#FFFFFF', c: '#D3E3FF', onc: '#001C39', s: '#565E71', ons: '#FFFFFF', sc: '#DAE2F9', onsc: '#131B2C' },
    dark:  { p: '#B3C8E8', on: '#1B2E49', c: '#334461', onc: '#D3E3FF', s: '#BEC6DC', ons: '#283041', sc: '#3F4759', onsc: '#DAE2F9' } },
  yellow: { name: 'Limoncello',
    light: { p: '#6B5F00', on: '#FFFFFF', c: '#F8E468', onc: '#201C00', s: '#656040', ons: '#FFFFFF', sc: '#ECE4C0', onsc: '#201C04' },
    dark:  { p: '#DCC84F', on: '#383100', c: '#514700', onc: '#F8E468', s: '#CFC8A5', ons: '#363116', sc: '#4D482B', onsc: '#ECE4C0' } },
  purple: { name: 'Lavender',
    light: { p: '#8241B2', on: '#FFFFFF', c: '#F0DBFF', onc: '#2C0051', s: '#7D5260', ons: '#FFFFFF', sc: '#FFD8E4', onsc: '#31111D' },
    dark:  { p: '#DEB7FF', on: '#4D0A7F', c: '#672698', onc: '#F0DBFF', s: '#EFB8C8', ons: '#492532', sc: '#633B48', onsc: '#FFD8E4' } },
  // Amber: warm and low in blue light, made for reading in dark mode
  amber: { name: 'Amber',
    light: { p: '#8F4E00', on: '#FFFFFF', c: '#FFDCC2', onc: '#2E1500', s: '#745943', ons: '#FFFFFF', sc: '#FFDCBE', onsc: '#2A1706' },
    dark:  { p: '#FFB77B', on: '#4C2700', c: '#6C3A00', onc: '#FFDCC2', s: '#E4C0A6', ons: '#422C19', sc: '#5A422D', onsc: '#FFDCBE' } }
};
const PALETTE_KEY = 'epos.palette.v1';
const THEME_KEY = 'epos.theme.v1';
let currentPalette = 'bluegray';

const rolesOf = (pal) => pal[state.theme] ?? pal.light;

export function applyPalette(key) {
  const paletteKey = PALETTES[key] ? key : 'bluegray';
  currentPalette = paletteKey;
  const pal = rolesOf(PALETTES[paletteKey]);
  const vars = {
    '--primary': pal.p, '--on-primary': pal.on, '--primary-container': pal.c, '--on-primary-container': pal.onc,
    '--secondary': pal.s, '--on-secondary': pal.ons, '--secondary-container': pal.sc, '--on-secondary-container': pal.onsc
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  for (const chip of el.paletteChips.children) chip.classList.toggle('active', chip.dataset.palette === paletteKey);
  for (const it of el.paletteMenu.children) {
    const on = it.dataset.palette === paletteKey;
    it.classList.toggle('active', on);
    it.setAttribute('aria-checked', String(on));
  }
  return paletteKey;
}

export function choosePalette(key) {
  const saved = applyPalette(key);
  try { localStorage.setItem(PALETTE_KEY, saved); } catch { /* storage unavailable */ }
}

/* The swatches show the colours of the mode that is on, so what you pick is what you get */
function renderPaletteChoices() {
  el.paletteChips.innerHTML = Object.entries(PALETTES).map(([key, p]) => {
    const pal = rolesOf(p);
    return `
    <button class="settings-chip" data-palette="${key}">
      <span class="palette-swatch"><span class="palette-dot" style="background:${pal.p}"></span><span class="palette-dot" style="background:${pal.c}"></span><span class="palette-dot" style="background:${pal.sc}"></span></span>
      <span class="settings-chip-title">${esc(p.name)}</span>
      <span class="settings-chip-sub">${esc(pal.p.toUpperCase())}</span>
    </button>`;
  }).join('');
  el.paletteMenu.innerHTML = Object.entries(PALETTES).map(([key, p]) => `
    <button class="sub-item" data-palette="${key}" role="menuitemradio" aria-checked="false">
      <span class="sub-lead"><span class="sub-dot" style="background:${rolesOf(p).p}"></span><svg class="icon sub-check"><use href="assets/icons.svg#i-check"/></svg></span>
      <span>${esc(p.name)}</span>
    </button>`).join('');
}

/* ==========================================================
   LIGHT / DARK MODE (the moon / sun button in the tool bar)
   ========================================================== */
export function applyTheme(mode) {
  state.theme = mode === 'dark' ? 'dark' : 'light';
  root.dataset.theme = state.theme;
  renderPaletteChoices();
  applyPalette(currentPalette);
  const dark = state.theme === 'dark';
  const label = dark ? 'Light Mode' : 'Dark Mode';
  el.themeBtn.setAttribute('aria-pressed', String(dark));
  el.themeBtn.dataset.tip = label;
}

export function toggleTheme() {
  const next = state.theme === 'dark' ? 'light' : 'dark';
  // The browser cross-fades one snapshot of the old page into the new one, so the colours switch in a single
  // style pass. A transition on every word and syllable instead made the switch stutter.
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !still) document.startViewTransition(() => applyTheme(next));
  else applyTheme(next);
  try { localStorage.setItem(THEME_KEY, state.theme); } catch { /* storage unavailable */ }
}

export function initSettings() {
  el.settingsChips.innerHTML = Object.entries(WORKS).map(([key, w]) => `
    <button class="settings-chip" data-work="${key}">
      <span class="settings-chip-title">${esc(w.title)}</span>
      <span class="settings-chip-sub">${esc(`${w.poet} · ${w.shortLanguage}`)}</span>
    </button>`).join('');

  el.settingsChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.settings-chip');
    if (!chip) return;
    const workKey = chip.dataset.work;
    const tab = activeTab();
    if (!isText(tab)) {
      addTab(workKey, 'I');
    } else {
      tab.work = workKey;
      tab.book = 'I';
      renderReader(tab);
      renderAll();
    }
    syncSettingsChips(workKey);
  });

  for (const container of [el.paletteChips, el.paletteMenu]) {
    container.addEventListener('click', (e) => {
      const it = e.target.closest('[data-palette]');
      if (it) choosePalette(it.dataset.palette);
    });
  }

  let savedPalette = null, savedTheme = null;
  try {
    savedPalette = localStorage.getItem(PALETTE_KEY);
    savedTheme = localStorage.getItem(THEME_KEY);
  } catch { /* storage unavailable */ }
  currentPalette = PALETTES[savedPalette] ? savedPalette : 'bluegray';
  // With no choice saved yet, start in the system's mode
  applyTheme(savedTheme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
}
