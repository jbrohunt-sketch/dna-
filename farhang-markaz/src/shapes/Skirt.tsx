import React from "react";
import { color, count, dancer } from "../design/tokens";
import { path, polar, subdivide, toPolar } from "./geo";
import { flame } from "./Ikat";

// Khan-atlas skirt from overhead (warp runs radially). True circle. Inner field: 12 panels
// narrowing to the waist, alternating cobalt / sky; each sky panel carries one radial column
// of stacked ikat flames (red, milk core). Outer edge: a plain cobalt hem band
// (`dancer.band`) — the same band becomes the doira rim and the identity ring (loop anchor).

/** Plain hem band at the outer edge, with a cream keyline on its inner edge. */
export const HemBand: React.FC<{ readonly cx: number; readonly cy: number; readonly R: number; readonly keyline?: number }> = ({
  cx,
  cy,
  R,
  keyline = 6,
}) => {
  const r0 = R * (1 - dancer.band);
  return (
    <g>
      <circle cx={cx} cy={cy} r={(R + r0) / 2} fill="none" stroke={color.cobalt} strokeWidth={R - r0} />
      {keyline > 0 && <circle cx={cx} cy={cy} r={r0} fill="none" stroke={color.cream} strokeWidth={keyline} />}
    </g>
  );
};

type Props = {
  readonly cx: number;
  readonly cy: number;
  readonly R: number;
  readonly rotation: number;
  readonly flare?: number; // 0.35R … R
  readonly flames?: number; // 0..1 flame-column visibility
  readonly panels?: number; // 0..1 sky-panel visibility
  readonly id: string;
};

export const Skirt: React.FC<Props> = ({ cx, cy, R, rotation, flare = 1, flames = 1, panels = 1 }) => {
  const Re = R * (0.35 + 0.65 * flare);
  const N = count.hemScallops;
  const step = 360 / N;
  const rIn = Re * (1 - dancer.band);
  const colBase = Re * 0.3;
  const colH = rIn - colBase - Re * 0.03;
  const rRef = colBase + colH * 0.6;
  const fw = ((2 * Math.PI * rRef) / N) * 0.62;
  return (
    <g>
      <circle cx={cx} cy={cy} r={Re} fill={color.cobalt} />
      {Array.from({ length: N / 2 }, (_, j) => {
        const a = rotation + (2 * j + 1) * step - 90;
        const wedge = [[cx, cy] as const, ...Array.from({ length: 13 }, (_, q) => polar(cx, cy, rIn, a - step / 2 + (q * step) / 12))];
        const fh = colH * 0.9;
        return (
          <g key={j} opacity={panels}>
            <path d={path(wedge)} fill={color.sky} />
            {flames > 0.01 &&
              [0].map((k) => {
                const lift = colH - fh;
                const outer = subdivide(flame(fw * 1.1, fh * flames, 5), 4).map(([u, h]) => toPolar([u, h + lift], cx, cy, a, colBase, rRef));
                const core = subdivide(flame(fw * 0.42, fh * 0.52 * flames, 5), 4).map(([u, h]) =>
                  toPolar([u, h + lift + fh * 0.2], cx, cy, a, colBase, rRef),
                );
                return (
                  <g key={k}>
                    <path d={path(outer)} fill={color.red} />
                    <path d={path(core)} fill={color.milk} />
                  </g>
                );
              })}
          </g>
        );
      })}
      <HemBand cx={cx} cy={cy} R={Re} />
    </g>
  );
};
