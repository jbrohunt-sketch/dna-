import React from "react";
import { color } from "../design/tokens";
import { path, taper, type Pt } from "./geo";
import { Skirt } from "./Skirt";
import { Braids, HeroBraid, heroSpine } from "./Braids";
import { Doppi } from "./Doppi";

// The overhead dancer as ~10 flat shapes: skirt, two ko'ylak sleeves with cuffs, two
// palm-up hands, sleeveless nimcha, doppi, braid masses, hero braid.

export type Pose = {
  readonly rotation: number; // deg, clockwise
  readonly flare?: number;
  readonly braidLag?: number;
  readonly braidReach?: number;
  readonly armLift?: number; // deg: rounded arms swing forward/back
};

const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 22): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const u = 1 - t;
    return [
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ] as Pt;
  });

// Rounded Fergana arm (not a rigid T), ending in an open palm-up hand.
const Arm: React.FC<{ readonly s: 1 | -1; readonly R: number; readonly lift: number }> = ({ s, R, lift }) => {
  const sp = bez([s * 0.17 * R, 0], [s * 0.4 * R, -0.13 * R], [s * 0.6 * R, -0.17 * R], [s * 0.72 * R, -0.07 * R]);
  const n = sp.length;
  const cuffFrom = Math.floor(n * 0.84);
  const end = sp[n - 1];
  const prev = sp[n - 3];
  const dir = (Math.atan2(end[1] - prev[1], end[0] - prev[0]) * 180) / Math.PI;
  return (
    <g transform={`rotate(${s * lift})`}>
      <path d={path(taper(sp, R * 0.1, R * 0.07))} fill={color.cobalt} stroke={color.cream} strokeWidth={6} strokeLinejoin="round" />
      <path d={path(taper(sp.slice(cuffFrom), R * 0.074, R * 0.07))} fill={color.red} />
      {/* open palm, seen from above, fingers together */}
      <g transform={`translate(${end[0]} ${end[1]}) rotate(${dir})`}>
        <ellipse cx={R * 0.07} cy={0} rx={R * 0.068} ry={R * 0.046} fill={color.milk} stroke={color.cream} strokeWidth={4} />
      </g>
    </g>
  );
};

export const Dancer: React.FC<
  Pose & { readonly cx: number; readonly cy: number; readonly R: number; readonly id: string; readonly hero?: boolean }
> = ({ cx, cy, R, id, rotation, flare = 1, braidLag = 32, braidReach = 1, armLift = 0, hero = true }) => (
  <g>
    <Skirt id={id} cx={cx} cy={cy} R={R} rotation={rotation} flare={flare} />
    <g transform={`translate(${cx} ${cy}) rotate(${rotation})`}>
      <Arm s={1} R={R} lift={armLift} />
      <Arm s={-1} R={R} lift={armLift} />
      <rect x={-0.27 * R} y={-0.1 * R} width={0.54 * R} height={0.2 * R} rx={0.1 * R} fill={color.red} stroke={color.cream} strokeWidth={6} />
    </g>
    <Braids cx={cx} cy={cy} R={R} rotation={rotation} lag={braidLag} reach={braidReach} />
    {hero && <HeroBraid sp={heroSpine(cx, cy, R, rotation, braidLag, braidReach)} R={R} />}
    <g transform={`translate(${cx} ${cy}) rotate(${rotation})`}>
      <Doppi size={0.22 * R} />
    </g>
  </g>
);
