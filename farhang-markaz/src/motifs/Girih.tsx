import React, { useMemo } from "react";
import { color } from "../design/tokens";
import { polar, toPath, type Pt } from "../design/geometry";

// Star-and-cross linework (khatam, eight-point star) — as in Timurid glazed-tile
// revetments (Samarkand, Bukhara). Rendered as double strapwork lines, never filled.

const star = (cx: number, cy: number, ro: number) => {
  const ri = ro * Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8);
  const pts: Pt[] = [];
  for (let k = 0; k < 16; k++) pts.push(polar(cx, cy, k % 2 ? ri : ro, k * 22.5));
  return toPath(pts, true);
};

type Props = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly cell?: number;
  readonly opacity?: number;
  readonly stroke?: string;
  readonly rotation?: number;
  readonly originX?: number;
  readonly originY?: number;
};

export const Girih: React.FC<Props> = ({
  x,
  y,
  width,
  height,
  cell = 120,
  opacity = 1,
  stroke = color.turquoise,
  rotation = 0,
  originX,
  originY,
}) => {
  const ox = originX ?? x + width / 2;
  const oy = originY ?? y + height / 2;
  const paths = useMemo(() => {
    const out: string[] = [];
    const span = Math.ceil(Math.hypot(width, height) / cell) + 1;
    for (let i = -span; i <= span; i++)
      for (let j = -span; j <= span; j++) {
        const cx = ox + i * cell;
        const cy = oy + j * cell;
        const ro = cell * 0.5 / Math.cos(Math.PI / 8);
        out.push(star(cx, cy, ro * 0.98));
        out.push(star(cx, cy, ro * 0.8));
      }
    return out;
  }, [width, height, cell, ox, oy]);
  const id = `girih-${Math.round(x)}-${Math.round(y)}-${Math.round(width)}`;
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={id}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <g transform={`rotate(${rotation} ${ox} ${oy})`}>
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={stroke} strokeWidth={i % 2 ? 0.9 : 1.4} />
          ))}
        </g>
      </g>
    </g>
  );
};
