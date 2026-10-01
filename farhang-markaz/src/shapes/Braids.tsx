import React from "react";
import { color, count } from "../design/tokens";
import { lerp, path, polar, taper, type Pt } from "./geo";

// qirq kokil, abstracted: 6–8 grouped braid masses (each subdivided to imply several braids)
// plus one hero braid that will separate and become the dutar string.

export const spine = (cx: number, cy: number, base: number, lag: number, r0: number, L: number, n = 24): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const s = i / (n - 1);
    return polar(cx, cy, r0 + s * L, base - lag * Math.pow(s, 1.4));
  });

const offsetLine = (sp: readonly Pt[], frac: number, w0: number, w1: number, upTo = 0.86): Pt[] => {
  const n = sp.length;
  const out: Pt[] = [];
  for (let i = 0; i < n * upTo; i++) {
    const a = sp[Math.max(0, i - 1)];
    const b = sp[Math.min(n - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    const w = lerp(w0, w1, i / (n - 1)) * frac;
    out.push([sp[i][0] - (ty / l) * w, sp[i][1] + (tx / l) * w]);
  }
  return out;
};

export const Tassel: React.FC<{ readonly at: Pt; readonly dir: number; readonly s: number }> = ({ at, dir, s }) => {
  const tip = polar(at[0], at[1], s * 2.2, dir);
  const l = polar(at[0], at[1], s * 0.9, dir - 90);
  const r = polar(at[0], at[1], s * 0.9, dir + 90);
  return (
    <g>
      <path d={path([l, tip, r])} fill={color.red} />
      <circle cx={at[0]} cy={at[1]} r={s * 0.9} fill={color.red} />
      <circle cx={at[0]} cy={at[1]} r={s * 0.5} fill={color.milk} />
    </g>
  );
};

export const BraidMass: React.FC<{ readonly sp: readonly Pt[]; readonly w0: number; readonly w1: number; readonly strands?: number; readonly keyline?: number }> = ({
  sp,
  w0,
  w1,
  strands = 3,
  keyline,
}) => {
  const kl = keyline ?? Math.max(1.2, w0 * 0.1);
  const n = sp.length;
  const tip = sp[n - 1];
  const prev = sp[n - 3];
  const dir = (Math.atan2(tip[1] - prev[1], tip[0] - prev[0]) * 180) / Math.PI;
  const body = taper(sp, w0, w1);
  return (
    <g>
      <path d={path(body)} fill={color.ink} stroke={color.cream} strokeWidth={kl} strokeLinejoin="round" />
      {Array.from({ length: strands - 1 }, (_, k) => {
        const f = -0.5 + (k + 1) / strands;
        return (
          <path
            key={k}
            d={path(offsetLine(sp, f, w0, w1), false)}
            fill="none"
            stroke={color.cream}
            strokeWidth={Math.max(1.2, w0 * 0.075)}
            strokeLinecap="round"
          />
        );
      })}
      <Tassel at={tip} dir={dir} s={Math.max(2.5, w1 * 0.6)} />
    </g>
  );
};

export const Braids: React.FC<{
  readonly cx: number;
  readonly cy: number;
  readonly R: number;
  readonly rotation: number;
  readonly lag: number;
  readonly reach?: number;
}> = ({ cx, cy, R, rotation, lag, reach = 1 }) => {
  const N = count.braidClusters;
  return (
    <g>
      {Array.from({ length: N }, (_, i) => {
        const spread = -68 + (136 * i) / (N - 1);
        const L = R * (0.62 + 0.14 * Math.sin(i * 1.9)) * reach;
        const sp = spine(cx, cy, rotation + 90 + spread, lag * (0.85 + 0.25 * Math.cos(i * 1.3)), R * 0.06, L);
        return <BraidMass key={i} sp={sp} w0={R * 0.1} w1={R * 0.045} />;
      })}
    </g>
  );
};

export const heroSpine = (cx: number, cy: number, R: number, rotation: number, lag: number, reach = 1) =>
  spine(cx, cy, rotation + 90 + 100, lag * 1.1, R * 0.06, R * 0.98 * reach);

export const HeroBraid: React.FC<{ readonly sp: readonly Pt[]; readonly R: number }> = ({ sp, R }) => (
  <BraidMass sp={sp} w0={R * 0.045} w1={R * 0.024} strands={1} />
);
