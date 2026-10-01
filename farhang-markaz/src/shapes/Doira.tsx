import React from "react";
import { color, count } from "../design/tokens";
import { polar } from "./geo";

// Doira abstraction: cobalt rim ring, milk skin, an inner dotted ring of small rings in
// pairs (the rings hang on the frame), a flat strike ring synced to dum / tak.

export const Doira: React.FC<{
  readonly cx: number;
  readonly cy: number;
  readonly R: number;
  readonly rotation?: number;
  readonly rim?: number; // rim width as fraction of R
  readonly rings?: number; // 0..1 visibility
  readonly strike?: { readonly x: number; readonly y: number; readonly r: number; readonly w: number };
  readonly id: string;
}> = ({ cx, cy, R, rotation = 0, rim = 0.13, rings = 1, strike, id }) => {
  const pairs = count.doiraRingPairs;
  const rr = R * 0.032;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-skin`}>
          <circle cx={cx} cy={cy} r={R * (1 - rim)} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={R} fill={color.cobalt} />
      <circle cx={cx} cy={cy} r={R * (1 - rim)} fill={color.milk} />
      {strike && (
        <g clipPath={`url(#${id}-skin)`}>
          <circle cx={strike.x} cy={strike.y} r={strike.r} fill="none" stroke={color.red} strokeWidth={strike.w} />
        </g>
      )}
      <g opacity={rings}>
        {Array.from({ length: pairs * 2 }, (_, i) => {
          const a = rotation + (Math.floor(i / 2) * 360) / pairs + (i % 2) * 4.2;
          const [x, y] = polar(cx, cy, R * (1 - rim) - rr * 2.2, a);
          return <circle key={i} cx={x} cy={y} r={rr} fill="none" stroke={color.ink} strokeWidth={Math.max(2, rr * 0.45)} />;
        })}
      </g>
    </g>
  );
};
