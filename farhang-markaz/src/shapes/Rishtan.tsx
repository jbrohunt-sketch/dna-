import React from "react";
import { color, count } from "../design/tokens";
import { polar, type Strip } from "./geo";
import { IkatStrip } from "./Ikat";

// Rishtan plate (Fergana) — register R12: milk ground, dark outlines between zones,
// cobalt + ishkor, mainly floral. Centre = cinquefoil rosette; middle field = radiating
// almond leaves (bodom), each in its own compartment; rim = checked band.
// 12 compartments = skirt panels = warp columns (shared-count design choice, not documented).

export const RISHTAN_SPECS = [
  { ground: color.milk, outer: color.cobalt, core: color.ishkor },
  { ground: color.milk, outer: color.ishkor, core: color.cobalt },
];

export const RishtanPlate: React.FC<{ readonly cx: number; readonly cy: number; readonly R: number }> = ({ cx, cy, R }) => {
  const inner = R * 0.4;
  const fieldH = R * 0.43;
  const strip: Strip = { cx, baseY: cy - inner, W: 2 * Math.PI * inner, t: 1 };
  const outline = Math.max(1.5, R * 0.012);
  const cells = 48;
  return (
    <g>
      <circle cx={cx} cy={cy} r={R} fill={color.milk} />
      {/* checked rim band, two offset rows */}
      {[0, 1].map((row) =>
        Array.from({ length: cells }, (_, i) => {
          if ((i + row) % 2) return null;
          const r0 = R * (0.84 + row * 0.05);
          const r1 = r0 + R * 0.05;
          const a0 = (i * 360) / cells;
          const a1 = ((i + 1) * 360) / cells;
          const p = [polar(cx, cy, r0, a0), polar(cx, cy, r1, a0), polar(cx, cy, r1, a1), polar(cx, cy, r0, a1)];
          return <path key={`${row}-${i}`} d={`M${p.map((q) => q.join(" ")).join(" L")} Z`} fill={color.cobalt} />;
        }),
      )}
      <circle cx={cx} cy={cy} r={R * 0.97} fill="none" stroke={color.cobalt} strokeWidth={R * 0.06} />
      {/* middle field: the warp bent into a ring; flames smoothed into bodom leaves */}
      <IkatStrip strip={strip} columns={count.plateSegments} H={fieldH} flames={1} specs={RISHTAN_SPECS} smooth={1} dividers={color.ink} centreY={cy} />
      {/* dark zone outlines */}
      {[0.84, 0.94, 0.4].map((k) => (
        <circle key={k} cx={cx} cy={cy} r={R * k} fill="none" stroke={color.ink} strokeWidth={outline} />
      ))}
      {/* cinquefoil rosette */}
      {Array.from({ length: 5 }, (_, i) => {
        const [x, y] = polar(cx, cy, R * 0.17, i * 72 - 90);
        return <circle key={i} cx={x} cy={y} r={R * 0.12} fill={color.cobalt} stroke={color.ink} strokeWidth={outline} />;
      })}
      <circle cx={cx} cy={cy} r={R * 0.1} fill={color.ishkor} stroke={color.ink} strokeWidth={outline} />
    </g>
  );
};
