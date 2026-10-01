import React from "react";
import { AbsoluteFill } from "remotion";
import { color, FRAME } from "../design/tokens";

// Dark ground with a single overhead pool of light — the "stage" every scene shares.
export const Stage: React.FC<{
  readonly children: React.ReactNode;
  readonly poolX?: number;
  readonly poolY?: number;
  readonly poolR?: number;
  readonly overlay?: React.ReactNode;
}> = ({ children, poolX = FRAME.width / 2, poolY = FRAME.height / 2, poolR = 760, overlay }) => (
  <AbsoluteFill style={{ backgroundColor: color.ink }}>
    <svg width={FRAME.width} height={FRAME.height} viewBox={`0 0 ${FRAME.width} ${FRAME.height}`}>
      <defs>
        <radialGradient id="pool" gradientUnits="userSpaceOnUse" cx={poolX} cy={poolY} r={poolR}>
          <stop offset="0" stopColor={color.night} stopOpacity={1} />
          <stop offset="0.6" stopColor={color.night} stopOpacity={0.55} />
          <stop offset="1" stopColor={color.ink} stopOpacity={0} />
        </radialGradient>
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={4} stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0" />
        </filter>
      </defs>
      <rect width={FRAME.width} height={FRAME.height} fill="url(#pool)" />
      {children}
      <rect width={FRAME.width} height={FRAME.height} filter="url(#grain)" />
    </svg>
    {overlay}
  </AbsoluteFill>
);
