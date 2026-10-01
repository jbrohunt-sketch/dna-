import React from "react";
import { color } from "../design/tokens";
import { bend, path, subdivide, type Pt, type Strip } from "./geo";

// Khan-atlas (Margilan, register R5) abstraction: stepped FLAMES tapering at both ends,
// stacked tip-to-base along the warp so each column reads as a continuous zigzag.
// Steps = bundle tying; misregistration = whole-step offsets. Colours are stylisation.

/**
 * Flame ↔ bodom in warp space: base at h=0, tip at h=H, max width W.
 * smooth = 0 → stepped ikat flame · smooth = 1 → smooth almond leaf (bodom).
 * Same vertex count at every `smooth`, so the two can morph. The flame/bodom relation is a
 * formal rhyme between pointed-oval shapes — not a claim that one derives from the other.
 */
export const flame = (W: number, H: number, steps = 5, smooth = 0, samples = 48): Pt[] => {
  const prof = (t: number) =>
    t < 0.34 ? 0.12 + 0.88 * Math.sin((t / 0.34) * (Math.PI / 2)) : Math.pow(Math.max(0, (1 - t) / 0.66), 0.9);
  const left: Pt[] = [];
  for (let k = 0; k <= samples; k++) {
    const t = k / samples;
    const q = Math.min(steps - 1, Math.floor(t * steps));
    const stepped = prof((q + 0.5) / steps);
    const curved = prof(t);
    left.push([-(W / 2) * (stepped + (curved - stepped) * smooth), H * t]);
  }
  left[0] = [-(W / 2) * 0.12 * smooth, 0];
  left[samples] = [0, H];
  const right = left.slice(0, samples).map(([u, h]) => [-u, h] as Pt).reverse();
  return [...left, ...right];
};

const shift = (poly: readonly Pt[], du: number, dh: number): Pt[] => poly.map(([u, h]) => [u + du, h + dh]);

export type ColumnSpec = { readonly ground: string; readonly outer: string; readonly core: string };

/** One warp column: ground band + flames stacked tip-to-base. Returned in warp space. */
export const columnShapes = (
  u0: number,
  colW: number,
  H: number,
  spec: ColumnSpec,
  flames: number,
  offsetSteps = 0,
  smooth = 0,
  ground = true,
): { d: Pt[]; fill: string }[] => {
  const out: { d: Pt[]; fill: string }[] = ground
    ? [{ d: [[u0, 0], [u0 + colW, 0], [u0 + colW, H], [u0, H]], fill: spec.ground }]
    : [];
  const fh = H / flames;
  const off = (offsetSteps * fh) / 5;
  for (let i = -1; i <= flames; i++) {
    const base = i * fh + off;
    if (base < -0.01 || base + fh > H + 0.01) continue;
    out.push({ d: shift(flame(colW * 0.86, fh, 5, smooth), u0 + colW / 2, base), fill: spec.outer });
    out.push({ d: shift(flame(colW * 0.36, fh * 0.56, 5, smooth), u0 + colW / 2, base + fh * 0.16), fill: spec.core });
  }
  return out;
};

// Linear ikat: three-column cycle; the ishkor column carries atlas green (stylisation).
export const COLUMN_SPECS: ColumnSpec[] = [
  { ground: color.cobalt, outer: color.red, core: color.milk },
  { ground: color.sky, outer: color.milk, core: color.cobalt },
  { ground: color.cobalt, outer: color.ishkor, core: color.milk },
];

/** A strip of ikat columns bent by `strip.t` (0 straight warp … 1 closed ring). */
export const IkatStrip: React.FC<{
  readonly strip: Strip;
  readonly columns: number;
  readonly H: number;
  readonly flames?: number;
  readonly misregister?: boolean;
  readonly specs?: ColumnSpec[];
  readonly centreY?: number;
  readonly smooth?: number;
  readonly dividers?: string;
  readonly dividerWidth?: number;
}> = ({ strip, columns, H, flames = 2, misregister = false, specs = COLUMN_SPECS, centreY, smooth = 0, dividers, dividerWidth = 3 }) => {
  const colW = strip.W / columns;
  const shapes = Array.from({ length: columns }, (_, i) =>
    columnShapes(-strip.W / 2 + i * colW, colW, H, specs[i % specs.length], flames, misregister ? (i % 3) - 1 : 0, smooth),
  ).flat();
  const bent = shapes.map((s) => ({ fill: s.fill, pts: subdivide(s.d, 5).map((p) => bend(p, strip)) }));
  const divs = dividers
    ? Array.from({ length: columns }, (_, i) => {
        const u = -strip.W / 2 + i * colW;
        return [bend([u, 0], strip), bend([u, H], strip)] as const;
      })
    : [];
  let dx = 0;
  let dy = 0;
  if (centreY !== undefined) {
    const all = bent.flatMap((b) => b.pts);
    const xs = all.map((p) => p[0]);
    const ys = all.map((p) => p[1]);
    dx = strip.cx - (Math.min(...xs) + Math.max(...xs)) / 2;
    dy = centreY - (Math.min(...ys) + Math.max(...ys)) / 2;
  }
  return (
    <g transform={`translate(${dx} ${dy})`}>
      {bent.map((b, i) => (
        <path key={i} d={path(b.pts)} fill={b.fill} />
      ))}
      {divs.map(([p0, p1], i) => (
        <line key={`d${i}`} x1={p0[0]} y1={p0[1]} x2={p1[0]} y2={p1[1]} stroke={dividers} strokeWidth={dividerWidth} />
      ))}
    </g>
  );
};
