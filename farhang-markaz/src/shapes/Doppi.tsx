import React from "react";
import { color } from "../design/tokens";

// Women's Fergana square doppi seen from above (DRAFT — pending cultural register):
// four-fold square, one chamanda gul motif (green bush + pink flower) per face, rotated 90°.

const Gul: React.FC<{ readonly s: number }> = ({ s }) => (
  <g>
    {/* bush: three leaves fanning outward */}
    {[-38, 0, 38].map((a) => (
      <ellipse key={a} cx={0} cy={s * 0.13} rx={s * 0.05} ry={s * 0.12} fill={color.leaf} transform={`rotate(${a} 0 0)`} />
    ))}
    <circle cx={0} cy={s * 0.28} r={s * 0.075} fill={color.pink} />
    <circle cx={0} cy={s * 0.28} r={s * 0.026} fill={color.red} />
  </g>
);

export const Doppi: React.FC<{ readonly size: number; readonly keyline?: number }> = ({ size, keyline = 6 }) => {
  const h = size / 2;
  return (
    <g>
      <rect x={-h} y={-h} width={size} height={size} rx={size * 0.22} fill={color.ink} stroke={color.cream} strokeWidth={keyline} />
      {[0, 90, 180, 270].map((r) => (
        <g key={r} transform={`rotate(${r}) translate(0 ${h * 0.86})`}>
          <g transform="scale(0.8 -0.8)">
            <Gul s={size} />
          </g>
        </g>
      ))}
    </g>
  );
};
