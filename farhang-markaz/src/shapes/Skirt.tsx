import React from "react";
import { color, dancer } from "../design/tokens";
import { polar } from "./geo";
import { DyedThreads, symmetricShift, type Thread } from "./IkatThreads";

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
  const r0 = Re * 0.42; // columns start clear of each other (no central asterisk)
  const r1 = Re * 1.05; // columns run off the hem; clipped by the disc
  const half = Re * 0.13;
  const pitch = (2 * half) / STRIPS;
  const colHalf = half * 1.12;
  return (
    <g>
      <defs>
        <clipPath id={`skirt-${Math.round(cx)}-${Math.round(cy)}-${Math.round(Re)}`}>
          <circle cx={cx} cy={cy} r={Re} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={Re} fill={color.cobalt} />
      <g clipPath={`url(#skirt-${Math.round(cx)}-${Math.round(cy)}-${Math.round(Re)})`}>
      {Array.from({ length: SKIRT_MOTIFS }, (_, m) => {
        const a = rotation + (m * 360) / SKIRT_MOTIFS - 90;
        // constant-width warp column (not a wedge): the cloth ground under the dye
        const col = [
          ...Array.from({ length: 9 }, (_, q) => {
            const r = r0 + ((r1 - r0) * q) / 8;
            return polar(cx, cy, r, a - (colHalf / r) * (180 / Math.PI));
          }),
          ...Array.from({ length: 9 }, (_, q) => {
            const r = r1 - ((r1 - r0) * q) / 8;
            return polar(cx, cy, r, a + (colHalf / r) * (180 / Math.PI));
          }),
        ];
        return <path key={`c${m}`} d={`M${col.map((p) => p.join(" ")).join(" L")} Z`} fill={color.sky} />;
      })}
      {flames > 0.01 &&
        Array.from({ length: SKIRT_MOTIFS }, (_, m) => {
          const a = rotation + (m * 360) / SKIRT_MOTIFS - 90;
          const threads: Thread[] = Array.from({ length: STRIPS }, (_, j) => {
            const u = -half + pitch * (j + 0.5);
            return {
              u,
              misreg: symmetricShift(j, STRIPS, 3, 0.04),
              at: (t: number) => {
                const r = r0 + (r1 - r0) * t;
                return polar(cx, cy, r, a + (u / r) * (180 / Math.PI));
              },
            };
          });
          return <DyedThreads key={m} threads={threads} motif={{ t0: 0.12, t1: 0.12 + 0.86 * flames, half }} width={pitch * 0.62} samples={120} />;
        })}
      </g>
    </g>
  );
};
