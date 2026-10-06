import React from "react";
import { color } from "../design/tokens";
import type { Pt } from "./geo";

// Abrbandi (resist-dyed warp ikat) as ONE drawing method for every frame: a motif is dyed
// ACROSS parallel threads; each bundle of threads is offset by a step along its length
// (the misregistration that makes ikat edges feather). Straight warp (SF2) and radial
// skirt strips (SF1) are the same method on different thread paths.

export const flameProfile = (t: number) =>
  t < 0 || t > 1 ? 0 : t < 0.34 ? 0.12 + 0.88 * Math.sin((t / 0.34) * (Math.PI / 2)) : Math.pow((1 - t) / 0.66, 0.9);

export type Thread = {
  readonly at: (t: number) => Pt; // position along the thread, t ∈ [0, 1]
  readonly u: number; // lateral offset from the motif centre line (px)
  readonly misreg: number; // offset along t (bundle shift)
};

type Layer = "outer" | "core";

const spansFor = (th: Thread, motif: { t0: number; t1: number; half: number; steps: number }, samples: number, layer: Layer): Pt[][] => {
  const out: Pt[][] = [];
  let cur: Pt[] | null = null;
  for (let k = 0; k <= samples; k++) {
    const t = k / samples;
    const tau = (t - th.misreg - motif.t0) / (motif.t1 - motif.t0);
    const q = (Math.floor(tau * motif.steps) + 0.5) / motif.steps;
    const on =
      layer === "outer"
        ? Math.abs(th.u) < motif.half * flameProfile(q)
        : Math.abs(th.u) < motif.half * 0.42 * flameProfile((q - 0.16) / 0.58);
    if (on) {
      if (!cur) cur = [];
      cur.push(th.at(t));
    } else if (cur) {
      cur.push(th.at(t));
      out.push(cur);
      cur = null;
    }
  }
  if (cur) out.push(cur);
  return out;
};

/** Outer dye (red) then core (pink) drawn on top — overlapping layers, never abutting seams. */
export const DyedThreads: React.FC<{
  readonly threads: readonly Thread[];
  readonly motif: { readonly t0: number; readonly t1: number; readonly half: number; readonly steps?: number };
  readonly width: number;
  readonly samples?: number;
  readonly outer?: string;
  readonly core?: string;
}> = ({ threads, motif, width, samples = 240, outer = color.red, core = color.pink }) => (
  <g>
    {(["outer", "core"] as const).map((layer) =>
      threads.flatMap((th, i) =>
        spansFor(th, { steps: 5, ...motif }, samples, layer).map((pts, j) => (
          <polyline
            key={`${layer}-${i}-${j}`}
            points={pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")}
            fill="none"
            stroke={layer === "outer" ? outer : core}
            strokeWidth={width}
          />
        )),
      ),
    )}
  </g>
);

/** Bundle misregistration: threads tied in bundles of `size` share one step offset. */
export const bundleShift = (i: number, size: number, step: number) => (((Math.floor(i / size) * 7) % 3) - 1) * step;

/** Mirror-symmetric bundle misregistration (khan-atlas motifs are mirror-symmetric). */
export const symmetricShift = (i: number, n: number, size: number, step: number) => {
  const b = Math.floor(Math.abs(i - (n - 1) / 2) / size);
  return (b % 2 ? 1 : -1) * step * 0.5;
};
