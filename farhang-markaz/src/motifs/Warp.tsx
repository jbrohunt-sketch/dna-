import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { FRAME, material } from "../design/tokens";
import { PixelCanvas } from "../render/PixelCanvas";
import { renderWarp } from "../render/warpShader";
import type { Pt } from "../design/geometry";

// The plucked string divides into a warp; ikat dye (resist-tied before weaving) appears
// thread by thread, then weft closes it into cloth.

type Props = {
  readonly from: Pt; // where the string ends and the fan starts
  readonly yTop: number; // threads become parallel here
  readonly x0: number;
  readonly x1: number;
  readonly y1: number;
  readonly count?: number;
  readonly dye?: number;
  readonly weave?: number;
  readonly weaveFrom?: number;
  readonly repeatsAcross?: number;
  readonly repeatH?: number;
  readonly pool: { readonly x: number; readonly y: number; readonly r: number };
};

export const Warp: React.FC<Props> = ({
  from,
  yTop,
  x0,
  x1,
  y1,
  count = 140,
  dye = 1,
  weave = 0,
  weaveFrom = y1,
  repeatsAcross = 4.5,
  repeatH = 300,
  pool,
}) => {
  const pitch = (x1 - x0) / count;
  const ox = Math.floor(x0);
  const oy = Math.floor(yTop);
  const W = Math.ceil(x1 - x0) + 1;
  const H = Math.ceil(y1 - yTop);
  const draw = useCallback(
    (img: ImageData) =>
      renderWarp(img, {
        ox,
        oy,
        x0,
        x1,
        yTop,
        count,
        repeatsAcross,
        repeatH,
        dye,
        dyeSpan: y1 - yTop,
        weaveFrom,
        weave,
        pool,
      }),
    [ox, oy, x0, x1, yTop, count, repeatsAcross, repeatH, dye, y1, weaveFrom, weave, pool],
  );
  const mid = (from[1] + yTop) / 2;
  return (
    <AbsoluteFill>
      <svg viewBox={`0 0 ${FRAME.width} ${FRAME.height}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="fanFade" gradientUnits="userSpaceOnUse" x1={0} y1={from[1]} x2={0} y2={yTop + 20}>
            <stop offset="0" stopColor={material.silk} stopOpacity={0.9} />
            <stop offset="1" stopColor={material.silk} stopOpacity={0.4} />
          </linearGradient>
        </defs>
        {Array.from({ length: count }, (_, i) => {
          const tx = x0 + pitch * (i + 0.5);
          const sx = from[0] + (i - count / 2) * 0.12;
          return (
            <path
              key={i}
              d={`M${sx} ${from[1]} C${sx} ${mid} ${tx} ${mid} ${tx} ${yTop + 20}`}
              fill="none"
              stroke="url(#fanFade)"
              strokeWidth={0.7}
            />
          );
        })}
      </svg>
      <PixelCanvas left={ox} top={oy} width={W} height={H} draw={draw} />
    </AbsoluteFill>
  );
};
