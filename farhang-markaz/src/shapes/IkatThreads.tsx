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

type Span = { readonly pts: Pt[]; readonly fill: string };

const spansFor = (th: Thread, motif: { t0: number; t1: number; half: number; steps: number }, samples: number): Span[] => {
  const out: Span[] = [];
  let cur: { pts: Pt[]; fill: string } | null = null;
  for (let k = 0; k <= samples; k++) {
    const t = k / samples;
    const tau = (t - th.misreg - motif.t0) / (motif.t1 - motif.t0);
    const q = (Math.floor(tau * motif.steps) + 0.5) / motif.steps;
    const outer = Math.abs(th.u) < motif.half * flameProfile(q);
    const qc = (q - 0.16) / 0.58;
    const core = Math.abs(th.u) < motif.half * 0.42 * flameProfile(qc);
    const fill = core ? color.milk : outer ? color.red : null;
    if (fill && cur && cur.fill === fill) cur.pts.push(th.at(t));
    else {
      if (cur) {
        cur.pts.push(th.at(t));
        out.push(cur);
      }
      cur = fill ? { pts: [th.at(t)], fill } : null;
    }
  }
  if (cur) out.push(cur);
  return out;
};

export const DyedThreads: React.FC<{
  readonly threads: readonly Thread[];
  readonly motif: { readonly t0: number; readonly t1: number; readonly half: number; readonly steps?: number };
  readonly width: number;
  readonly samples?: number;
}> = ({ threads, motif, width, samples = 240 }) => (
  <g>
    {threads.flatMap((th, i) =>
      spansFor(th, { steps: 5, ...motif }, samples).map((s, j) => (
        <polyline
          key={`${i}-${j}`}
          points={s.pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")}
          fill="none"
          stroke={s.fill}
          strokeWidth={width}
        />
      )),
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
