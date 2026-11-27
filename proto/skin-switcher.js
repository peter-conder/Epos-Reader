/* PROTOTYPE: design-language skin switcher. Throwaway code; see proto/README.md.

   A skin is one stylesheet in proto/skins/<name>.css, layered over css/styles.css. It re-sets the tokens and
   adds a few targeted overrides; it never edits the real stylesheet.

   Choose one with ?skin=<name> (or ?skin=default to turn it off), or with the chip in the bottom-left corner.
   The choice is remembered in localStorage, so reloading or opening a Book keeps it.

   Loaded as a classic (blocking) script in <head>, so the skin is on before the first paint. */
(() => {
  const SKINS = {
    default: { label: 'Default' },
    codex: {
      label: 'Codex',
      fonts: 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap'
    },
    agora: {
      label: 'Agora',
      fonts: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;0,7..72,700;1,7..72,400&display=swap'
    }
  };
  const KEY = 'epos.proto.skin';
  const html = document.documentElement;

  const read = () => {
    const fromUrl = new URLSearchParams(location.search).get('skin');
    if (fromUrl) return fromUrl;
    try { return localStorage.getItem(KEY); } catch { return null; }
  };

  function link(id, href) {
    let l = document.getElementById(id);
    if (!href) { l?.remove(); return null; }
    if (!l) { l = document.createElement('link'); l.id = id; l.rel = 'stylesheet'; document.head.append(l); }
    if (l.getAttribute('href') !== href) l.href = href;
    return l;
  }

  function apply(name) {
    const key = SKINS[name] ? name : 'default';
    const skin = SKINS[key];
    if (key === 'default') delete html.dataset.skin; else html.dataset.skin = key;
    link('proto-skin-fonts', skin.fonts);
    const sheet = link('proto-skin', key === 'default' ? null : `proto/skins/${key}.css`);
    try { localStorage.setItem(KEY, key); } catch { /* storage unavailable */ }
    // The reader fits its Lines to the pane (fit.js refits on font loads); nudge a refit once the sheet is in too
    const refit = () => document.fonts.ready.then(() => dispatchEvent(new Event('resize')));
    if (sheet) sheet.addEventListener('load', refit, { once: true }); else refit();
    for (const b of document.querySelectorAll('#proto-skin-chip button')) b.setAttribute('aria-pressed', String(b.dataset.skin === key));
    return key;
  }

  apply(read());

  // The chip: one button per skin, fixed bottom-left, above the app's own chrome
  addEventListener('DOMContentLoaded', () => {
    const chip = document.createElement('div');
    chip.id = 'proto-skin-chip';
    chip.setAttribute('role', 'group');
    chip.setAttribute('aria-label', 'Prototype skin');
    chip.innerHTML = Object.entries(SKINS)
      .map(([k, s]) => `<button type="button" data-skin="${k}">${s.label}</button>`).join('');
    const style = document.createElement('style');
    style.textContent = `
      #proto-skin-chip { position: fixed; left: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); z-index: 9999;
        display: flex; gap: 2px; padding: 3px; border-radius: 999px; background: rgba(20,20,20,.82);
        font: 500 12px/1 system-ui, sans-serif; box-shadow: 0 4px 14px rgba(0,0,0,.25); }
      #proto-skin-chip button { all: unset; cursor: pointer; padding: 7px 11px; border-radius: 999px; color: #ddd; }
      #proto-skin-chip button[aria-pressed="true"] { background: #fff; color: #111; }
      @media (max-width: 1024px) { #proto-skin-chip { bottom: calc(var(--bar-room, 76px) + 4px); }
        body:has(.word-card.visible) #proto-skin-chip { opacity: 0; pointer-events: none; } }
      @media print { #proto-skin-chip { display: none; } }`;
    document.head.append(style);
    document.body.append(chip);
    chip.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-skin]');
      if (!b) return;
      const key = apply(b.dataset.skin);
      const url = new URL(location.href);
      url.searchParams.set('skin', key);
      history.replaceState(history.state, '', url);
    });
    apply(html.dataset.skin ?? 'default');
  });
})();
