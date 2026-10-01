import React from "react";
import { color, count } from "../design/tokens";
import { path, polar, scallopPts, subdivide, toPolar } from "./geo";
import { COLUMN_SPECS, flame } from "./Ikat";

// Khan-atlas skirt from overhead: the warp hangs vertically, so seen from above the warp
// columns run radially. 12 panels alternate cobalt/sky; the hem band carries one stepped
// flame per panel. The hem band is also the identity ring (loop anchor).

type Props = {
  readonly cx: number;
  readonly cy: number;
  readonly R: number;
  readonly rotation: number;
  readonly flare?: number; // 0.35R … R
  readonly scallop?: number; // 0 = perfect circle (→ doira rim / identity ring)
  readonly flames?: number; // 0..1 flame visibility (scale from base)
  readonly panels?: number; // 0..1 sky-panel visibility
  readonly id: string;
};

export const Skirt: React.FC<Props> = ({ cx, cy, R, rotation, flare = 1, scallop = 0.028, flames = 1, panels = 1, id }) => {
  const Re = R * (0.35 + 0.65 * flare);
  const N = count.hemScallops;
  const outline = scallopPts(cx, cy, Re, N, scallop, rotation + 360 / N / 2);
  const step = 360 / N;
  const bandBase = Re * 0.6;
  const bandH = Re * 0.36 * flames;
  const rRef = Re * 0.8;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-hem`}>
          <path d={path(outline)} />
        </clipPath>
      </defs>
      <path d={path(outline)} fill={color.cobalt} />
      <g clipPath={`url(#${id}-hem)`}>
        {Array.from({ length: N }, (_, i) => {
          const a = rotation + i * step - 90;
          const spec = COLUMN_SPECS[i % 2];
          const wedge = [
            [cx, cy] as const,
            polar(cx, cy, Re * 1.2, a - step / 2),
            polar(cx, cy, Re * 1.2, a + step / 2),
          ];
          const arcW = ((2 * Math.PI * rRef) / N) * 0.8;
          const outer = subdivide(flame(arcW, bandH), 4).map((p) => toPolar(p, cx, cy, a, bandBase, rRef));
          const core = subdivide(
            flame(arcW * 0.48, bandH * 0.52).map(([u, h]) => [u, h + bandH * 0.2] as const),
            4,
          ).map((p) => toPolar(p, cx, cy, a, bandBase, rRef));
          return (
            <g key={i}>
              {i % 2 === 1 && <path d={path(wedge)} fill={color.sky} opacity={panels} />}
              {flames > 0.01 && <path d={path(outer)} fill={spec.outer} />}
              {flames > 0.01 && <path d={path(core)} fill={spec.core} />}
            </g>
          );
        })}
      </g>
    </g>
  );
};
