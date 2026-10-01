import React from "react";
import { color } from "../design/tokens";

// Women's square doppi seen from above — register R2 (Med): four identical floral-bush
// motifs of the chamanda gul type (Margilan / Tashkent, mid-20th c.), one per edge, stems
// toward the centre, thin band border, dark ground. Flower count and ground are stylisation.

const Bush: React.FC<{ readonly s: number }> = ({ s }) => (
  // local −y points toward the cap's edge
  <g>
    <line x1={0} y1={s * 0.1} x2={0} y2={-s * 0.03} stroke={color.leaf} strokeWidth={s * 0.022} strokeLinecap="round" />
    {[-1, 1].map((d) => (
      <ellipse key={d} cx={d * s * 0.045} cy={s * 0.035} rx={s * 0.022} ry={s * 0.05} fill={color.leaf} transform={`rotate(${d * 48} ${d * s * 0.045} ${s * 0.035})`} />
    ))}
    {[
      [-0.068, -0.045],
      [0, -0.075],
      [0.068, -0.045],
    ].map(([x, y], i) => (
      <circle key={i} cx={x * s} cy={y * s} r={s * 0.038} fill={color.pink} />
    ))}
  </g>
);

export const Doppi: React.FC<{ readonly size: number; readonly keyline?: number }> = ({ size, keyline = 6 }) => {
  const h = size / 2;
  return (
    <g>
      <rect x={-h} y={-h} width={size} height={size} rx={size * 0.22} fill={color.ink} stroke={color.cream} strokeWidth={keyline} />
      <rect
        x={-h + size * 0.06}
        y={-h + size * 0.06}
        width={size * 0.88}
        height={size * 0.88}
        rx={size * 0.17}
        fill="none"
        stroke={color.milk}
        strokeWidth={Math.max(0.8, size * 0.018)}
      />
      {[0, 90, 180, 270].map((r) => (
        <g key={r} transform={`rotate(${r}) translate(0 ${-h * 0.56})`}>
          <Bush s={size} />
        </g>
      ))}
    </g>
  );
};
