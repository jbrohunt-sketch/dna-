import React from "react";
import { color } from "../design/tokens";
import { bend, path, subdivide, type Pt, type Strip } from "./geo";

// Khan-atlas (Margilan) abstraction: stepped FLAME columns running along the warp.
// Steps come from resist-tying bundles; misregistration = whole-step offsets, never blur.

/** Stepped flame in warp space: base at h=0, tip at h=H, max width W. */
export const flame = (W: number, H: number, steps = 4): Pt[] => {
  const prof = (t: number) => (t < 0.32 ? 0.35 + 0.65 * (t / 0.32) : Math.pow((1 - t) / 0.68, 0.85));
  const left: Pt[] = [];
  for (let k = 0; k < steps; k++) {
    const hw = (W / 2) * prof((k + 0.5) / steps);
    left.push([-hw, (H * k) / steps], [-hw, (H * (k + 1)) / steps]);
  }
  const right = left.map(([u, h]) => [-u, h] as Pt).reverse();
  return [...left, [0, H], ...right];
};

const shift = (poly: readonly Pt[], du: number, dh: number): Pt[] => poly.map(([u, h]) => [u + du, h + dh]);

export type ColumnSpec = { readonly ground: string; readonly outer: string; readonly core: string };

/** One warp column: ground band + stacked flames (outer + core). Returned in warp space. */
export const columnShapes = (
  u0: number,
  colW: number,
  H: number,
  spec: ColumnSpec,
  flames: number,
  offsetSteps = 0,
): { d: Pt[]; fill: string }[] => {
  const out: { d: Pt[]; fill: string }[] = [
    { d: [[u0, 0], [u0 + colW, 0], [u0 + colW, H], [u0, H]], fill: spec.ground },
  ];
  const fh = H / flames;
  const off = (offsetSteps * fh) / 6;
  for (let i = 0; i < flames; i++) {
    const base = i * fh + off;
    if (base + fh > H + 0.01) continue;
    out.push({ d: shift(flame(colW * 0.92, fh * 0.96), u0 + colW / 2, base), fill: spec.outer });
    out.push({ d: shift(flame(colW * 0.44, fh * 0.52), u0 + colW / 2, base + fh * 0.2), fill: spec.core });
  }
  return out;
};

export const COLUMN_SPECS: ColumnSpec[] = [
  { ground: color.cobalt, outer: color.red, core: color.pink },
  { ground: color.sky, outer: color.milk, core: color.saffron },
];

/** A strip of ikat columns bent by `strip.t` (0 straight warp … 1 closed ring). */
export const IkatStrip: React.FC<{
  readonly strip: Strip;
  readonly columns: number;
  readonly H: number;
  readonly flames?: number;
  readonly misregister?: boolean;
  readonly specs?: ColumnSpec[];
  readonly centreY?: number; // if set, translate so the bent shape's bbox is centred on (strip.cx, centreY)
}> = ({ strip, columns, H, flames = 2, misregister = false, specs = COLUMN_SPECS, centreY }) => {
  const colW = strip.W / columns;
  const shapes = Array.from({ length: columns }, (_, i) =>
    columnShapes(-strip.W / 2 + i * colW, colW, H, specs[i % specs.length], flames, misregister ? (i % 3) - 1 : 0),
  ).flat();
  const bent = shapes.map((s) => ({ fill: s.fill, pts: subdivide(s.d, 5).map((p) => bend(p, strip)) }));
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
    </g>
  );
};
