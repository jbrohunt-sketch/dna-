import React from "react";
import { color, dancer } from "../design/tokens";
import { path, taper, type Pt } from "./geo";
import { Skirt } from "./Skirt";
import { Braids, HeroBraid, heroSpine } from "./Braids";
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
  bez([s * 0.17 * R, 0], [s * 0.36 * R, -0.12 * R], [s * 0.54 * R, -0.15 * R], [s * 0.64 * R, -0.07 * R]);

export const handAt = (s: 1 | -1, R: number): { at: Pt; dir: number } => {
  const sp = armSpine(s, R);
  const end = sp[sp.length - 1];
  const prev = sp[sp.length - 3];
  return { at: end, dir: (Math.atan2(end[1] - prev[1], end[0] - prev[0]) * 180) / Math.PI };
};

const Arm: React.FC<{ readonly s: 1 | -1; readonly R: number; readonly lift: number; readonly kl: number }> = ({ s, R, lift, kl }) => {
  const sp = armSpine(s, R);
  const cuffFrom = Math.floor(sp.length * 0.82);
  const { at, dir } = handAt(s, R);
  return (
    <g transform={`rotate(${s * lift})`}>
      <path d={path(taper(sp, R * 0.1, R * 0.075))} fill={color.milk} stroke={color.ink} strokeWidth={kl * 0.5} strokeLinejoin="round" />
      <path d={path(taper(sp.slice(cuffFrom), R * 0.08, R * 0.075))} fill={color.red} />
      <g transform={`translate(${at[0]} ${at[1]}) rotate(${dir})`}>
        <ellipse cx={R * 0.075} cy={0} rx={R * 0.07} ry={R * 0.048} fill={color.milk} stroke={color.ink} strokeWidth={kl * 0.5} />
      </g>
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
> = ({ cx, cy, R, id, rotation, flare = 1, braidLag = 18, braidReach = 1, armLift = 0, body = 1, hero = true, doppiGround = "milk" }) => {
  const kl = Math.max(1.2, R * 0.012);
  const mf = Math.max(1, (dancer.minFeature * R) / dancer.R);
  return (
    <g>
      <Skirt id={id} cx={cx} cy={cy} R={R} rotation={rotation} flare={flare} />
      <g transform={`translate(${cx} ${cy}) scale(${body}) translate(${-cx} ${-cy})`}>
        <g transform={`translate(${cx} ${cy}) rotate(${rotation})`}>
          <Arm s={1} R={R} lift={armLift} kl={kl} />
          <Arm s={-1} R={R} lift={armLift} kl={kl} />
          <rect x={-0.27 * R} y={-0.1 * R} width={0.54 * R} height={0.2 * R} rx={0.1 * R} fill={color.red} />
        </g>
        <Braids cx={cx} cy={cy} R={R} rotation={rotation} lag={braidLag} reach={braidReach} minFeature={mf} />
        {hero && <HeroBraid sp={heroSpine(cx, cy, R, rotation, braidLag, braidReach)} R={R} minFeature={mf} />}
        <g transform={`translate(${cx} ${cy}) rotate(${rotation})`}>
          <Doppi size={dancer.doppi * R} keyline={kl * 2} ground={doppiGround} />
        </g>
      </g>
    </g>
  );
};
