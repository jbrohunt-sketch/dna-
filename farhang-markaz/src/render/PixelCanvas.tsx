import React, { useLayoutEffect, useRef } from "react";

// A canvas layer filled by a per-pixel shader. Drawn synchronously in a layout effect,
// so the frame is complete before Remotion captures it.
export const PixelCanvas: React.FC<{
  readonly left: number;
  readonly top: number;
  readonly width: number; // backing pixels
  readonly height: number;
  readonly scale?: number; // CSS px per backing pixel
  readonly draw: (img: ImageData) => void;
  readonly style?: React.CSSProperties;
}> = ({ left, top, width, height, scale = 1, draw, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(width, height);
    draw(img);
    ctx.putImageData(img, 0, 0);
  });
  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{ position: "absolute", left, top, width: width * scale, height: height * scale, ...style }}
    />
  );
};
