import React from "react";
import { color, dancer, material } from "../design/tokens";
import { polar, rng, smoothOpen, type Pt } from "../design/geometry";

// Many thin braids (qirq kokil) flung outward by the spin, each finished with a
// sochpopuk tassel: steel cap, ruby silk threads, one gold bead.

type Props = {
  readonly cx: number;
  readonly cy: number;
  readonly rotation: number;
  readonly lag: number; // deg the tips trail behind the spin
  readonly reach?: number; // 0 hanging … 1 fully radial
  readonly count?: number;
  readonly length?: number;
  readonly smear?: number;
  readonly straighten?: { index: number; amount: number; to: Pt };
};

export const braidSpine = (cx: number, cy: number, base: number, lag: number, reach: number, length: number, droop = 0): Pt[] => {
  const pts: Pt[] = [];
  const steps = 34;
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const a = base - lag * Math.pow(s, 1.45) + droop * Math.sin(s * Math.PI) ;
    const r = 30 + s * length * (0.25 + 0.75 * reach);
    pts.push(polar(cx, cy, r, a));
  }
  return pts;
};

// Three-strand plait: alternating lobes along the spine; lobes catch the key light.
export const Plait: React.FC<{ readonly pts: Pt[]; readonly width: number; readonly opacity?: number }> = ({
  pts,
  width,
  opacity = 1,
}) => {
  const lobes: React.ReactNode[] = [];
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i + 1];
    const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    const seg = Math.hypot(x1 - x0, y1 - y0) / 2;
    const w = width * (1 - (i / pts.length) * 0.55);
    const side = i % 2 ? 1 : -1;
    const [px, py] = pts[i];
    lobes.push(
      <ellipse
        key={i}
        cx={px}
        cy={py}
        rx={seg * 0.62}
        ry={w * 0.36}
        transform={`rotate(${ang + side * 32} ${px} ${py}) translate(0 ${side * w * 0.12})`}
        fill={side > 0 ? material.hairSheen : "#2A201B"}
      />,
    );
  }
  return (
    <g opacity={opacity}>
      <path d={smoothOpen(pts)} fill="none" stroke={material.hair} strokeWidth={width} strokeLinecap="round" />
      {lobes}
    </g>
  );
};

const Sochpopuk: React.FC<{ readonly at: Pt; readonly dir: number }> = ({ at, dir }) => {
  const threads = [-18, -9, 0, 9, 18].map((o, i) => polar(at[0], at[1], 20 + (i % 2) * 5, dir + o));
  const cap = polar(at[0], at[1], 4, dir);
  return (
    <g>
      {threads.map((t, i) => (
        <path
          key={i}
          d={`M${cap[0]} ${cap[1]} Q${(cap[0] + t[0]) / 2 + 2} ${(cap[1] + t[1]) / 2 - 2} ${t[0]} ${t[1]}`}
          stroke={i % 2 ? color.pomegranate : color.ruby}
          strokeWidth={1.3}
          fill="none"
        />
      ))}
      <circle cx={cap[0]} cy={cap[1]} r={4.2} fill="#8E949A" />
      <circle cx={cap[0] - 1.2} cy={cap[1] - 1.4} r={1.4} fill="#E3E6E8" />
      <circle cx={at[0]} cy={at[1]} r={3.4} fill={color.gold} />
    </g>
  );
};

export const Braids: React.FC<Props> = ({
  cx,
  cy,
  rotation,
  lag,
  reach = 1,
  count = dancer.braidCount,
  length = dancer.braidLength,
  smear = 0,
  straighten,
}) => {
  const rand = rng(21);
  const braids = Array.from({ length: count }, (_, i) => {
    const spread = -100 + (200 * i) / (count - 1);
    return {
      base: rotation + 90 + spread + (rand() - 0.5) * 16,
      len: length * (0.7 + rand() * 0.42),
      lag: lag * (0.45 + rand() * 1.0),
      droop: (rand() - 0.5) * 10,
      w: 6.5 + rand() * 2,
    };
  });
  return (
    <g>
      {braids.map((b, i) => {
        let pts = braidSpine(cx, cy, b.base, b.lag, reach, b.len, b.droop);
        if (straighten && straighten.index === i && straighten.amount > 0) {
          const s0 = pts[0];
          const t = straighten.amount;
          pts = pts.map((p, k) => {
            const u = k / (pts.length - 1);
            const lx = s0[0] + (straighten.to[0] - s0[0]) * u;
            const ly = s0[1] + (straighten.to[1] - s0[1]) * u;
            return [p[0] + (lx - p[0]) * t, p[1] + (ly - p[1]) * t] as Pt;
          });
        }
        const tip = pts[pts.length - 1];
        const prev = pts[pts.length - 3];
        const dir = (Math.atan2(tip[1] - prev[1], tip[0] - prev[0]) * 180) / Math.PI;
        return (
          <g key={i}>
            {smear > 0 && (
              <path
                d={smoothOpen(braidSpine(cx, cy, b.base - smear * 0.6, b.lag, reach, b.len, b.droop))}
                stroke={material.hair}
                strokeWidth={b.w}
                fill="none"
                opacity={0.22}
                strokeLinecap="round"
              />
            )}
            <Plait pts={pts} width={b.w} />
            <Sochpopuk at={tip} dir={dir} />
          </g>
        );
      })}
    </g>
  );
};
