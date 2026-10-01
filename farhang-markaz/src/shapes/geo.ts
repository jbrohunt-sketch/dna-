// Flat-geometry helpers. Everything is generated from parameters so morphs interpolate
// parameters on identical structures — never path strings.

export type Pt = readonly [number, number];

export const rad = (d: number) => (d * Math.PI) / 180;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const polar = (cx: number, cy: number, r: number, aDeg: number): Pt => [
  cx + r * Math.cos(rad(aDeg)),
  cy + r * Math.sin(rad(aDeg)),
];

export const path = (pts: readonly Pt[], close = true) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ") + (close ? " Z" : "");

/** Insert points so no edge is longer than maxLen (needed before bending a shape). */
export const subdivide = (poly: readonly Pt[], maxLen = 6, close = true): Pt[] => {
  const out: Pt[] = [];
  const n = poly.length;
  for (let i = 0; i < (close ? n : n - 1); i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / maxLen));
    for (let k = 0; k < steps; k++) out.push([lerp(a[0], b[0], k / steps), lerp(a[1], b[1], k / steps)]);
  }
  if (!close) out.push(poly[n - 1]);
  return out;
};

/**
 * The project's key transform. A strip in warp coordinates (u along the strip, h along the
 * warp) is bent around a circle by `t` (0 = straight, 1 = closed ring). Straight ikat warp,
 * radial skirt panels and Rishtan plate segments are the same geometry at different t.
 */
export type Strip = { readonly cx: number; readonly baseY: number; readonly W: number; readonly t: number };
export const bend = (p: Pt, s: Strip): Pt => {
  const [u, h] = p;
  if (s.t < 1e-4) return [s.cx + u, s.baseY - h];
  const rho = s.W / (2 * Math.PI * s.t);
  const phi = u / rho;
  const r = rho + h;
  return [s.cx + r * Math.sin(phi), s.baseY + rho - r * Math.cos(phi)];
};
/** Centre of the ring a strip bends into at t (for placing medallions). */
export const bendCentre = (s: Strip): Pt => [s.cx, s.baseY + s.W / (2 * Math.PI * Math.max(s.t, 1e-4))];

/** Polar placement of a warp-space shape: u → arc length at rRef, h → radius from rBase. */
export const toPolar = (p: Pt, cx: number, cy: number, aDeg: number, rBase: number, rRef: number): Pt => {
  const a = aDeg + ((p[0] / rRef) * 180) / Math.PI;
  return polar(cx, cy, rBase + p[1], a);
};

/** Circle with N shallow scallops (amp as fraction of R). */
export const scallopPts = (cx: number, cy: number, R: number, N: number, amp: number, rotDeg = 0, n = 240): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 360;
    return polar(cx, cy, R * (1 + amp * Math.cos(rad((a - rotDeg) * N))), a);
  });

/** Tapered capsule along a spine (braids, arms). */
export const taper = (spine: readonly Pt[], w0: number, w1: number): Pt[] => {
  const L: Pt[] = [];
  const Rr: Pt[] = [];
  const n = spine.length;
  for (let i = 0; i < n; i++) {
    const a = spine[Math.max(0, i - 1)];
    const b = spine[Math.min(n - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    const w = lerp(w0, w1, i / (n - 1)) / 2;
    L.push([spine[i][0] - (ty / l) * w, spine[i][1] + (tx / l) * w]);
    Rr.push([spine[i][0] + (ty / l) * w, spine[i][1] - (tx / l) * w]);
  }
  // round caps
  const cap = (c: Pt, from: Pt, to: Pt, steps = 8): Pt[] => {
    const a0 = Math.atan2(from[1] - c[1], from[0] - c[0]);
    let a1 = Math.atan2(to[1] - c[1], to[0] - c[0]);
    if (a1 > a0) a1 -= Math.PI * 2;
    const r = Math.hypot(from[0] - c[0], from[1] - c[1]);
    return Array.from({ length: steps - 1 }, (_, k) => {
      const a = a0 + ((a1 - a0) * (k + 1)) / steps;
      return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)] as Pt;
    });
  };
  return [
    ...L,
    ...cap(spine[n - 1], L[n - 1], Rr[n - 1]),
    ...Rr.reverse(),
    ...cap(spine[0], Rr[Rr.length - 1], L[0]),
  ];
};
