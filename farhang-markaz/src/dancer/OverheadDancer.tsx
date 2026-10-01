import React from "react";
import { color, dancer, material } from "../design/tokens";
import type { Pt } from "../design/geometry";
import { IkatSkirt } from "./IkatSkirt";
import { Braids } from "./Braids";
import { Doppi } from "./Doppi";

export type DancerPose = {
  readonly rotation: number; // deg, clockwise
  readonly flare: number; // 0..1
  readonly braidLag: number; // deg
  readonly braidReach: number; // 0..1
  readonly armSweep: number; // deg, arms lift/sweep relative to shoulders
  readonly smear: number; // deg of motion smear
  readonly hemPhase?: number;
  readonly straighten?: { index: number; amount: number; to: Pt };
};

type Props = DancerPose & {
  readonly uid: string;
  readonly cx: number;
  readonly cy: number;
  readonly scale?: number;
};

// Arm seen from above: sleeve (lapis velvet) to the wrist, then a dancer's hand —
// wrist bent back, fingers open (Fergana-school port de bras).
const Arm: React.FC<{ readonly side: 1 | -1; readonly sweep: number }> = ({ side, sweep }) => {
  const s = side;
  const sleeve = `M${s * 56} -24 C${s * 130} -34 ${s * 200} -22 ${s * 252} -10 L${s * 254} 10 C${s * 200} 18 ${
    s * 130
  } 30 ${s * 58} 28 Z`;
  return (
    <g transform={`rotate(${s * sweep})`}>
      <path d={sleeve} fill={color.lapis} />
      <path d={sleeve} fill="#000" opacity={0.35} transform="translate(0 6) scale(1 0.6)" />
      <path
        d={`M${s * 70} -10 C${s * 140} -20 ${s * 200} -15 ${s * 246} -5`}
        stroke={color.cobalt}
        strokeWidth={2}
        fill="none"
        opacity={0.7}
      />
      <g transform={`translate(${s * 252} 0) rotate(${s * -28}) scale(1.35)`}>
        <path
          d={`M0 -7 C${s * 16} -12 ${s * 34} -10 ${s * 46} -4 C${s * 36} 2 ${s * 18} 8 0 7 Z`}
          fill={material.skin}
        />
        {[-6, -2, 2, 6].map((o, i) => (
          <path
            key={i}
            d={`M${s * 34} ${o * 0.6} Q${s * 46} ${o * 1.4} ${s * (54 + i * 2)} ${o * 2.4 - 2}`}
            stroke={material.skinLight}
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </g>
    </g>
  );
};

export const OverheadDancer: React.FC<Props> = ({
  uid,
  cx,
  cy,
  scale = 1,
  rotation,
  flare,
  braidLag,
  braidReach,
  armSweep,
  smear,
  hemPhase = 0,
  straighten,
}) => {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`}>
      <IkatSkirt
        uid={uid}
        cx={cx}
        cy={cy}
        radius={dancer.skirtRadius}
        rotation={rotation}
        flare={flare}
        smear={smear}
        hemPhase={hemPhase}
      />
      <g transform={`translate(${cx} ${cy}) rotate(${rotation})`}>
        {/* arms trail the spin slightly */}
        <Arm side={1} sweep={armSweep} />
        <Arm side={-1} sweep={armSweep} />
        {/* bodice / shoulders */}
        <ellipse rx={84} ry={50} fill={color.emerald} />
        <ellipse rx={84} ry={50} fill="#000" opacity={0.25} />
        <path d="M-76 -6 C-44 -46 44 -46 76 -6" stroke={color.turquoise} strokeWidth={2} fill="none" opacity={0.6} />
      </g>
      <Braids
        cx={cx}
        cy={cy}
        rotation={rotation}
        lag={braidLag}
        reach={braidReach}
        smear={smear}
        straighten={straighten}
      />
      <g transform={`translate(${cx} ${cy}) rotate(${rotation})`}>
        <circle r={46} fill={material.hair} />
        <path d="M-40 -12 C-30 -40 30 -40 40 -12" stroke={material.hairSheen} strokeWidth={3} fill="none" />
        <g transform="translate(0 4)">
          <Doppi size={66} />
        </g>
      </g>
    </g>
  );
};
