import React from "react";
import { color, material } from "../design/tokens";

// Chust doppi seen from above: four-sided black skullcap, white qalampir (pepper-pod)
// motifs on each face, thin white crown border.

const qalampir = "M-11 2 C-6 -6 6 -7 11 -1 C8 1 4 2 1 1 C-3 0 -6 2 -11 2 Z";

export const Doppi: React.FC<{ readonly size?: number }> = ({ size = 70 }) => {
  const h = size / 2;
  return (
    <g>
      <rect x={-h} y={-h} width={size} height={size} rx={size * 0.24} fill={material.doppi} />
      <rect
        x={-h + 9}
        y={-h + 9}
        width={size - 18}
        height={size - 18}
        rx={size * 0.14}
        fill="none"
        stroke={color.bone}
        strokeWidth={1.3}
        opacity={0.85}
      />
      {[0, 90, 180, 270].map((r) => (
        <g key={r} transform={`rotate(${r}) translate(0 ${-h + 4.5}) scale(0.82)`}>
          <path d={qalampir} fill={color.bone} />
        </g>
      ))}
      <circle r={2.2} fill={color.bone} opacity={0.9} />
    </g>
  );
};
