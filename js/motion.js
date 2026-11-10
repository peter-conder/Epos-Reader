import { $, el } from './dom.js';
import { groupOf } from './state.js';

/* ---- Pane motion helpers ---- */
export const SPRING = 'cubic-bezier(0.3, 0.7, 0.4, 1)';

/* Split open/close: flat, side-to-side motion with no scaling, tilt or shadow. Fast out of the gate with a long,
   cushioned settle and no overshoot. Every part shares one duration so the panes land on the same frame. */
export const EMPHASIZED = 'cubic-bezier(0.2, 0, 0, 1)';
const TRAILING = 'cubic-bezier(0.3, 0, 0, 1)';   // the entering pane starts a touch later, so it trails the edge
export const PANE_DUR = 500;

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
  g.classList.remove('is-active', 'drag-live');
  Object.assign(g.style, {
    position: 'absolute', left: `${rect.left - m.left}px`, top: `${rect.top - m.top}px`,
    width: `${rect.width}px`, height: `${rect.height}px`,
    margin: '0', flex: 'none', order: '0', transform: 'none', filter: 'none',
    pointerEvents: 'none', zIndex: '30', transition: 'none'
  });
  el.main.append(g);
  const src = view.querySelectorAll('.pane'), dst = g.querySelectorAll('.pane');
  src.forEach((pn, i) => {
    if (!dst[i]) return;
    dst[i].scrollTop = pn.scrollTop;
    dst[i].style.maxWidth = getComputedStyle(pn).maxWidth;   // outside #panes the split-view width rule no longer applies
  });
  const btn = view.querySelector('.pane-close'), gbtn = g.querySelector('.pane-close');
  if (btn && gbtn) gbtn.style.display = getComputedStyle(btn).display;
  return g;
}

/* A lone pane closing: a small swell, then it bouncily shrinks away (dir: -1 left edge, 1 right edge, 0 centre) */
export function shrinkAway(ghost, dir) {
  ghost.style.transformOrigin = dir < 0 ? 'left center' : dir > 0 ? 'right center' : 'center';
  ghost.animate([
    { transform: 'scale(1)', opacity: 1, offset: 0, easing: SPRING },
    { transform: 'scale(1.045)', opacity: 1, offset: 0.24, easing: 'cubic-bezier(0.55, 0, 0.85, 0.4)' },
    { transform: 'scale(0.5)', opacity: 1, offset: 0.7, easing: 'ease-in' },
    { transform: 'scale(0)', opacity: 0, offset: 1 }
  ], { duration: 520, easing: 'linear' }).onfinish = () => ghost.remove();
}

/* ---- Split open / close ----
   While one runs, #panes has .morphing (no CSS transitions), the pane that stays is taken out of flex sizing
   and its width is animated directly, so its corners, and the X pinned to them, move with its edge. */
let morph = null;
const widthOf = (n) => n.getBoundingClientRect().width;

/* Jump the running open/close to its end state (a new split change is about to start) */
export function settleMorph() { morph?.cleanup(); }
export const isMorphing = (view) => !!morph?.views.includes(view);

function runMorph(views, anims, done) {
  const m = {
    views,
    cleanup() {
      if (morph !== m) return;
      morph = null;
      done();
      anims.forEach((a) => a.cancel());
      void el.panes.offsetWidth;            // the panes take their resting sizes before transitions come back
      el.panes.classList.remove('morphing');
    }
  };
  morph = m;
  Promise.all(anims.map((a) => a.finished)).then(() => m.cleanup(), () => {});
}

// The staying pane's resting flex (renderView keeps it in data-flex while the pane is morphing)
const restoreStay = (view) => Object.assign(view.style, { flex: view.dataset.flex ?? '', width: '', marginLeft: '' });

/* Single → split. Call before the layout changes (it records where the open pane is now); the returned
   function is called once the pair is laid out, with the joining view and its side (-1 left, 1 right). */
