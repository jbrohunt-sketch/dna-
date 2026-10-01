import React from "react";
import { color } from "../design/tokens";
import { polar } from "../design/geometry";

// The path a sochpopuk tassel traces at full spin, kept as a single gold hairline.
export const GoldOrbit: React.FC<{
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
  readonly reveal: number; // 0..1 arc drawn
  readonly bead: number; // deg
  readonly opacity?: number;
}> = ({ cx, cy, radius, reveal, bead, opacity = 1 }) => {
  const C = 2 * Math.PI * radius;
  const [bx, by] = polar(cx, cy, radius, bead);
  return (
    <g opacity={opacity}>
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={color.gold}
        strokeWidth={1.1}
        strokeDasharray={`${C * reveal} ${C}`}
        transform={`rotate(${bead - reveal * 360} ${cx} ${cy})`}
        opacity={0.7}
      />
      <circle cx={bx} cy={by} r={4.5} fill={color.gold} />
    </g>
  );
};
