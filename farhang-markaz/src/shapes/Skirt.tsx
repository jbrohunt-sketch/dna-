import React from "react";
import { color, dancer } from "../design/tokens";
import { polar } from "./geo";
import { bundleShift, DyedThreads, type Thread } from "./IkatThreads";

// Khan-atlas skirt from overhead: a solid bold-blue disc (the warp runs radially). The ikat
// is drawn with the same abrbandi method as the straight warp: radial thread strips, each
// bundle offset by a step, so SF1 → SF2 is the same pattern straightening.
// The outer `dancer.band` of the disc is the hem band = doira rim = identity ring.

export const SKIRT_MOTIFS = 6;
const STRIPS = 9;

/** Plain hem band (used when the skirt's inner field clears: doira, identity). */
export const HemBand: React.FC<{ readonly cx: number; readonly cy: number; readonly R: number }> = ({ cx, cy, R }) => {
  const r0 = R * (1 - dancer.band);
  return <circle cx={cx} cy={cy} r={(R + r0) / 2} fill="none" stroke={color.cobalt} strokeWidth={R - r0} />;
};

export const Skirt: React.FC<{
  readonly cx: number;
  readonly cy: number;
  readonly R: number;
  readonly rotation: number;
  readonly flare?: number;
  readonly flames?: number;
  readonly id?: string;
}> = ({ cx, cy, R, rotation, flare = 1, flames = 1 }) => {
  const Re = R * (0.35 + 0.65 * flare);
  const r0 = Re * 0.3;
  const r1 = Re * (1 - dancer.band) - Re * 0.03;
  const rMid = (r0 + r1) / 2;
  const half = Re * 0.15;
  const pitch = (2 * half) / STRIPS;
  return (
    <g>
      <circle cx={cx} cy={cy} r={Re} fill={color.cobalt} />
      {flames > 0.01 &&
        Array.from({ length: SKIRT_MOTIFS }, (_, m) => {
          const a = rotation + (m * 360) / SKIRT_MOTIFS - 90;
          const threads: Thread[] = Array.from({ length: STRIPS }, (_, j) => {
            const u = -half + pitch * (j + 0.5);
            const da = (u / rMid) * (180 / Math.PI);
            return {
              u,
              misreg: bundleShift(j, 3, 0.05),
              at: (t: number) => polar(cx, cy, r0 + (r1 - r0) * t, a + da),
            };
          });
          return <DyedThreads key={m} threads={threads} motif={{ t0: 0.05, t1: 0.05 + 0.9 * flames, half }} width={pitch * 0.82} samples={120} />;
        })}
    </g>
  );
};
