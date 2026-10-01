import React from "react";
import { AbsoluteFill } from "remotion";
import { color, FRAME } from "../design/tokens";

const VB = `0 0 ${FRAME.width} ${FRAME.height}`;

// A full-frame SVG layer, for stacking between canvas layers.
export const Layer: React.FC<{ readonly children: React.ReactNode; readonly style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <svg viewBox={VB} style={{ position: "absolute", inset: 0, ...style }}>
    {children}
  </svg>
);

// Dark ground, one overhead pool of light, film grain and a soft vignette.
export const Stage: React.FC<{
  readonly children: React.ReactNode;
  readonly poolX?: number;
  readonly poolY?: number;
  readonly poolR?: number;
  readonly poolStrength?: number;
}> = ({ children, poolX = FRAME.width / 2, poolY = FRAME.height / 2, poolR = 760, poolStrength = 1 }) => (
  <AbsoluteFill style={{ backgroundColor: color.ink }}>
    <Layer>
      <defs>
        <radialGradient id="pool" gradientUnits="userSpaceOnUse" cx={poolX} cy={poolY} r={poolR}>
          <stop offset="0" stopColor="#1A1E29" stopOpacity={poolStrength} />
          <stop offset="0.45" stopColor={color.night} stopOpacity={poolStrength * 0.8} />
          <stop offset="1" stopColor={color.ink} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={FRAME.width} height={FRAME.height} fill="url(#pool)" />
    </Layer>
    {children}
    <Layer style={{ pointerEvents: "none" }}>
      <defs>
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0" />
        </filter>
        <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
          <stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.55} />
        </radialGradient>
      </defs>
      <rect width={FRAME.width} height={FRAME.height} filter="url(#grain)" />
      <rect width={FRAME.width} height={FRAME.height} fill="url(#vignette)" />
    </Layer>
  </AbsoluteFill>
);
