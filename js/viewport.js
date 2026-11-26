import { root } from './dom.js';

/* ==========================================================
   VIEWPORT: which layout tier the window is in, and what kind of pointer it has.
   Width decides layout; hover/pointer capability decides interactions, so a narrow
   desktop window keeps its hover cards and a touch laptop gets bigger targets.
   The media queries in styles.css use these same breakpoints: change both together.
   ========================================================== */
export const TIER_QUERIES = {
  compact: '(max-width: 599.98px)',
  medium: '(min-width: 600px) and (max-width: 1024px)'
};
const HOVER_QUERY = matchMedia('(hover: hover)');
const COARSE_QUERY = matchMedia('(pointer: coarse)');
const COMPACT_QUERY = matchMedia(TIER_QUERIES.compact);
const MOBILE_QUERY = matchMedia('(max-width: 1024px)');
const tierMedia = [COMPACT_QUERY, MOBILE_QUERY];

/* 'compact' | 'medium' | 'desktop' — no subpixel gap between 599.98px and 600px */
export const tier = () => (COMPACT_QUERY.matches ? 'compact' : MOBILE_QUERY.matches ? 'medium' : 'desktop');
export const isMobileTier = () => tier() !== 'desktop';
export const canHover = () => HOVER_QUERY.matches;
export const isCoarse = () => COARSE_QUERY.matches;

const listeners = new Set();
/* fn(next, prev) runs whenever the window crosses a tier boundary. Returns an unsubscribe function. */
export function onTierChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let current = null;
function sync() {
  const next = tier();
  if (next === current) return;
  const prev = current;
  current = next;
  root.dataset.tier = next;   // for JS-driven pieces and tests; the stylesheet uses its own media queries
  if (prev) listeners.forEach((fn) => fn(next, prev));
}

export function initViewport() {
  sync();
  tierMedia.forEach((mq) => mq.addEventListener('change', sync));
}
