import React from "react";
import { color, dancer } from "../design/tokens";
import { path, taper, type Pt } from "./geo";
import { Skirt } from "./Skirt";
import { Braids } from "./Braids";
import { Doppi } from "./Doppi";

// The overhead dancer as ~10 shape families: skirt (panels + hem band), two plain-silk dress
// sleeves (register R6) with red cuffs, palm-up hands, sleeveless nimcha, doppi, a tail of
// braid masses, one hero braid.

export type Pose = {
  readonly rotation: number; // deg, clockwise
  readonly flare?: number;
  readonly braidLag?: number;
  readonly braidReach?: number;
  readonly armLift?: number; // deg: rounded arms swing forward/back
  readonly body?: number; // 0..1 — scales arms, nimcha, braids, doppi toward the centre (T1 exit)
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

/** Rounded Fergana arm (register R8), ending in an open palm-up hand; hand tip ≤ 0.80R. */
export const armSpine = (s: 1 | -1, R: number) =>
  bez([s * 0.17 * R, 0], [s * 0.34 * R, -0.12 * R], [s * 0.5 * R, -0.16 * R], [s * 0.66 * R, -0.16 * R]); // ends straight outward, no curl

export const handAt = (s: 1 | -1, R: number): { at: Pt; dir: number } => {
  const sp = armSpine(s, R);
  const end = sp[sp.length - 1];
  const prev = sp[sp.length - 3];
  return { at: end, dir: (Math.atan2(end[1] - prev[1], end[0] - prev[0]) * 180) / Math.PI };
};

/** Both arms as ONE continuous milk arc through the shoulders (rounded, forward). */
const ArmsArc: React.FC<{ readonly R: number; readonly lift: number }> = ({ R, lift }) => {
  const left = armSpine(-1, R).slice().reverse();
  const right = armSpine(1, R);
  const sp = [...left, [0, 0.03 * R] as Pt, ...right];
  const palm = (s: 1 | -1) => {
    const { at, dir } = handAt(s, R);
    // open palm facing camera: flat-ended fan, wider than the wrist, distinct from round beads
    return (
      <g transform={`translate(${at[0]} ${at[1]}) rotate(${dir})`}>
        {/* open palm seen from above: half-disc, curve toward the wrist, flat open edge outward (blunt) */}
        <path d={`M${R * 0.08} ${-R * 0.065} A${R * 0.07} ${R * 0.065} 0 0 0 ${R * 0.08} ${R * 0.065} Z`} fill={color.milk} />
      </g>
    );
  };
  return (
    <g transform={`rotate(${lift})`}>
      <path d={path(taper(sp, R * 0.05, R * 0.05))} fill={color.milk} />
      {palm(1)}
      {palm(-1)}
    </g>
  );
};

export const Dancer: React.FC<
  Pose & {
    readonly cx: number;
    readonly cy: number;
    readonly R: number;
    readonly id: string;
    readonly hero?: boolean;
    readonly doppiGround?: "ink" | "milk";
  }
> = ({ cx, cy, R, id, rotation, flare = 1, braidLag = 46, braidReach = 1, armLift = 0, body = 1, hero = true, doppiGround = "milk" }) => {
  const mf = Math.max(1, (dancer.minFeature * R) / dancer.R);
  return (
    <g>
      <Skirt id={id} cx={cx} cy={cy} R={R} rotation={rotation} flare={flare} />
      <g transform={`translate(${cx} ${cy}) scale(${body}) translate(${-cx} ${-cy})`}>
        <g transform={`translate(${cx} ${cy}) rotate(${rotation})`}>
          <ArmsArc R={R} lift={armLift} />
        </g>
        <Braids cx={cx} cy={cy} R={R} rotation={rotation} lag={braidLag} reach={braidReach} minFeature={mf} hero={hero} />
        <g transform={`translate(${cx} ${cy}) rotate(${rotation})`}>
          <Doppi size={dancer.doppi * R} keyline={0} ground={doppiGround} />
        </g>
      </g>
    </g>
  );
};
