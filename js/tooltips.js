import { $, clamp } from './dom.js';

export function initTooltips() {
  /* Hover tips: any element with data-tip gets a small popup in the style of the tab hover card */
  (() => {
    const tip = $('tip');
    let timer = 0, current = null, px = 0, py = 0;
    const FROM = { left: 'translateX(6px)', right: 'translateX(-6px)', top: 'translateY(6px)', bottom: 'translateY(-6px)', pointer: 'translateY(4px)' };

    function hide() {
      clearTimeout(timer);
      current = null;
      tip.classList.remove('show');
    }
    function show(target) {
      tip.textContent = target.dataset.tip;
      const r = target.getBoundingClientRect();
      const w = tip.offsetWidth, h = tip.offsetHeight;
      let side = target.dataset.tipSide
        || (target.closest('.toolbar') ? 'left' : target.closest('.sidebar') ? 'right' : target.closest('.top-bar') ? 'bottom' : 'top');
      if (r.height > 200 || r.width > 400) side = 'pointer';   // long handles: follow the cursor instead
      let x, y;
      if (side === 'left') { x = r.left - w - 10; y = r.top + r.height / 2 - h / 2; }
      else if (side === 'right') { x = r.right + 10; y = r.top + r.height / 2 - h / 2; }
      else if (side === 'bottom') { x = r.left + r.width / 2 - w / 2; y = r.bottom + 8; }
      else if (side === 'pointer') { x = px + 12; y = py + 18; }
      else { x = r.left + r.width / 2 - w / 2; y = r.top - h - 8; }
      tip.style.left = `${clamp(x, 8, innerWidth - w - 8)}px`;
      tip.style.top = `${clamp(y, 8, innerHeight - h - 8)}px`;
      tip.style.setProperty('--from', FROM[side]);
      tip.classList.add('show');
    }

    document.addEventListener('pointerover', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      px = e.clientX; py = e.clientY;
      const target = e.target.closest?.('[data-tip]');
      if (target === current) return;
      hide();
      if (!target) return;
      current = target;
      timer = setTimeout(() => show(target), 350);
    });
    // The cursor position is only needed for long handles, so it is tracked only while one is hovered
    document.addEventListener('pointermove', (e) => { if (current) { px = e.clientX; py = e.clientY; } }, { passive: true });
    document.addEventListener('pointerdown', hide, true);
    document.addEventListener('scroll', hide, true);
    addEventListener('blur', hide);
  })();
}
