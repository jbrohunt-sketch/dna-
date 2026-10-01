import React from "react";
import { color, material } from "../design/tokens";
import { Plait } from "../dancer/Braids";
import type { Pt } from "../design/geometry";

// Two silk strings of a dutar over a mulberry neck with tied gut frets.
// The top of the string is still a braid — the line it came from.

type Props = {
  readonly x: number;
  readonly y0: number;
  readonly y1: number;
  readonly gap?: number;
  readonly braidTo?: number; // y where plait turns into string
  readonly neck?: { readonly from: number; readonly to: number };
  readonly pluck?: { readonly y: number; readonly amp: number }; // vibration envelope
};

export const Dutar: React.FC<Props> = ({ x, y0, y1, gap = 24, braidTo, neck, pluck }) => {
  const strings = [x - gap / 2, x + gap / 2];
  const L = y1 - y0;
  // tied frets: chromatic spacing from the nut
  const frets = neck
    ? Array.from({ length: 13 }, (_, i) => neck.from + (neck.to - neck.from) * (1 - Math.pow(2, -i / 12)) * 2.0)
        .filter((fy) => fy < neck.to)
    : [];

  const envelope = (sx: number) => {
    if (!pluck) return null;
    const pts: string[] = [];
    const back: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const u = i / 60;
      const y = y0 + L * u;
      // pluck shape: triangle peaked at the plucking point, softened
      const up = (pluck.y - y0) / L;
      const tri = u < up ? u / up : (1 - u) / (1 - up);
      const a = pluck.amp * Math.pow(Math.max(0, tri), 0.9);
      pts.push(`${sx + a},${y}`);
      back.unshift(`${sx - a},${y}`);
    }
    return `M${pts.join(" L")} L${back.join(" L")} Z`;
  };

  return (
    <g>
      {neck && (
        <>
          <defs>
            <linearGradient id="neckFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={material.walnutLight} stopOpacity={0} />
              <stop offset="0.15" stopColor={material.walnutLight} stopOpacity={1} />
              <stop offset="0.85" stopColor={material.walnut} stopOpacity={1} />
              <stop offset="1" stopColor={material.walnut} stopOpacity={0} />
            </linearGradient>
          </defs>

          {frets.map((fy, i) => (
            <g key={i} opacity={0.8}>
              <line x1={x - 22} x2={x + 22} y1={fy - 1.6} y2={fy - 1.6} stroke={color.ash} strokeWidth={1.1} />
              <line x1={x - 22} x2={x + 22} y1={fy + 1.6} y2={fy + 1.6} stroke={color.ash} strokeWidth={1.1} />
            </g>
          ))}
        </>
      )}
      {strings.map((sx, i) => {
        const env = envelope(sx);
        const plaitPts: Pt[] = braidTo
          ? Array.from({ length: 16 }, (_, k) => [sx + Math.sin(k * 0.9 + i) * (1 - k / 15) * 10, y0 + ((braidTo - y0) * k) / 15] as Pt)
          : [];
        return (
          <g key={i}>
            {braidTo && <Plait pts={plaitPts} width={7} />}
            {env && <path d={env} fill={material.silk} opacity={0.16} />}
            <line
              x1={sx}
              x2={sx}
              y1={braidTo ?? y0}
              y2={y1}
              stroke={material.silk}
              strokeWidth={1.8}
              opacity={0.95}
            />
          </g>
        );
      })}
      {pluck && (
        <circle cx={x + gap / 2 + pluck.amp} cy={pluck.y} r={3} fill={color.bone} opacity={0.9} />
      )}
    </g>
  );
};
