import React from "react";
import { color, count } from "../design/tokens";
import { bendCentre, type Strip } from "./geo";
import { IkatStrip } from "./Ikat";

// Rishtan plate abstraction (DRAFT — structure pending cultural register): milk slip ground,
// radial segment band = the ikat warp columns bent into a ring, ishkor/cobalt palette,
// centre medallion, rim band.

export const RISHTAN_SPECS = [
  { ground: color.milk, outer: color.ishkor, core: color.cobalt },
  { ground: color.milk, outer: color.cobalt, core: color.ishkor },
];

export const RishtanPlate: React.FC<{ readonly cx: number; readonly cy: number; readonly R: number; readonly bendT?: number }> = ({
  cx,
  cy,
  R,
  bendT = 1,
}) => {
  const inner = R * 0.36;
  const bandH = R * 0.5;
  const strip: Strip = { cx, baseY: cy - inner, W: 2 * Math.PI * inner, t: bendT };
  const [ox, oy] = bendCentre(strip);
  return (
    <g>
      <circle cx={cx} cy={cy} r={R} fill={color.milk} />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={color.cobalt} strokeWidth={R * 0.06} />
      <g transform={`translate(${cx - ox} ${cy - oy})`}>
        <IkatStrip strip={strip} columns={count.plateSegments} H={bandH} flames={1} specs={RISHTAN_SPECS} />
      </g>
      <circle cx={cx} cy={cy} r={inner * 0.78} fill={color.ishkor} />
      <circle cx={cx} cy={cy} r={inner * 0.36} fill={color.cobalt} />
    </g>
  );
};
