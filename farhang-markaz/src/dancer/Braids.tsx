import React from "react";
import { color, dancer, material } from "../design/tokens";
import { polar, rng, smoothOpen, type Pt } from "../design/geometry";

// Many thin braids (the qirq kokil tradition) flung radially by the spin,
// each finished with a sochpopuk tassel — the film's only moving gold.

type Props = {
  readonly cx: number;
  readonly cy: number;
  readonly rotation: number; // body rotation, deg
  readonly lag: number; // deg the tips trail behind the spin
  readonly reach?: number; // 0 = hanging, 1 = fully radial
  readonly count?: number;
  readonly length?: number;
  readonly smear?: number;
  readonly straighten?: { index: number; amount: number; to: Pt }; // braid → dutar string
};

export const braidSpine = (
  cx: number,
  cy: number,
  baseAngle: number,
  lag: number,
  reach: number,
  length: number,
): Pt[] => {
  const pts: Pt[] = [];
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const a = baseAngle - lag * Math.pow(s, 1.6);
    const r = 34 + s * length * (0.25 + 0.75 * reach);
    pts.push(polar(cx, cy, r, a));
  }
  return pts;
};

export const Plait: React.FC<{ readonly pts: Pt[]; readonly width: number; readonly opacity?: number }> = ({
  pts,
  width,
  opacity = 1,
}) => {
  const d = smoothOpen(pts);
  // plait texture: alternating short angled ticks along the spine
  const ticks: string[] = [];
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i + 1];
    const tx = x1 - x0;
    const ty = y1 - y0;
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len;
    const ny = tx / len;
    const w = width * (1 - (i / pts.length) * 0.5) * 0.5;
    const side = i % 2 ? 1 : -1;
    const [px, py] = pts[i];
    ticks.push(
      `M${px - nx * w * side} ${py - ny * w * side} L${px + nx * w * side * 0.2 + (tx / len) * 6} ${
        py + ny * w * side * 0.2 + (ty / len) * 6
      }`,
    );
  }
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={material.hair} strokeWidth={width} strokeLinecap="round" />
      <path d={ticks.join(" ")} fill="none" stroke={material.hairSheen} strokeWidth={1.1} strokeLinecap="round" />
    </g>
  );
};

const Sochpopuk: React.FC<{ readonly at: Pt; readonly dir: number }> = ({ at, dir }) => {
  const threads = [-14, 0, 14].map((o) => polar(at[0], at[1], 22, dir + o));
  return (
    <g>
      {threads.map((t, i) => (
        <line key={i} x1={at[0]} y1={at[1]} x2={t[0]} y2={t[1]} stroke={color.ruby} strokeWidth={1.4} opacity={0.9} />
      ))}
      <circle cx={at[0]} cy={at[1]} r={5} fill={color.gold} />
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
  // braids leave from the back of the head (local +90°), fanning around ±150°
  const braids = Array.from({ length: count }, (_, i) => {
    const spread = -105 + (210 * i) / (count - 1);
    return {
      base: rotation + 90 + spread + (rand() - 0.5) * 14,
      len: length * (0.62 + rand() * 0.38),
      lag: lag * (0.75 + rand() * 0.5),
    };
  });

  return (
    <g>
      {braids.map((b, i) => {
        let pts = braidSpine(cx, cy, b.base, b.lag, reach, b.len);
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
        const prev = pts[pts.length - 2];
        const dir = (Math.atan2(tip[1] - prev[1], tip[0] - prev[0]) * 180) / Math.PI;
        return (
          <g key={i}>
            {smear > 0 && (
              <Plait pts={braidSpine(cx, cy, b.base - smear, b.lag, reach, b.len)} width={5} opacity={0.14} />
            )}
            <Plait pts={pts} width={5.5} />
            <Sochpopuk at={tip} dir={dir} />
          </g>
        );
      })}
    </g>
  );
};
