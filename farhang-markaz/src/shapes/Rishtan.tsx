import React from "react";
import { color, count, dancer } from "../design/tokens";
import { path, polar, subdivide, toPolar, type Strip } from "./geo";
import { flame, IkatStrip } from "./Ikat";

// Fergana-school plate, Rishtan palette (register R12): milk ground, dark zone outlines,
// cobalt + ishkor. Composition evidence is Fergana-school (V&A Kokand/Turkestan dishes;
// Gurumsaray); what is Rishtan-specific is the glaze/palette and floral bias.
// Centre = radiating four-lobed motif (documented on Fergana-school dishes) grown from the
// doppi's four bushes. Middle field = bodom leaves in compartments (the bent warp).
// Rim = checked band with 24 cells per row = the doira's 24 rings. Counts are stylisation.

export const RISHTAN_SPECS = [
  { ground: color.milk, outer: color.cobalt, core: color.ishkor },
  { ground: color.milk, outer: color.ishkor, core: color.cobalt },
];

export const RishtanPlate: React.FC<{ readonly cx: number; readonly cy: number; readonly R: number }> = ({ cx, cy, R }) => {
  const inner = R * 0.4;
  const fieldH = R * 0.42;
  const strip: Strip = { cx, baseY: cy - inner, W: 2 * Math.PI * inner, t: 1 };
  const outline = Math.max(1.5, R * 0.012);
  const cells = count.doiraRingPairs * 2;
  const rimIn = R * (1 - dancer.band);
  return (
    <g>
      <circle cx={cx} cy={cy} r={R} fill={color.milk} />
      {[0, 1].map((row) =>
        Array.from({ length: cells }, (_, i) => {
          if ((i + row) % 2) return null;
          const r0 = rimIn + row * (R - rimIn) * 0.5;
          const r1 = r0 + (R - rimIn) * 0.5;
          const a0 = (i * 360) / cells;
          const a1 = ((i + 1) * 360) / cells;
          const p = [polar(cx, cy, r0, a0), polar(cx, cy, r1, a0), polar(cx, cy, r1, a1), polar(cx, cy, r0, a1)];
          return <path key={`${row}-${i}`} d={path(p)} fill={color.cobalt} />;
        }),
      )}
      <IkatStrip strip={strip} columns={count.plateSegments} H={fieldH} flames={1} specs={RISHTAN_SPECS} smooth={1} dividers={color.ink} dividerWidth={outline} centreY={cy} />
      {[1, 1 - dancer.band, 0.4].map((k) => (
        <circle key={k} cx={cx} cy={cy} r={R * k - outline / 2} fill="none" stroke={color.ink} strokeWidth={outline} />
      ))}
      {/* four-lobed centre: the doppi's four bushes, grown into bodom lobes */}
      {[0, 90, 180, 270].map((a) => {
        const lobe = subdivide(flame(R * 0.2, R * 0.3, 5, 1), 3).map((p) => toPolar(p, cx, cy, a - 90, R * 0.05, R * 0.2));
        const leaf = subdivide(flame(R * 0.08, R * 0.16, 5, 1), 3).map(([u, h]) => toPolar([u, h + R * 0.06], cx, cy, a - 90, R * 0.05, R * 0.2));
        return (
          <g key={a}>
            <path d={path(lobe)} fill={color.cobalt} stroke={color.ink} strokeWidth={outline} />
            <path d={path(leaf)} fill={color.ishkor} />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={R * 0.07} fill={color.milk} stroke={color.ink} strokeWidth={outline} />
    </g>
  );
};
