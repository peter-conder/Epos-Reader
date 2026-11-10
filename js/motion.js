import { el } from './dom.js';
import { groupOf } from './state.js';

/* ---- Pane motion helpers ---- */
export const SPRING = 'cubic-bezier(0.3, 0.7, 0.4, 1)';

// How long panes take to spring to their new widths; set per event, then cleared
let growTimer = 0;
export function growDur(ms) {
  el.panes.style.setProperty('--grow-dur', `${ms}ms`);
  clearTimeout(growTimer);
  growTimer = setTimeout(() => el.panes.style.removeProperty('--grow-dur'), ms + 120);
}

export function playEnter(view, dir) {
  view.animate([
    { opacity: 0, transform: `translateX(${dir * 70}px) scale(0.82)`, offset: 0, easing: SPRING },
    { opacity: 1, transform: `translateX(${-dir * 10}px) scale(1.035)`, offset: 0.5, easing: SPRING },
    { transform: `translateX(${dir * 4}px) scale(0.99)`, offset: 0.72, easing: SPRING },
    { transform: `translateX(${-dir * 1.5}px) scale(1.004)`, offset: 0.88, easing: SPRING },
    { transform: 'none', offset: 1 }
  ], { duration: 640, easing: 'linear' });
}

export function playPop(view) {
  view.animate([
    { opacity: 0, transform: 'translateY(12px) scale(0.93)', offset: 0, easing: SPRING },
    { opacity: 1, transform: 'translateY(-3px) scale(1.02)', offset: 0.5, easing: SPRING },
    { transform: 'scale(0.994)', offset: 0.76, easing: SPRING },
    { transform: 'none', offset: 1 }
  ], { duration: 470, easing: 'linear' });
}

/* A frozen copy of a pane, clipped inside the main area, so it can animate out after its tab is gone */
export function makeGhost(view, rect) {
  const m = el.main.getBoundingClientRect();
  const g = view.cloneNode(true);
  g.removeAttribute('id');
  g.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  g.hidden = false;
  g.classList.remove('is-active');
  Object.assign(g.style, {
    position: 'absolute', left: `${rect.left - m.left}px`, top: `${rect.top - m.top}px`,
    width: `${rect.width}px`, height: `${rect.height}px`,
    margin: '0', flex: 'none', order: '0', transform: 'none',
    pointerEvents: 'none', zIndex: '30', transition: 'none'
  });
  el.main.append(g);
  const src = view.querySelectorAll('.pane'), dst = g.querySelectorAll('.pane');
  src.forEach((pn, i) => { if (dst[i]) dst[i].scrollTop = pn.scrollTop; });
  return g;
}

/* Closing a pane: it shrinks away toward its own side */
export function playExit(tab) {
  const v = tab.view;
  if (!v || v.hidden || el.panes.hidden) return;
  const r = v.getBoundingClientRect();
  if (!r.width) return;
  const g = groupOf(tab);
  const dir = g.length === 2 ? (g[0] === tab ? -1 : 1) : 0;
  shrinkAway(makeGhost(v, r), dir);
}

/* Every pane closes the same way: a small swell, then it bouncily shrinks away into the edge it sat against */
export function shrinkAway(ghost, dir) {
  ghost.style.transformOrigin = dir < 0 ? 'left center' : dir > 0 ? 'right center' : 'center';
  ghost.animate([
    { transform: 'scale(1)', opacity: 1, offset: 0, easing: SPRING },
    { transform: 'scale(1.045)', opacity: 1, offset: 0.24, easing: 'cubic-bezier(0.55, 0, 0.85, 0.4)' },
    { transform: 'scale(0.5)', opacity: 1, offset: 0.7, easing: 'ease-in' },
    { transform: 'scale(0)', opacity: 0, offset: 1 }
  ], { duration: 520, easing: 'linear' }).onfinish = () => ghost.remove();
}

/* The English pane closing: same shrink, run on a frozen copy because the real pane is hidden at once */
export function playTranslationExit(tab) {
  const ui = tab.ui;
  if (!ui || ui.root.hidden || el.panes.hidden) return;
  const pane = ui.paneTranslation;
  const r = pane.getBoundingClientRect();
  if (!r.width) return;
  const ghost = makeGhost(pane, r);
  ghost.style.display = 'block';
  ghost.classList.remove('squash', 'snap-target');
  const cs = getComputedStyle(ui.root);
  for (const name of ['--reading-font-size', '--reading-trans-font-size']) ghost.style.setProperty(name, cs.getPropertyValue(name));
  ghost.scrollTop = pane.scrollTop;
  shrinkAway(ghost, 1);
}
