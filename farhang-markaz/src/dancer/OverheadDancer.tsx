import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { color, dancer, FRAME, material } from "../design/tokens";
import type { Pt } from "../design/geometry";
import { PixelCanvas } from "../render/PixelCanvas";
import { renderSkirt } from "../render/skirtShader";
import { KEY } from "../render/shading";
import { Braids } from "./Braids";
import { Doppi } from "./Doppi";

export type DancerPose = {
  readonly rotation: number; // deg, clockwise
  readonly flare: number; // 0..1
  readonly braidLag: number;
  readonly braidReach: number;
  readonly armSweep: number; // deg
  readonly smear: number; // deg of motion blur
  readonly foldPhase?: number;
  readonly straighten?: { index: number; amount: number; to: Pt };
};

type Props = DancerPose & {
  readonly uid: string;
  readonly cx: number;
  readonly cy: number;
  readonly scale?: number;
};

const LIGHT_ANGLE = Math.atan2(KEY[1], KEY[0]); // world, radians
const SHADOW = { dx: 9, dy: 12 };

// Arm from above. Lapis velvet sleeve: velvet reads brightest at grazing edges, so the
// lit edge gets a cobalt rim and the far edge a faint one. Fergana-school hand: wrist
// bent back, fingers open.
const Arm: React.FC<{ readonly side: 1 | -1; readonly sweep: number; readonly bodyRot: number; readonly uid: string }> = ({
  side: s,
  sweep,
  bodyRot,
  uid,
}) => {
  const armAngle = ((bodyRot + s * sweep + (s < 0 ? 180 : 0)) * Math.PI) / 180;
  const litSide = Math.sin(LIGHT_ANGLE - armAngle) < 0 ? -1 : 1; // in arm-local y
  const gid = `${uid}-sleeve-${s}`;
  const hid = `${uid}-hand-${s}`;
  const sleeve = `M${s * 54} -26 C${s * 130} -34 ${s * 205} -21 ${s * 256} -10 L${s * 258} 10 C${s * 205} 19 ${
    s * 130
  } 31 ${s * 56} 29 Z`;
  return (
    <g transform={`rotate(${s * sweep})`}>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={0} y1={-30 * litSide} x2={0} y2={30 * litSide}>
          <stop offset="0" stopColor={color.cobalt} />
          <stop offset="0.16" stopColor={color.lapis} />
          <stop offset="0.6" stopColor="#0C1A4D" />
          <stop offset="0.9" stopColor="#13256B" />
          <stop offset="1" stopColor="#071030" />
        </linearGradient>
        <linearGradient id={hid} gradientUnits="userSpaceOnUse" x1={0} y1={-8 * litSide} x2={0} y2={8 * litSide}>
          <stop offset="0" stopColor={material.skinLight} />
          <stop offset="1" stopColor="#6E4936" />
        </linearGradient>
      </defs>
      <path d={sleeve} fill={`url(#${gid})`} />
      {/* cuff: narrow ruby band */}
      <path d={`M${s * 246} -12 L${s * 258} -10 L${s * 260} 10 L${s * 248} 12 Z`} fill={color.ruby} opacity={0.9} />
      <g transform={`translate(${s * 260} 0) rotate(${s * -30}) scale(1.4)`}>
        <path d={`M0 -7 C${s * 14} -11 ${s * 30} -9 ${s * 40} -4 C${s * 31} 3 ${s * 16} 8 0 7 Z`} fill={`url(#${hid})`} />
        {[-6, -2, 2, 6].map((o, i) => (
          <path
            key={i}
            d={`M${s * 30} ${o * 0.55} Q${s * 42} ${o * 1.3} ${s * (50 + i * 1.6)} ${o * 2.3 - 3 + i * 0.6}`}
            stroke={`url(#${hid})`}
            strokeWidth={3 - i * 0.25}
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
  foldPhase = 0,
  straighten,
}) => {
  const R = dancer.skirtRadius * (0.35 + 0.65 * flare) * scale;
  const S = Math.ceil(R * 2.14) + 4;
  const draw = useCallback(
    (img: ImageData) => renderSkirt(img, { cx: S / 2, cy: S / 2, R, rotation, smear, foldPhase }),
    [S, R, rotation, smear, foldPhase],
  );
  const vb = `0 0 ${FRAME.width} ${FRAME.height}`;
  const t = `translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`;
  return (
    <AbsoluteFill>
      {/* floor shadow — the overhead spot is slightly off-axis */}
      <svg viewBox={vb} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id={`${uid}-floor`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={22} />
          </filter>
        </defs>
        <circle cx={cx + 34 * scale} cy={cy + 46 * scale} r={R * 1.02} fill="#000" opacity={0.85} filter={`url(#${uid}-floor)`} />
      </svg>
      <PixelCanvas left={cx - S / 2} top={cy - S / 2} width={S} height={S} draw={draw} />
      <svg viewBox={vb} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id={`${uid}-cast`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx={SHADOW.dx * scale} dy={SHADOW.dy * scale} stdDeviation={4 * scale} floodColor="#000" floodOpacity={0.62} />
          </filter>
          <radialGradient id={`${uid}-bodice`} cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#0A3B30" />
            <stop offset="0.75" stopColor={color.emerald} />
            <stop offset="1" stopColor={color.turquoise} />
          </radialGradient>
          <radialGradient id={`${uid}-hair`} cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor={material.hairSheen} />
            <stop offset="0.55" stopColor={material.hair} />
            <stop offset="1" stopColor="#050403" />
          </radialGradient>
        </defs>
        <g transform={t}>
          <g filter={`url(#${uid}-cast)`}>
            <g transform={`translate(${cx} ${cy}) rotate(${rotation})`}>
              <Arm side={1} sweep={armSweep} bodyRot={rotation} uid={uid} />
              <Arm side={-1} sweep={armSweep} bodyRot={rotation} uid={uid} />
              {/* emerald velvet nimcha over the shoulders */}
              <path
                d="M-88 4 C-90 -30 -40 -54 0 -54 C40 -54 90 -30 88 4 C86 34 44 50 0 50 C-44 50 -86 34 -88 4 Z"
                fill={`url(#${uid}-bodice)`}
              />
              <path d="M-30 -50 C-14 -36 14 -36 30 -50" stroke={color.gold} strokeWidth={1.4} fill="none" opacity={0.8} />
            </g>
          </g>
          <g filter={`url(#${uid}-cast)`}>
            <Braids cx={cx} cy={cy} rotation={rotation} lag={braidLag} reach={braidReach} smear={smear} straighten={straighten} />
          </g>
          <g filter={`url(#${uid}-cast)`}>
            <g transform={`translate(${cx} ${cy}) rotate(${rotation})`}>
              <ellipse rx={47} ry={50} cy={4} fill={`url(#${uid}-hair)`} />
              <g transform="translate(0 6)">
                <Doppi size={68} uid={uid} />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
