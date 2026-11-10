/* ==========================================================
   LOADING INDICATOR (Material 3 Expressive style): one solid shape with no track,
   spinning clockwise while it morphs through a scalloped badge, a pentagon, an
   8-point star, a clover and a 10-point starburst. Each shape is a smooth radius
   curve r(θ) sampled at the same angles, so any two can be blended point by point;
   every curve averages the same radius, so the footprint stays the same.
   ========================================================== */
const LOADER_SHAPES = [            // [lobes, depth] terms of r(θ) = 1 + Σ depth·cos(lobes·θ)
  [[12, 0.045]],                   // 12-point scalloped badge
  [[5, 0.08], [10, 0.012]],        // rounded pentagon (the second term flattens the sides)
  [[8, 0.11], [16, -0.015]],       // 8-point star with blunt tips
  [[4, 0.17], [8, -0.035]],        // plump four-leaf clover
  [[10, 0.15], [20, -0.02]]        // deep 10-point starburst
];
const LOADER_N = 144;              // points around each shape
const LOADER_STEP = 800;           // ms per shape: a 4-second cycle
const LOADER_RADII = LOADER_SHAPES.map((terms) => Array.from({ length: LOADER_N }, (_, i) => {
  const t = (i / LOADER_N) * Math.PI * 2;
  return 1 + terms.reduce((s, [n, a]) => s + a * Math.cos(n * t), 0);
}));

/* A CSS-style cubic-bezier easing function */
export function cubicBezier(x1, y1, x2, y2) {
  const bz = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return (x) => {
    if (x <= 0 || x >= 1) return x <= 0 ? 0 : 1;
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 20; i++) {
      if (bz(t, x1, x2) < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return bz(t, y1, y2);
  };
}
const MORPH_EASE = cubicBezier(0.2, 0, 0, 1);         // fast in, long settle
const SPIN_EASE = cubicBezier(0.34, 1.4, 0.64, 1);     // the spin burst overshoots a little as the shape lands

/* A closed path through the points, smoothed into cubic Béziers (Catmull-Rom) */
export function loaderPath(radii, R) {
  const pts = radii.map((r, i) => {
    const t = (i / LOADER_N) * Math.PI * 2;
    return [R * r * Math.cos(t), R * r * Math.sin(t)];
  });
  const n = pts.length, f = (v) => v.toFixed(2);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return `${d}Z`;
}

/* The indicator element. Its animation runs until it is taken out of the page. */
export function createLoader() {
  const wrap = document.createElement('div');
  wrap.className = 'm3-loader';
  wrap.setAttribute('role', 'progressbar');
  wrap.setAttribute('aria-label', 'Loading');
  wrap.innerHTML = '<svg viewBox="-50 -50 100 100" aria-hidden="true"><path/></svg>';
  const path = wrap.querySelector('path');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const R = 40;   // the deepest shape reaches about 47 of the 50 units around the centre
  let t0 = 0;
  const frame = (now) => {
    if (!wrap.isConnected) return;
    t0 ||= now;
    const t = now - t0;
    const step = Math.floor(t / LOADER_STEP), p = (t % LOADER_STEP) / LOADER_STEP;
    const from = LOADER_RADII[step % LOADER_RADII.length], to = LOADER_RADII[(step + 1) % LOADER_RADII.length];
    const e = MORPH_EASE(p);
    path.setAttribute('d', loaderPath(from.map((r, i) => r + (to[i] - r) * e), R));
    // A slow steady spin, plus a quarter-turn burst that lands with each new shape
    if (!still) path.setAttribute('transform', `rotate(${((t * 0.045 + (step + SPIN_EASE(p)) * 90) % 360).toFixed(2)})`);
    requestAnimationFrame(frame);
  };
  path.setAttribute('d', loaderPath(LOADER_RADII[0], R));
  requestAnimationFrame(frame);
  return wrap;
}
