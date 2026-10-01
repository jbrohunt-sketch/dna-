import React from "react";
import { color, count, dancer } from "../design/tokens";
import { lerp, path, polar, taper, type Pt } from "./geo";

// qirq kokil (register R3), abstracted: a tail of grouped braid masses rooted along the back
// edge of the doppi (a head with a tail of hair, not a hub with spokes). Masses are solid at
// film scale; strand subdivision (5) appears only in close-ups. One 2-strand hero braid
// unzips into the two dutar strings. Sochpopuk (R4): silver cap (milk) + coral/silk (red).

export const spine = (cx: number, cy: number, base: number, lag: number, r0: number, L: number, n = 24): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const s = i / (n - 1);
    return polar(cx, cy, r0 + s * L, base - lag * Math.pow(s, 1.4));
  });

const offsetLine = (sp: readonly Pt[], frac: number, w0: number, w1: number, upTo = 0.88): Pt[] => {
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
  const tip = polar(at[0], at[1], s * 2.4, dir);
  const l = polar(at[0], at[1], s, dir - 90);
  const r = polar(at[0], at[1], s, dir + 90);
  return (
    <g>
      <path d={path([l, tip, r])} fill={color.red} />
      <circle cx={at[0]} cy={at[1]} r={s} fill={color.red} />
      <circle cx={at[0]} cy={at[1]} r={s * 0.55} fill={color.milk} />
    </g>
  );
};

export const BraidMass: React.FC<{
  readonly sp: readonly Pt[];
  readonly w0: number;
  readonly w1: number;
  readonly strands?: number;
  readonly divider?: number;
  readonly keyline?: number;
}> = ({ sp, w0, w1, strands = 3, divider = dancer.minFeature, keyline }) => {
  const n = sp.length;
  const tip = sp[n - 1];
  const prev = sp[n - 3];
  const dir = (Math.atan2(tip[1] - prev[1], tip[0] - prev[0]) * 180) / Math.PI;
  const kl = keyline ?? Math.max(1.5, w0 * 0.14);
  return (
    <g>
      <path d={path(taper(sp, w0, w1))} fill={color.ink} stroke={color.cream} strokeWidth={kl} strokeLinejoin="round" />
      {Array.from({ length: strands - 1 }, (_, k) => (
        <path
          key={k}
          d={path(offsetLine(sp, -0.5 + (k + 1) / strands, w0, w1), false)}
          fill="none"
          stroke={color.cream}
          strokeWidth={divider}
          strokeLinecap="round"
        />
      ))}
      <Tassel at={tip} dir={dir} s={Math.max(dancer.minFeature, w1 * 0.6)} />
    </g>
  );
};

type TailProps = {
  readonly cx: number;
  readonly cy: number;
  readonly R: number;
  readonly rotation: number;
  readonly lag: number;
  readonly reach?: number;
  readonly strands?: number;
  readonly minFeature?: number;
};

export const Braids: React.FC<TailProps> = ({ cx, cy, R, rotation, lag, reach = 1, strands = 1, minFeature = dancer.minFeature }) => {
  const N = count.braidClusters;
  return (
    <g>
      {Array.from({ length: N }, (_, i) => {
        const spread = -32 + (64 * i) / (N - 1);
        const L = R * (0.5 + 0.12 * (0.5 + 0.5 * Math.sin(i * 2.3))) * reach;
        const sp = spine(cx, cy, rotation + 90 + spread, lag * (0.8 + 0.25 * Math.cos(i * 1.3)), R * 0.12, L);
        return <BraidMass key={i} sp={sp} w0={R * 0.06} w1={R * 0.03} strands={strands} divider={minFeature} />;
      })}
    </g>
  );
};

export const heroSpine = (cx: number, cy: number, R: number, rotation: number, lag: number, reach = 1) =>
  spine(cx, cy, rotation + 90 + 44, lag, R * 0.12, R * 0.7 * reach);

/** Two strands with a cream divider: it unzips into the two dutar strings. */
export const HeroBraid: React.FC<{ readonly sp: readonly Pt[]; readonly R: number; readonly minFeature?: number }> = ({
  sp,
  R,
  minFeature = dancer.minFeature,
}) => <BraidMass sp={sp} w0={R * 0.05} w1={R * 0.03} strands={2} divider={minFeature} />;
