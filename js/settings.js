import { WORKS } from './data.js';
import { el, esc, icon, root } from './dom.js';
import { activeTab, isText } from './state.js';
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
   COLOR PALETTES (Material 3 Expressive)
   ========================================================== */
const PALETTES = {
  green: { name: 'Pine', p: '#4E6543', on: '#FFFFFF', c: '#CFEBC0', onc: '#0C2006', s: '#54634D', sc: '#D7E8CE', onsc: '#121F0E' },
  red: { name: 'Coral', p: '#8C4A56', on: '#FFFFFF', c: '#FFD9DF', onc: '#3A0715', s: '#75565B', sc: '#FFD9DF', onsc: '#2B1519' },
  bluegray: { name: 'Slate', p: '#505F6E', on: '#FFFFFF', c: '#D5E4F7', onc: '#0C1D29', s: '#555F68', sc: '#D9E3ED', onsc: '#121C23' },
  yellow: { name: 'Golden', p: '#695F10', on: '#FFFFFF', c: '#F4E489', onc: '#201C00', s: '#635F41', sc: '#EAE3BD', onsc: '#1F1C05' },
  purple: { name: 'Lavender', p: '#7D33CF', on: '#FFFFFF', c: '#EADDFF', onc: '#24005B', s: '#625B71', sc: '#E8DEF8', onsc: '#1E192B' }
};
const PALETTE_KEY = 'epos.palette.v1';

export function applyPalette(key) {
  const paletteKey = PALETTES[key] ? key : 'bluegray';
  const pal = PALETTES[paletteKey];
  const vars = {
    '--primary': pal.p, '--on-primary': pal.on, '--primary-container': pal.c, '--on-primary-container': pal.onc,
    '--secondary': pal.s, '--secondary-container': pal.sc, '--on-secondary-container': pal.onsc
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

  el.paletteChips.innerHTML = Object.entries(PALETTES).map(([key, pal]) => `
    <button class="settings-chip" data-palette="${key}">
      <span class="palette-swatch"><span class="palette-dot" style="background:${pal.p}"></span><span class="palette-dot" style="background:${pal.c}"></span><span class="palette-dot" style="background:${pal.sc}"></span></span>
      <span class="settings-chip-title">${esc(pal.name)}</span>
      <span class="settings-chip-sub">${esc(pal.p.toUpperCase())}</span>
    </button>`).join('');

  el.paletteMenu.innerHTML = Object.entries(PALETTES).map(([key, pal]) => `
    <button class="sub-item" data-palette="${key}" role="menuitemradio" aria-checked="false">
      <span class="sub-lead"><span class="sub-dot" style="background:${pal.p}"></span><svg class="icon sub-check"><use href="assets/icons.svg#i-check"/></svg></span>
      <span>${esc(pal.name)}</span>
    </button>`).join('');

  for (const container of [el.paletteChips, el.paletteMenu]) {
    container.addEventListener('click', (e) => {
      const it = e.target.closest('[data-palette]');
      if (it) choosePalette(it.dataset.palette);
    });
  }

  let savedPalette = null;
  try { savedPalette = localStorage.getItem(PALETTE_KEY); } catch { /* storage unavailable */ }
  applyPalette(savedPalette || 'bluegray');
}
