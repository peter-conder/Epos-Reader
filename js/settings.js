import { CREDITS, LICENCE_NOTES, SOURCES, licenceUrl } from './data.js';
import { el, esc, icon, root } from './dom.js';
import { state } from './state.js';

/* ==========================================================
   SETTINGS & SOURCES PAGE: the settings, then every Source and credit (the lists live in data.js)
   ========================================================== */
const link = (url, text) => url
  ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}</a>`
  : esc(text);

function creditRow({ what, name, url, by, note, licence }) {
  return `
    <li class="src-item">
      <span class="src-what">${esc(what)}</span>
      <span class="src-body">
        <span class="src-name">${link(url, name)}${by ? `<span class="src-by">, ${esc(by)}</span>` : ''}</span>
        ${note ? `<span class="src-note">${esc(note)}</span>` : ''}
        ${licence ? `<span class="src-licence">${link(licenceUrl(licence), licence)}</span>` : ''}
      </span>
    </li>`;
}

const creditGroup = (title, sub, items) => `
  <section class="src-group">
    <h3 class="src-group-title">${esc(title)}${sub ? `<span class="src-group-sub">${esc(sub)}</span>` : ''}</h3>
    <ul class="src-list">${items.map(creditRow).join('')}</ul>
  </section>`;

function renderSources() {
  el.sourcesList.innerHTML = SOURCES.map((g) => creditGroup(g.language, g.works, g.items)).join('');
  el.licenceNotes.innerHTML = LICENCE_NOTES.map((n) => `<li>${esc(n)}</li>`).join('');
  el.creditsList.innerHTML = CREDITS.map((g) => creditGroup(g.group, '', g.items)).join('');
}

/* Open at the top, or ("About Epos Reader") at the Sources */
export function scrollSettings(toSources) {
  const view = el.viewSettings;
  if (!toSources) { view.scrollTop = 0; return; }
  view.scrollTop = el.sourcesHeading.getBoundingClientRect().top - view.getBoundingClientRect().top + view.scrollTop - 24;
}

/* ==========================================================
   COLOR PALETTES (Material 3 Expressive). Generated with @material/material-color-utilities 0.4.0:
   SchemeVibrant on its 2025 colour spec (Slate: SchemeNeutral), seeded from each palette's seed colour (Coral's
   was warmed to hue 30; the rest keep the palettes' earlier light primaries). Each has a light and a dark set of roles:
   p primary, on on-primary, c primary container, onc on-primary-container,
   s secondary, ons on-secondary, sc secondary container, onsc on-secondary-container,
   t tertiary, ont on-tertiary, tc tertiary container, ontc on-tertiary-container (Note and Bookmark chrome only),
   bg surface (the page), onbg on-surface, onv on-surface-variant, ol outline, olv outline-variant,
   c0–c4 surface containers, lowest to highest.
   The reading text stays calm, so it takes its own set, generated as SchemeTonalSpot (2025) from the same seed:
   rbg the reading pane, ron its text, rhl the long-syllable highlight and Word hover, rmk the short-syllable bar
   and other Scansion marks, rsel / ronsel a selected Word, rc / ronc the Word card (its primary container).
   ========================================================== */
const PALETTES = {
  green: { name: 'Pine', seed: '#386A42',
    light: {
      p: '#006A2F', on: '#CEFFD1', c: '#56FA88', onc: '#005B27', s: '#006943', ons: '#CAFFDD', sc: '#78FBB8', onsc: '#005E3B',
      t: '#006574', ont: '#DBF8FF', tc: '#00E0FE', ontc: '#004B57',
      bg: '#DCFFE7', onbg: '#033621', onv: '#37654C', ol: '#528166', olv: '#88B89A',
      c0: '#FFFFFF', c1: '#C6FEDA', c2: '#B9F6D0', c3: '#B0F1C9', c4: '#A6ECC2',
      rbg: '#F8FAF3', ron: '#2D342D', rhl: '#D3E8D2', rmk: '#516452', rsel: '#3C6944', ronsel: '#E9FFE7', rc: '#BCEFC0', ronc: '#2E5B37' },
    dark: {
      p: '#56FA88', on: '#005B27', c: '#15D165', onc: '#003E19', s: '#78FBB8', ons: '#005E3B', sc: '#006C45', onsc: '#E1FFEA',
      t: '#81E9FF', ont: '#005561', tc: '#00E0FE', ontc: '#004B57',
      bg: '#001208', onbg: '#C4F7D6', onv: '#86B698', ol: '#517F64', olv: '#235039',
      c0: '#000000', c1: '#00180B', c2: '#001F10', c3: '#002515', c4: '#002C1A',
      rbg: '#0B0F0B', ron: '#E0E8DC', rhl: '#2E4030', rmk: '#B7CCB6', rsel: '#AAD0AC', ronsel: '#26472C', rc: '#385A3D', ronc: '#C6EDC7' }
  },
  red: { name: 'Coral', seed: '#E2654C',
    light: {
      p: '#AD2911', on: '#FFEFEC', c: '#FF775C', onc: '#4B0600', s: '#A03741', ons: '#FFEFEF', sc: '#FFC3C4', onsc: '#85222E',
      t: '#7E3F9F', ont: '#FEEEFF', tc: '#DB95FC', ontc: '#4F0970',
      bg: '#FFF4F3', onbg: '#4D2124', onv: '#834C4E', ol: '#A26769', olv: '#DF9C9D',
      c0: '#FFFFFF', c1: '#FFEDEC', c2: '#FFE1E1', c3: '#FFDADA', c4: '#FFD2D2',
      rbg: '#FFF8F6', ron: '#3E2F2C', rhl: '#FFDAD3', rmk: '#785750', rsel: '#8C4E41', ronsel: '#FFF7F6', rc: '#FDAD9D', ronc: '#622D22' },
    dark: {
      p: '#FF8F78', on: '#610B00', c: '#FF775C', onc: '#4B0600', s: '#F87981', ons: '#4E000F', sc: '#84222E', onsc: '#FFC1C2',
      t: '#E3A8FF', ont: '#5A197B', tc: '#DB95FC', ontc: '#4F0970',
      bg: '#240306', onbg: '#FFDEDE', onv: '#DD9A9B', ol: '#A06567', olv: '#6C393C',
      c0: '#000000', c1: '#2C0509', c2: '#36090E', c3: '#3F0E13', c4: '#491218',
      rbg: '#130D0B', ron: '#F9E0DB', rhl: '#51342E', rmk: '#E7BDB4', rsel: '#F9B7A9', ronsel: '#61342A', rc: '#76453B', ronc: '#FFDBD4' }
  },
  // Slate: neutral grey-blue. SchemeNeutral (2025), not Vibrant, which would make any seed a saturated blue. Its
  // surfaces, outlines and quiet text come from SchemeTonalSpot on the same seed: Neutral's are warm (a cream page).
  // Tertiary hand-set: the scheme's hue (276°) at chroma 36, so Notes stand apart from the grey primary.
  slate: { name: 'Slate', seed: '#5B6B7F',
    light: {
      p: '#565F6B', on: '#F5F8FF', c: '#DBE3F1', onc: '#4A525E', s: '#5C5F64', ons: '#F7F9FF', sc: '#E1E2E8', onsc: '#4F5257',
      t: '#4F5B92', ont: '#FBF8FF', tc: '#D9DEFF', ontc: '#404D83',
      bg: '#F9F9FE', onbg: '#2E333A', onv: '#5A5F67', ol: '#767B83', olv: '#ADB2BB',
      c0: '#FFFFFF', c1: '#F2F3FA', c2: '#EBEEF5', c3: '#E5E8F0', c4: '#DEE3EC',
      rbg: '#F9F9FE', ron: '#2E333A', rhl: '#D6E4F7', rmk: '#536071', rsel: '#3D6288', ronsel: '#F7F9FF', rc: '#DBE3F1', ronc: '#4A525E' },
    dark: {
      p: '#BFC7D5', on: '#38414C', c: '#3F4753', onc: '#C8D1DF', s: '#9B9EA3', ons: '#1D2025', sc: '#393C40', onsc: '#BDBFC5',
      t: '#ECECFF', ont: '#47548A', tc: '#D9DEFF', ontc: '#404D83',
      bg: '#0C0E12', onbg: '#E1E6EF', onv: '#A6ABB4', ol: '#71767E', olv: '#434850',
      c0: '#000000', c1: '#101418', c2: '#161A1F', c3: '#1C2026', c4: '#21262D',
      rbg: '#0C0E12', ron: '#E1E6EF', rhl: '#303C4C', rmk: '#BAC8DB', rsel: '#AEC9EB', ronsel: '#27425E', rc: '#3F4753', ronc: '#C8D1DF' }
  },
  bluegray: { name: 'Sapphire', seed: '#4A5C7A',   // was Slate; the key stays so saved choices keep their colours
    light: {
      p: '#005BAE', on: '#EFF2FF', c: '#5FA2FF', onc: '#002349', s: '#2A56B7', ons: '#F1F2FF', sc: '#C2D0FF', onsc: '#0640A2',
      t: '#833D99', ont: '#FFEDFE', tc: '#EA9BFF', ontc: '#5A1171',
      bg: '#F6F6FF', onbg: '#202D51', onv: '#4D5A81', ol: '#69769E', olv: '#9FACD7',
      c0: '#FFFFFF', c1: '#EEF0FF', c2: '#E2E7FF', c3: '#DAE2FF', c4: '#D2DCFF',
      rbg: '#F9F9FE', ron: '#2F323A', rhl: '#D9E3F8', rmk: '#565F72', rsel: '#45608A', ronsel: '#F8F8FF', rc: '#AFCAFB', ronc: '#26426B' },
    dark: {
      p: '#7BAFFF', on: '#002E5D', c: '#5FA2FF', onc: '#002349', s: '#749AFF', ons: '#001C52', sc: '#194AAB', onsc: '#D6DEFF',
      t: '#F0B0FF', ont: '#651F7B', tc: '#EA9BFF', ontc: '#5A1171',
      bg: '#000C2D', onbg: '#DEE4FF', onv: '#9DAAD5', ol: '#67749C', olv: '#3A476C',
      c0: '#000000', c1: '#001037', c2: '#021742', c3: '#061D4B', c4: '#0A2355',
      rbg: '#0C0E12', ron: '#E2E5EF', rhl: '#323C4D', rmk: '#BDC7DC', rsel: '#B3C7ED', ronsel: '#2D4160', rc: '#3F5373', ronc: '#D6E4FF' }
  },
  yellow: { name: 'Limoncello', seed: '#6B5F00',   // tertiary hand-set: hue 292° (its Fidelity complement), Vibrant tones
    light: {
      p: '#716500', on: '#FFFFFF', c: '#FEE300', onc: '#5D5200', s: '#676800', ons: '#FFFFFF', sc: '#E7EA59', onsc: '#545500',
      t: '#6256B3', ont: '#FFFFFF', tc: '#E2DBFF', ontc: '#4E429E',
      bg: '#FFFBFF', onbg: '#393A08', onv: '#666731', ol: '#83844A', olv: '#BCBD7E',
      c0: '#FFFFFF', c1: '#FEFEB3', c2: '#F8F8A9', c3: '#F2F39F', c4: '#ECED95',
      rbg: '#FEF9ED', ron: '#353325', rhl: '#ECE3BD', rmk: '#655F41', rsel: '#6A601E', ronsel: '#FFF9E7', rc: '#F2E494', ronc: '#5C5211' },
    dark: {
      p: '#FFF2AC', on: '#665A00', c: '#FEE300', onc: '#5D5200', s: '#E7EA59', ons: '#545500', sc: '#606200', onsc: '#FDFF70',
      t: '#F1EBFF', ont: '#584CA8', tc: '#E2DBFF', ontc: '#4E429E',
      bg: '#0F0F00', onbg: '#FBFAB6', onv: '#AEAF71', ol: '#787840', olv: '#494A17',
      c0: '#000000', c1: '#141400', c2: '#1A1B00', c3: '#202100', c4: '#272700',
      rbg: '#0F0E08', ron: '#ECE5D2', rhl: '#403C21', rmk: '#CFC7A2', rsel: '#D3C78A', ronsel: '#484110', rc: '#5B5321', ronc: '#F0E4A4' }
  },
  purple: { name: 'Lavender', seed: '#8241B2',
    light: {
      p: '#842AC4', on: '#FCEEFF', c: '#C981FF', onc: '#39005D', s: '#853D98', ons: '#FFEEFD', sc: '#F6BFFF', onsc: '#6E2782',
      t: '#A03741', ont: '#FFEFEF', tc: '#FF9196', ontc: '#65081A',
      bg: '#FFF3FC', onbg: '#402446', onv: '#705176', ol: '#8D6B92', olv: '#C6A1CB',
      c0: '#FFFFFF', c1: '#FFEBFE', c2: '#FEDEFF', c3: '#FCD7FF', c4: '#FACFFF',
      rbg: '#FFF7FD', ron: '#363039', rhl: '#EEDCF5', rmk: '#685A6F', rsel: '#705483', ronsel: '#FFF6FD', rc: '#E7C5FC', ronc: '#573C6A' },
    dark: {
      p: '#D294FF', on: '#4A0077', c: '#C981FF', onc: '#39005D', s: '#E998FA', ons: '#580E6D', sc: '#6D2681', onsc: '#F6BDFF',
      t: '#FF8C92', ont: '#620518', tc: '#F87981', ontc: '#4E000F',
      bg: '#1C0323', onbg: '#FDDBFF', onv: '#C49FC9', ol: '#8B6A91', olv: '#5B3D61',
      c0: '#000000', c1: '#23062B', c2: '#2B0B34', c3: '#33103C', c4: '#3B1545',
      rbg: '#100D11', ron: '#EDE2EE', rhl: '#43374A', rmk: '#D2C1D9', rsel: '#D8BDE7', ronsel: '#4C385B', rc: '#604A6E', ronc: '#F3DBFF' }
  },
  amber: { name: 'Amber', seed: '#8F4E00',
    light: {
      p: '#8B4B00', on: '#FFF0E6', c: '#FE8F00', onc: '#462300', s: '#825000', ons: '#FFF0E3', sc: '#FFC787', onsc: '#663E00',
      t: '#6E5A00', ont: '#FFF2D0', tc: '#FFD73E', ontc: '#5C4B00',
      bg: '#FFF5ED', onbg: '#452800', onv: '#795426', ol: '#976F3E', olv: '#D3A56E',
      c0: '#FFFFFF', c1: '#FFEEDE', c2: '#FFE4C8', c3: '#FFDDB9', c4: '#FFD6A9',
      rbg: '#FFF8F5', ron: '#3C3026', rhl: '#FFDCC2', rmk: '#745A44', rsel: '#855426', ronsel: '#FFF7F4', rc: '#F7B67F', ronc: '#5E3407' },
    dark: {
      p: '#FFA44E', on: '#552C00', c: '#FE8F00', onc: '#462300', s: '#FAA324', ons: '#4D2E00', sc: '#865300', onsc: '#FFF6F0',
      t: '#FFE79B', ont: '#665300', tc: '#FFD73E', ontc: '#5C4B00',
      bg: '#180B00', onbg: '#FFE0C1', onv: '#D1A36D', ol: '#966E3D', olv: '#624114',
      c0: '#000000', c1: '#1F1000', c2: '#281500', c3: '#301B00', c4: '#392000',
      rbg: '#130D09', ron: '#F7E2D3', rhl: '#4D3723', rmk: '#E3C0A5', rsel: '#F2BC8F', ronsel: '#5C3816', rc: '#714A26', ronc: '#FFDDC3' }
  }
};
const PALETTE_KEY = 'epos.palette.v1';
const THEME_KEY = 'epos.theme.v1';
let currentPalette = 'slate';

const rolesOf = (pal) => pal[state.theme] ?? pal.light;

export function applyPalette(key) {
  const paletteKey = PALETTES[key] ? key : 'slate';
  currentPalette = paletteKey;
  const pal = rolesOf(PALETTES[paletteKey]);
  const vars = {
    '--primary': pal.p, '--on-primary': pal.on, '--primary-container': pal.c, '--on-primary-container': pal.onc,
    '--secondary': pal.s, '--on-secondary': pal.ons, '--secondary-container': pal.sc, '--on-secondary-container': pal.onsc,
    '--tertiary': pal.t, '--on-tertiary': pal.ont, '--tertiary-container': pal.tc, '--on-tertiary-container': pal.ontc,
    '--page': pal.bg, '--on-surface': pal.onbg, '--on-surface-variant': pal.onv, '--outline': pal.ol, '--outline-variant': pal.olv,
    '--surface-container-lowest': pal.c0, '--surface-container-low': pal.c1, '--surface-container': pal.c2,
    '--surface-container-high': pal.c3, '--surface-container-highest': pal.c4,
    '--read-surface': pal.rbg, '--read-text': pal.ron, '--read-hl': pal.rhl, '--read-mk': pal.rmk,
    '--read-sel': pal.rsel, '--on-read-sel': pal.ronsel, '--read-c': pal.rc, '--on-read-c': pal.ronc
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  for (const it of [...el.paletteMenu.children, ...el.drawerSwatches.children]) {
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

/* The menus' swatches show the colours of the mode that is on, so what you pick is what you get */
function renderPaletteChoices() {
  // The swatches, on the phone menu and the desktop submenu alike: each the palette's primary over its container colour
  el.drawerSwatches.innerHTML = Object.entries(PALETTES).map(([key, p]) => {
    const pal = rolesOf(p);
    return `<button class="drawer-swatch" data-palette="${key}" role="radio" aria-checked="false" aria-label="${esc(p.name)}"
      style="--sw-a:${pal.p}; --sw-b:${pal.c}"><span class="sw-check">${icon('check')}</span></button>`;
  }).join('');
  el.paletteMenu.innerHTML = Object.entries(PALETTES).map(([key, p]) => `
    <button class="sub-item" data-palette="${key}" role="menuitemradio" aria-checked="false">
      <span class="sub-lead"><span class="sub-dot" style="--sw-a:${rolesOf(p).p}; --sw-b:${rolesOf(p).c}"></span><svg class="icon sub-check"><use href="assets/icons.svg#i-check"/></svg></span>
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
  el.swTheme.setAttribute('aria-checked', String(dark));
  el.themeBtn.dataset.tip = label;
}

export function toggleTheme() {
  const next = state.theme === 'dark' ? 'light' : 'dark';
  // The browser cross-fades one snapshot of the old page into the new one, so the colours switch in a single
  // style pass. A transition on every word and syllable instead made the switch stutter.
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !still) document.startViewTransition(() => applyTheme(next));
  else applyTheme(next);
  // Save `next`, not state.theme: a view transition calls applyTheme later, so state.theme is still the old mode here
  try { localStorage.setItem(THEME_KEY, next); } catch { /* storage unavailable */ }
}

export function initSettings() {
  renderSources();

  for (const container of [el.paletteMenu, el.drawerSwatches]) {
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
  currentPalette = PALETTES[savedPalette] ? savedPalette : 'slate';
  // With no choice saved yet, start in the system's mode
  applyTheme(savedTheme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
}
