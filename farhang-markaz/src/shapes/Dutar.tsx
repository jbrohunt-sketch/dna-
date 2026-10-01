import React from "react";
import { color } from "../design/tokens";
import { lerp, path, type Pt } from "./geo";

// Dutar abstraction: exactly two parallel strings with short tied-fret bars; optional
// long-neck pear body. `pluck` bends one string into the instant-after-release triangle.

export const Dutar: React.FC<{
  readonly a: Pt;
  readonly b: Pt;
  readonly gap: number;
  readonly frets?: number; // count of tied frets near the nut
  readonly fretSpan?: number; // 0..1 of length occupied by frets
  readonly pluck?: { readonly at: number; readonly amp: number };
  readonly body?: boolean;
  readonly weight?: number;
}> = ({ a, b, gap, frets = 0, fretSpan = 0.5, pluck, body = false, weight = 4 }) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const tx = dx / L;
  const ty = dy / L;
  const nx = -ty;
  const ny = tx;
  const at = (u: number, off: number): Pt => [a[0] + dx * u + nx * off, a[1] + dy * u + ny * off];
  const string = (off: number, plucked: boolean) => {
    if (!plucked || !pluck) return [at(0, off), at(1, off)];
    return [at(0, off), at(pluck.at, off + pluck.amp), at(1, off)];
  };
  return (
    <g>
      {body && (
        <g>
          <path
            d={`M${at(0.62, -gap * 0.9)[0]} ${at(0.62, -gap * 0.9)[1]} L${at(0.62, gap * 0.9)[0]} ${at(0.62, gap * 0.9)[1]} L${at(-0.02, gap * 0.9)[0]} ${at(-0.02, gap * 0.9)[1]} L${at(-0.02, -gap * 0.9)[0]} ${at(-0.02, -gap * 0.9)[1]} Z`}
            fill={color.cobalt}
          />
          <ellipse
            cx={at(0.82, 0)[0]}
            cy={at(0.82, 0)[1]}
            rx={L * 0.2}
            ry={gap * 3.2}
            transform={`rotate(${(Math.atan2(dy, dx) * 180) / Math.PI} ${at(0.82, 0)[0]} ${at(0.82, 0)[1]})`}
            fill={color.cobalt}
          />
        </g>
      )}
      {Array.from({ length: frets }, (_, i) => {
        const u = lerp(0.04, fretSpan, i / Math.max(1, frets - 1));
        const p0 = at(u, -gap * 1.15);
        const p1 = at(u, gap * 1.15);
        return <line key={i} x1={p0[0]} y1={p0[1]} x2={p1[0]} y2={p1[1]} stroke={color.saffron} strokeWidth={weight * 0.9} strokeLinecap="round" />;
      })}
      {[-gap / 2, gap / 2].map((off, i) => (
        <path key={i} d={path(string(off, i === 1), false)} fill="none" stroke={body ? color.milk : color.ink} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </g>
  );
};
