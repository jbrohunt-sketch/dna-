import React, { useCallback, useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { color, FRAME, material } from "../design/tokens";
import { polar, rng } from "../design/geometry";
import { PixelCanvas } from "../render/PixelCanvas";
import { renderMembrane, type Strike } from "../render/membraneShader";

// Uzbek doira from above: bent-wood (lacquered walnut) frame, goat-skin membrane,
// small steel rings (halqa) hung along the inner wall.

export const RING_COUNT = 48; // = 2 × skirt pleats — shared rhythm with the hem

type Props = {
  readonly uid: string;
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
  readonly rotation?: number;
  readonly strike?: Strike;
  readonly pool: { readonly x: number; readonly y: number; readonly r: number };
  readonly res?: number; // canvas downsample
};

export const Doira: React.FC<Props> = ({ uid, cx, cy, radius: R, rotation = 0, strike, pool, res = 2 }) => {
  const Rm = R * 0.9;
  // canvas only covers the visible part of the membrane
  const x0 = Math.max(0, Math.floor(cx - Rm));
  const y0 = Math.max(0, Math.floor(cy - Rm));
  const x1 = Math.min(FRAME.width, Math.ceil(cx + Rm));
  const y1 = Math.min(FRAME.height, Math.ceil(cy + Rm));
  const W = Math.ceil((x1 - x0) / res);
  const H = Math.ceil((y1 - y0) / res);
  const draw = useCallback(
    (img: ImageData) => renderMembrane(img, { scale: res, ox: x0, oy: y0, cx, cy, Rm, strike, pool }),
    [res, x0, y0, cx, cy, Rm, strike, pool],
  );
  const grain = useMemo(() => {
    const rand = rng(5);
    return Array.from({ length: 26 }, () => ({ r: R * (0.905 + rand() * 0.09), o: 0.1 + rand() * 0.3 }));
  }, [R]);
  const vb = `0 0 ${FRAME.width} ${FRAME.height}`;
  // lacquer highlight sits on the side of the frame facing the key light (upper-left)
  const hl0 = polar(cx, cy, R * 0.955, 188);
  const hl1 = polar(cx, cy, R * 0.955, 262);

  return (
    <AbsoluteFill>
      <svg viewBox={vb} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={40} />
          </filter>
          <radialGradient id={`${uid}-wood`} gradientUnits="userSpaceOnUse" cx={pool.x} cy={pool.y} r={pool.r * 1.4}>
            <stop offset="0" stopColor={material.walnutLight} />
            <stop offset="0.5" stopColor={material.walnut} />
            <stop offset="1" stopColor="#0D0806" />
          </radialGradient>
        </defs>
        <circle cx={cx + 30} cy={cy + 40} r={R} fill="#000" opacity={0.9} filter={`url(#${uid}-soft)`} />
        <circle cx={cx} cy={cy} r={R} fill={`url(#${uid}-wood)`} />
        {grain.map((g, i) => (
          <circle key={i} cx={cx} cy={cy} r={g.r} fill="none" stroke="#000" strokeWidth={0.8} opacity={g.o} />
        ))}
        <path
          d={`M${hl0[0]} ${hl0[1]} A${R * 0.955} ${R * 0.955} 0 0 1 ${hl1[0]} ${hl1[1]}`}
          stroke={color.bone}
          strokeWidth={3}
          fill="none"
          opacity={0.22}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={R - 1} fill="none" stroke="#000" strokeWidth={2} opacity={0.6} />
      </svg>
      <PixelCanvas left={x0} top={y0} width={W} height={H} scale={res} draw={draw} />
      <svg viewBox={vb} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id={`${uid}-ringshadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx={3} dy={4} stdDeviation={1.6} floodColor="#000" floodOpacity={0.6} />
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={Rm} fill="none" stroke="#000" strokeWidth={3} opacity={0.5} />
        <Halqa cx={cx} cy={cy} radius={R * 0.915} size={R * 0.0135} rotation={rotation} pool={pool} uid={uid} />
      </svg>
    </AbsoluteFill>
  );
};

// Steel rings: each a small loop, glinting only on the side facing the light.
export const Halqa: React.FC<{
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
  readonly size: number;
  readonly rotation?: number;
  readonly pool?: { readonly x: number; readonly y: number; readonly r: number };
  readonly uid: string;
  readonly opacity?: number;
}> = ({ cx, cy, radius, size, rotation = 0, pool, uid, opacity = 1 }) => (
  <g filter={`url(#${uid}-ringshadow)`} opacity={opacity}>
    {Array.from({ length: RING_COUNT }, (_, i) => {
      // rings hang in pairs from shared staples
      const a = ((Math.floor(i / 2) * 2 + (i % 2) * 0.55) / RING_COUNT) * 360 + rotation;
      const [x, y] = polar(cx, cy, radius, a);
      const ex = pool ? Math.max(0.12, 1 - Math.hypot(x - pool.x, y - pool.y) / pool.r) : 1;
      const tilt = 0.45 + 0.35 * Math.abs(Math.sin(i * 1.7));
      return (
        <g key={i} transform={`rotate(${a + 90} ${x} ${y})`} opacity={ex}>
          <ellipse cx={x} cy={y} rx={size} ry={size * tilt} fill="none" stroke="#4A4F55" strokeWidth={size * 0.34} />
          <ellipse
            cx={x}
            cy={y}
            rx={size}
            ry={size * tilt}
            fill="none"
            stroke={material.steelLight}
            strokeWidth={size * 0.2}
            strokeDasharray={`${size * 1.2} ${size * 8}`}
            strokeDashoffset={size * 3.4}
          />
        </g>
      );
    })}
  </g>
);

// What stays on the floor after T1: hairline rings + the halqa rhythm, under the dancer.
export const DoiraGround: React.FC<{ readonly cx: number; readonly cy: number; readonly radius: number; readonly opacity: number }> = ({
  cx,
  cy,
  radius,
  opacity,
}) => (
  <g opacity={opacity}>
    {[1, 0.9, 0.62, 0.38].map((k, i) => (
      <circle key={i} cx={cx} cy={cy} r={radius * k} fill="none" stroke={color.bone} strokeWidth={i === 0 ? 1.2 : 0.7} opacity={i === 0 ? 0.45 : 0.18} />
    ))}
    {Array.from({ length: RING_COUNT }, (_, i) => {
      const [x, y] = polar(cx, cy, radius * 0.95, (i / RING_COUNT) * 360);
      return <circle key={i} cx={x} cy={y} r={i % 2 ? 1.4 : 2.2} fill={material.steel} opacity={0.7} />;
    })}
  </g>
);
