import React from "react";
import { color, count, dancer } from "../design/tokens";
import { path, polar, scallopPts, subdivide, toPolar } from "./geo";
import { flame } from "./Ikat";

// Khan-atlas skirt from overhead (warp runs radially). Inner field: 12 plain panels
// alternating cobalt/sky. Hem band (0.84–0.97R, = doira rim = identity ring): 36 red flames
// with milk cores, each ≥2× as long as wide. The hem band IS the identity ring (loop anchor).

export const HEM_FLAMES = count.hemFlames;

/** Hem band only (used by the skirt and, unchanged, as the identity ring). */
export const HemBand: React.FC<{
  readonly cx: number;
  readonly cy: number;
  readonly R: number;
  readonly rotation: number;
  readonly flames?: number; // 0..1 flame length
  readonly ground?: string;
}> = ({ cx, cy, R, rotation, flames = 1, ground = color.cobalt }) => {
  const r0 = R * (0.97 - dancer.band);
  const r1 = R * 0.97;
  const H = (r1 - r0) * flames;
  const rRef = (r0 + r1) / 2;
  const W = R * dancer.hemFlameW;
  const ring = [
    ...Array.from({ length: 121 }, (_, i) => polar(cx, cy, r1, (i / 120) * 360)),
    ...Array.from({ length: 121 }, (_, i) => polar(cx, cy, r0, 360 - (i / 120) * 360)),
  ];
  return (
    <g>
      <path d={path(ring)} fill={ground} fillRule="evenodd" />
      {flames > 0.01 &&
        Array.from({ length: HEM_FLAMES }, (_, i) => {
          const a = rotation + (i * 360) / HEM_FLAMES - 90;
          const off = (r1 - r0 - H) / 2;
          const outer = subdivide(flame(W, H), 4).map(([u, h]) => toPolar([u, h + off], cx, cy, a, r0, rRef));
          const core = subdivide(flame(W * 0.42, H * 0.56), 4).map(([u, h]) => toPolar([u, h + off + H * 0.16], cx, cy, a, r0, rRef));
          return (
            <g key={i}>
              <path d={path(outer)} fill={color.red} />
              <path d={path(core)} fill={color.milk} />
            </g>
          );
        })}
    </g>
  );
};

type Props = {
  readonly cx: number;
  readonly cy: number;
  readonly R: number;
  readonly rotation: number;
  readonly flare?: number; // 0.35R … R
  readonly scallop?: number; // 0 = perfect circle
  readonly flames?: number;
  readonly panels?: number; // 0..1 sky-panel visibility
  readonly id: string;
};

export const Skirt: React.FC<Props> = ({ cx, cy, R, rotation, flare = 1, scallop = 0.022, flames = 1, panels = 1, id }) => {
  const Re = R * (0.35 + 0.65 * flare);
  const N = count.hemScallops;
  const outline = scallopPts(cx, cy, Re, N, scallop, rotation + 360 / N / 2);
  const step = 360 / N;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-hem`}>
          <path d={path(outline)} />
        </clipPath>
      </defs>
      <path d={path(outline)} fill={color.cobalt} />
      <g clipPath={`url(#${id}-hem)`}>
        {Array.from({ length: N / 2 }, (_, j) => {
          const a = rotation + (2 * j + 1) * step - 90;
          const rIn = Re * (0.97 - dancer.band);
          const wedge = [[cx, cy] as const, ...Array.from({ length: 13 }, (_, q) => polar(cx, cy, rIn, a - step / 2 + (q * step) / 12))];
          return <path key={j} d={path(wedge)} fill={color.sky} opacity={panels} />;
        })}
        <HemBand cx={cx} cy={cy} R={Re} rotation={rotation} flames={flames} />
      </g>
    </g>
  );
};
