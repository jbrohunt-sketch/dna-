import React from "react";
import { color, dancer } from "../design/tokens";

// Women's square doppi seen from above — register R2 (Med): four identical floral-bush motifs
// of the chamanda gul type (Margilan / Tashkent, mid-20th c.), one per edge, stems toward the
// centre, band border. Bushes fill ~65% of each face so the pink survives at thumbnail size.
// Flower count (3) and ground colour are stylisation.

const Bush: React.FC<{ readonly s: number }> = ({ s }) => (
  // local −y points toward the cap's edge
  <g>
    <line x1={0} y1={s * 0.07} x2={0} y2={-s * 0.06} stroke={color.ishkor} strokeWidth={Math.max(dancer.minFeature, s * 0.03)} strokeLinecap="round" />
    {[-1, 1].map((d) => (
      <ellipse
        key={d}
        cx={d * s * 0.06}
        cy={s * 0.02}
        rx={s * 0.035}
        ry={s * 0.075}
        fill={color.ishkor}
        transform={`rotate(${d * 52} ${d * s * 0.06} ${s * 0.02})`}
      />
    ))}
    {/* one flower silhouette: three tightly merged lobes */}
    {[
      [-0.05, -0.1],
      [0, -0.125],
      [0.05, -0.1],
      [0, -0.085],
    ].map(([x, y], i) => (
      <circle key={i} cx={x * s * 1.15} cy={y * s * 1.1} r={s * 0.075} fill={color.pink} />
    ))}
  </g>
);

export const Doppi: React.FC<{ readonly size: number; readonly keyline?: number; readonly ground?: "ink" | "milk"; readonly band?: boolean }> = ({
  size,
  keyline = 6,
  ground = "milk",
  band: showBand = true,
}) => {
  const h = size / 2;
  const fill = ground === "ink" ? color.ink : color.milk;
  const band = ground === "ink" ? color.milk : color.ink;
  return (
    <g>
      <rect x={-h} y={-h} width={size} height={size} rx={size * 0.15} fill={fill} stroke={color.cream} strokeWidth={keyline} />
      {showBand && <rect
        x={-h + size * 0.055}
        y={-h + size * 0.055}
        width={size * 0.89}
        height={size * 0.89}
        rx={size * 0.11}
        fill="none"
        stroke={band}
        strokeWidth={Math.max(1, size * 0.03)}
      />}
      {[0, 90, 180, 270].map((r) => (
        <g key={r} transform={`rotate(${r}) translate(0 ${-size * 0.2})`}>
          <Bush s={size} />
        </g>
      ))}
    </g>
  );
};
