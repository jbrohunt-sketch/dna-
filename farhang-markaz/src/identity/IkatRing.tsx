import React, { useCallback } from "react";
import { dancer } from "../design/tokens";
import { PixelCanvas } from "../render/PixelCanvas";
import { renderSkirt } from "../render/skirtShader";

// The identity ring is the skirt's hem band: same ikat, same threads, nearly flat folds.
// Outer radius = dancer.skirtRadius, so the last frame blooms back into the first.
export const IkatRing: React.FC<{
  readonly cx: number;
  readonly cy: number;
  readonly radius?: number;
  readonly width?: number;
  readonly rotation?: number;
  readonly foldDepth?: number;
}> = ({ cx, cy, radius = dancer.skirtRadius, width = 24, rotation = 0, foldDepth = 0.22 }) => {
  const S = Math.ceil(radius * 2.1) + 4;
  const draw = useCallback(
    (img: ImageData) =>
      renderSkirt(img, {
        cx: S / 2,
        cy: S / 2,
        R: radius,
        innerR: radius - width,
        rotation,
        foldDepth,
        hemAmp: 0.005,
        exposure: 0.9,
      }),
    [S, radius, width, rotation, foldDepth],
  );
  return <PixelCanvas left={cx - S / 2} top={cy - S / 2} width={S} height={S} draw={draw} />;
};
