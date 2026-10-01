import React from "react";
import { color, FRAME, material } from "../design/tokens";
import { Plait } from "../dancer/Braids";
import type { Pt } from "../design/geometry";

// Two silk strings of a dutar, tuned a fourth apart, over tied gut frets. The top of each
// string is still the braid it came from. Strings hover above whatever is beneath them and
// cast a shadow onto it (clipped to `shadowOn`).

type Props = {
  readonly uid: string;
  readonly a: Pt; // top
  readonly b: Pt; // bottom
  readonly gap?: number;
  readonly braidTo?: number; // 0..1 along the string where plait becomes silk
  readonly frets?: readonly [number, number]; // 0..1 range along the string
  readonly pluck?: { readonly at: number; readonly amp: number };
  readonly shadow?: { readonly dx: number; readonly dy: number; readonly clip?: { cx: number; cy: number; r: number } };
};

export const Dutar: React.FC<Props> = ({ uid, a, b, gap = 22, braidTo = 0, frets, pluck, shadow }) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  const tx = dx / L;
  const ty = dy / L;
  const nx = -ty;
  const ny = tx;
  const at = (u: number, off: number, disp = 0): Pt => [a[0] + dx * u + nx * (off + disp), a[1] + dy * u + ny * (off + disp)];
  const offs = [-gap / 2, gap / 2];

  // plucked string shape: triangle peaked at the pluck point (the instant after release)
  const disp = (u: number, phase: number) => {
    if (!pluck) return 0;
    const tri = u < pluck.at ? u / pluck.at : (1 - u) / (1 - pluck.at);
    return pluck.amp * tri * phase;
  };
  const linePath = (off: number, phase: number, u0: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const u = u0 + ((1 - u0) * i) / 40;
      const p = at(u, off, disp(u, phase));
      pts.push(`${p[0].toFixed(1)},${p[1].toFixed(1)}`);
    }
    return `M${pts.join(" L")}`;
  };
  const fretList: number[] = frets
    ? Array.from({ length: 13 }, (_, i) => frets[0] + (frets[1] - frets[0]) * (1 - Math.pow(2, -i / 12)) * 2)
    : [];
  const ghostPhases = pluck ? [1, 0.7, 0.2, -0.35, -0.8, -1] : [0];

  const body = (isShadow: boolean) => (
    <g>
      {offs.map((off, si) => {
        const plaitPts: Pt[] = braidTo
          ? Array.from({ length: 20 }, (_, k) => {
              const u = (braidTo * k) / 19;
              return at(u, off, Math.sin(k * 0.9 + si) * (1 - k / 19) * 9);
            })
          : [];
        return (
          <g key={si}>
            {braidTo > 0 && !isShadow && <Plait pts={plaitPts} width={6.5} />}
            {ghostPhases.map((ph, gi) => (
              <path
                key={gi}
                d={linePath(off, ph * (si === 1 ? 1 : 0.55), braidTo)}
                fill="none"
                stroke={isShadow ? "#000" : material.silk}
                strokeWidth={isShadow ? 2.6 : gi === 0 ? 1.7 : 1}
                opacity={isShadow ? 0.5 / ghostPhases.length + 0.12 : gi === 0 ? 0.95 : 0.22}
              />
            ))}
          </g>
        );
      })}
      {!isShadow &&
        fretList
          .filter((f) => f < (frets?.[1] ?? 0))
          .map((f, i) => {
            const p0 = at(f, -gap * 1.1);
            const p1 = at(f, gap * 1.1);
            return (
              <g key={i}>
                {[-1.6, 1.6].map((o) => (
                  <line
                    key={o}
                    x1={p0[0] + tx * o}
                    y1={p0[1] + ty * o}
                    x2={p1[0] + tx * o}
                    y2={p1[1] + ty * o}
                    stroke={color.ash}
                    strokeWidth={1.1}
                  />
                ))}
              </g>
            );
          })}
    </g>
  );

  return (
    <svg viewBox={`0 0 ${FRAME.width} ${FRAME.height}`} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id={`${uid}-sblur`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={2.4} />
        </filter>
        {shadow?.clip && (
          <clipPath id={`${uid}-sclip`}>
            <circle cx={shadow.clip.cx} cy={shadow.clip.cy} r={shadow.clip.r} />
          </clipPath>
        )}
      </defs>
      {shadow && (
        <g clipPath={shadow.clip ? `url(#${uid}-sclip)` : undefined}>
          <g transform={`translate(${shadow.dx} ${shadow.dy})`} filter={`url(#${uid}-sblur)`}>
            {body(true)}
          </g>
        </g>
      )}
      {body(false)}
    </svg>
  );
};
