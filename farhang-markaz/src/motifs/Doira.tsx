import React, { useMemo } from "react";
import { color, material } from "../design/tokens";
import { polar, rng } from "../design/geometry";
import { IkatSkirt } from "../dancer/IkatSkirt";

// Uzbek doira from above: bent-wood frame, goat-skin membrane,
// small metal rings (halqa) hung on the inner wall of the frame.

type Props = {
  readonly uid: string;
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
  readonly rotation?: number;
  readonly ikatGhost?: number; // remaining skirt pattern inside the membrane (T1 transition)
  readonly strike?: { readonly x: number; readonly y: number; readonly t: number }; // t: 0..1 ripple
};

export const RING_COUNT = 48; // = 2 × skirt hem scallops

export const Doira: React.FC<Props> = ({ uid, cx, cy, radius: R, rotation = 0, ikatGhost = 0, strike }) => {
  const rm = R * 0.9;
  const grain = useMemo(() => {
    const rand = rng(5);
    return Array.from({ length: 22 }, () => ({ r: R * (0.905 + rand() * 0.09), o: 0.15 + rand() * 0.35 }));
  }, [R]);

  return (
    <g>
      <defs>
        <clipPath id={`${uid}-mem`}>
          <circle cx={cx} cy={cy} r={rm} />
        </clipPath>
        <filter id={`${uid}-fiber`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves={4} seed={9} />
          <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0 0.12  0 0 0 0.4 -0.1" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={material.membrane} />
          <stop offset="0.7" stopColor={material.membrane} />
          <stop offset="1" stopColor={material.membraneShadow} />
        </radialGradient>
        <radialGradient id={`${uid}-falloff`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.62} />
        </radialGradient>
        <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={40} />
        </filter>
      </defs>

      <circle cx={cx + 20} cy={cy + 30} r={R} fill="#000" opacity={0.8} filter={`url(#${uid}-soft)`} />

      {/* frame */}
      <circle cx={cx} cy={cy} r={R} fill={material.walnut} />
      {grain.map((g, i) => (
        <circle key={i} cx={cx} cy={cy} r={g.r} fill="none" stroke={material.walnutLight} strokeWidth={1} opacity={g.o} />
      ))}
      <circle cx={cx} cy={cy} r={R - 1} fill="none" stroke={color.bone} strokeWidth={1} opacity={0.18} />

      {/* membrane */}
      <g clipPath={`url(#${uid}-mem)`}>
        <circle cx={cx} cy={cy} r={rm} fill={`url(#${uid}-glow)`} />
        <circle cx={cx} cy={cy} r={rm} fill={material.membrane} filter={`url(#${uid}-fiber)`} />
        {ikatGhost > 0 && (
          <g opacity={ikatGhost} style={{ mixBlendMode: "multiply" }}>
            <IkatSkirt uid={`${uid}-ghost`} cx={cx} cy={cy} radius={rm} rotation={rotation} flare={1} bare />
          </g>
        )}
        {strike && <Ripple cx={strike.x} cy={strike.y} t={strike.t} R={R} />}
        <circle cx={cx} cy={cy} r={rm} fill={`url(#${uid}-falloff)`} />
      </g>
      <circle cx={cx} cy={cy} r={rm} fill="none" stroke="#000" strokeWidth={6} opacity={0.35} />

      {/* halqa — rings on the inner wall */}
      <g transform={`rotate(${rotation} ${cx} ${cy})`}>
        {Array.from({ length: RING_COUNT }, (_, i) => {
          const a = (i / RING_COUNT) * 360;
          const [x, y] = polar(cx, cy, R * 0.935, a);
          return (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx={R * 0.022}
              ry={R * 0.011}
              transform={`rotate(${a + 90} ${x} ${y})`}
              fill="none"
              stroke={color.gold}
              strokeWidth={1.6}
              opacity={0.75}
            />
          );
        })}
      </g>
    </g>
  );
};

// Membrane displacement after a strike: embossed concentric wave from the contact point.
export const Ripple: React.FC<{ readonly cx: number; readonly cy: number; readonly t: number; readonly R: number }> = ({
  cx,
  cy,
  t,
  R,
}) => {
  const waves = 7;
  const front = t * R * 1.4;
  return (
    <g>
      {Array.from({ length: waves }, (_, k) => {
        const r = front - k * R * 0.07;
        if (r <= 2) return null;
        const o = (1 - t) * (1 - k / waves) * 0.9;
        return (
          <g key={k}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#000" strokeWidth={5} opacity={o * 0.35} />
            <circle cx={cx - 2} cy={cy - 3} r={r} fill="none" stroke="#fff" strokeWidth={2} opacity={o * 0.45} />
          </g>
        );
      })}
      {/* finger contact — the "tak" near the rim (only in the first frames of a strike) */}
      {t < 0.25 && [-24, -8, 8, 24].map((o, i) => (
        <ellipse
          key={i}
          cx={cx + o * 0.4}
          cy={cy + o}
          rx={9}
          ry={14}
          fill="#3b2a1c"
          opacity={(1 - t) * 0.5}
          transform={`rotate(-20 ${cx + o * 0.4} ${cy + o})`}
        />
      ))}
    </g>
  );
};

// What stays on the floor after T1: hairline rings + the halqa rhythm, under the dancer.
export const DoiraGround: React.FC<{ readonly cx: number; readonly cy: number; readonly radius: number; readonly opacity: number }> = ({
  cx,
  cy,
  radius,
  opacity,
}) => (
  <g opacity={opacity}>
    {[1, 0.9, 0.62, 0.38].map((k, i) => (
      <circle key={i} cx={cx} cy={cy} r={radius * k} fill="none" stroke={color.bone} strokeWidth={i === 0 ? 1.4 : 0.8} opacity={i === 0 ? 0.5 : 0.22} />
    ))}
    {Array.from({ length: RING_COUNT }, (_, i) => {
      const [x, y] = polar(cx, cy, radius * 0.95, (i / RING_COUNT) * 360);
      return <circle key={i} cx={x} cy={y} r={2.2} fill={color.gold} opacity={0.55} />;
    })}
  </g>
);
