import React from "react";
import { color } from "../design/tokens";

// Chust doppi from above: four-sided black skullcap with white qalampir (pepper-pod)
// motifs on each face and a white crown border. Satin-black, lit from the key.

const qalampir = "M-12 2.5 C-7 -6.5 6 -7.5 12 -1.5 C9 0.8 5 2 1.5 1.2 C-3 0.4 -6.5 2.4 -12 2.5 Z";

export const Doppi: React.FC<{ readonly size?: number; readonly uid: string }> = ({ size = 70, uid }) => {
  const h = size / 2;
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-dp`} cx="32%" cy="28%" r="80%">
          <stop offset="0" stopColor="#34343A" />
          <stop offset="0.45" stopColor="#111114" />
          <stop offset="1" stopColor="#050506" />
        </radialGradient>
      </defs>
      <rect x={-h} y={-h} width={size} height={size} rx={size * 0.26} fill={`url(#${uid}-dp)`} />
      <rect
        x={-h + 9}
        y={-h + 9}
        width={size - 18}
        height={size - 18}
        rx={size * 0.15}
        fill="none"
        stroke={color.bone}
        strokeWidth={1.2}
        strokeDasharray="2.2 1.6"
        opacity={0.9}
      />
      {[0, 90, 180, 270].map((r) => (
        <g key={r} transform={`rotate(${r}) translate(0 ${-h + 4.6}) scale(0.8)`}>
          <path d={qalampir} fill={color.bone} />
          <path d="M-7 1 C-3 -3 3 -4 8 -1" stroke="#0A0A0C" strokeWidth={0.9} fill="none" />
        </g>
      ))}
    </g>
  );
};