export function beginSplitOpen(stay) {
  settleMorph();
  const pane = stay.querySelector('.pane-original');
  const from = { w: widthOf(stay), pw: pane ? widthOf(pane) : 0 };
  if (!from.w) return null;
  el.panes.classList.add('morphing');
  return (joined, dir) => {
    const P = el.panes.getBoundingClientRect();
    const dv = $('pair-divider');
    const jr = joined.getBoundingClientRect(), dr = dv.getBoundingClientRect();
    const to = { w: widthOf(stay), pw: pane ? widthOf(pane) : 0 };
    // The newcomer and the divider sit at their resting spots while the open pane alone resizes in the flex row
    const pin = (n, r) => Object.assign(n.style, { position: 'absolute', top: '0', left: `${r.left - P.left}px`, width: `${r.width}px`, height: '100%' });
    pin(joined, jr);
    pin(dv, dr);
    Object.assign(stay.style, { flex: 'none', marginLeft: dir < 0 ? 'auto' : '' });   // on the right, its right edge stays put

    const opts = { duration: PANE_DUR, easing: EMPHASIZED, fill: 'both' };
    const anims = [
      stay.animate({ width: [`${from.w}px`, `${to.w}px`] }, opts),
      joined.animate({ transform: [`translateX(${dir * (jr.width + dr.width)}px)`, 'none'] }, { ...opts, easing: TRAILING }),
      dv.animate({ opacity: [0, 1] }, { duration: PANE_DUR * 0.45, delay: PANE_DUR * 0.55, easing: 'ease-out', fill: 'both' })
    ];
    if (pane) anims.push(pane.animate({ maxWidth: [`${from.pw}px`, `${to.pw}px`] }, opts));
    runMorph([stay, joined], anims, () => {
      for (const n of [joined, dv]) Object.assign(n.style, { position: '', top: '', left: '', width: '', height: '' });
      restoreStay(stay);
    });
  };
}

/* Split → single. Call while `tab` is still on screen (ghostRect: where it is drawn, if it was dragged);
   the returned function is called once the layout no longer shows it. A lone pane just shrinks away. */
export function beginSplitClose(tab, ghostRect) {
  const v = tab.view;
  if (!v || v.hidden || el.panes.hidden) return null;
  const r = ghostRect ?? v.getBoundingClientRect();
  if (!r.width) return null;
  const g = groupOf(tab);
  const partner = g.find((t) => t !== tab);
  if (g.length !== 2 || !partner || partner.view.hidden) { shrinkAway(makeGhost(v, r), 0); return null; }

  settleMorph();
  const dir = g[0] === tab ? -1 : 1;   // the side it leaves by
  const stay = partner.view, pane = stay.querySelector('.pane-original');
  const from = { w: widthOf(stay), pw: pane ? widthOf(pane) : 0 };
  const ghost = makeGhost(v, r);
  const dv = $('pair-divider');
  const dvGhost = makeGhost(dv, dv.getBoundingClientRect());
  dvGhost.style.display = 'flex';      // outside #panes the divider's own rule would hide it

  return () => {
    el.panes.classList.add('morphing');
    const m = el.main.getBoundingClientRect();
    const live = !stay.hidden && el.panes.dataset.count === '1';
    const to = live ? { w: widthOf(stay), pw: pane ? widthOf(pane) : 0 } : from;
    // The leaving pane moves exactly as far as the staying edge does (1:1), or at least far enough to be gone
    const off = dir > 0 ? m.right - r.left : r.right - m.left;
    const travel = dir * Math.max(to.w - from.w, off);

    const opts = { duration: PANE_DUR, easing: EMPHASIZED, fill: 'both' };
    const slide = { transform: ['none', `translateX(${travel}px)`] };
    const anims = [
      ghost.animate(slide, opts),
      dvGhost.animate(slide, opts),
      dvGhost.animate({ opacity: [1, 0] }, { duration: PANE_DUR * 0.4, easing: 'ease-out', fill: 'both' })
    ];
    if (live) {
      Object.assign(stay.style, { flex: 'none', marginLeft: dir < 0 ? 'auto' : '' });   // the far edge stays anchored
      anims.push(stay.animate({ width: [`${from.w}px`, `${to.w}px`] }, opts));
      if (pane) anims.push(pane.animate({ maxWidth: [`${from.pw}px`, `${to.pw}px`] }, opts));
    }
    runMorph(live ? [stay] : [], anims, () => {
      ghost.remove();
      dvGhost.remove();
      if (live) restoreStay(stay);
    });
  };
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
