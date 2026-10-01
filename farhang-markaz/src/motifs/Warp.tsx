import React, { useMemo } from "react";
import { color, material } from "../design/tokens";
import { rng } from "../design/geometry";

// The plucked string divides into a warp. Ikat (abr) dye is resist-tied onto the warp
// BEFORE weaving, so each thread carries a slightly misregistered slice of the motif —
// that misregistration is what makes ikat edges feather.

type Props = {
  readonly xTop: number;
  readonly yTop: number;
  readonly fanEnd: number;
  readonly x0: number;
  readonly x1: number;
  readonly y1: number;
  readonly count?: number;
  readonly dye?: number; // 0..1 reveal, top → bottom
  readonly weave?: number; // 0..1 weft reveal, bottom → top
  readonly weaveFrom?: number;
};

const motifAt = (x: number, y: number, cx: number) => {
  const w = 190;
  const h = 300;
  const dx = Math.abs(((x - cx + w * 10.5) % w) - w / 2) / (w / 2);
  const row = Math.floor(y / h);
  const dy = Math.abs((((y % h) + h) % h) - h / 2) / (h / 2);
  const d = dx + dy;
  const alt = row % 2;
  if (d < 0.28) return color.bone;
  if (d < 0.55) return alt ? color.ruby : color.emerald;
  if (d < 0.8) return alt ? color.lapis : color.pomegranate;
  return null;
};

export const Warp: React.FC<Props> = ({
  xTop,
  yTop,
  fanEnd,
  x0,
  x1,
  y1,
  count = 64,
  dye = 1,
  weave = 0,
  weaveFrom,
}) => {
  const pitch = (x1 - x0) / count;
  const threads = useMemo(() => {
    const rand = rng(33);
    return Array.from({ length: count }, (_, i) => {
      const x = x0 + pitch * (i + 0.5);
      const shift = (rand() - 0.5) * 18 + Math.sin(i * 0.7) * 4;
      const segs: { y: number; h: number; c: string }[] = [];
      let cur: { y: number; h: number; c: string } | null = null;
      for (let y = fanEnd; y < y1; y += 2) {
        const c = motifAt(x, y - fanEnd + shift + 10, (x0 + x1) / 2);
        if (c && cur && cur.c === c) cur.h += 2;
        else {
          if (cur) segs.push(cur);
          cur = c ? { y, h: 2, c } : null;
        }
      }
      if (cur) segs.push(cur);
      return { x, segs };
    });
  }, [count, x0, x1, y1, fanEnd, pitch]);

  const dyeLimit = fanEnd + dye * (y1 - fanEnd);
  const wFrom = weaveFrom ?? fanEnd;
  const weaveLimit = y1 - weave * (y1 - wFrom);
  const tw = pitch * 0.7;

  return (
    <g>
      <defs>
        <filter id="warpBleed" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="0.4 3.2" />
        </filter>
      </defs>
      {threads.map((t, i) => {
        const sx = xTop + (i - count / 2) * 0.5;
        const mid = (yTop + fanEnd) / 2;
        return (
          <g key={i}>
            <path
              d={`M${sx} ${yTop} C${sx} ${mid} ${t.x} ${mid} ${t.x} ${fanEnd} L${t.x} ${y1}`}
              fill="none"
              stroke={material.silk}
              strokeWidth={0.9}
              opacity={0.45}
            />
            <g filter="url(#warpBleed)">
            {t.segs
              .filter((s) => s.y < dyeLimit)
              .map((s, k) => (
                <rect
                  key={k}
                  x={t.x - tw / 2}
                  y={s.y}
                  width={tw}
                  height={Math.min(s.h, dyeLimit - s.y)}
                  fill={s.c}
                />
              ))}
            </g>
          </g>
        );
      })}
      {weave > 0 &&
        Array.from({ length: Math.floor((y1 - weaveLimit) / 8) }, (_, r) => {
          const y = y1 - r * 8;
          return (
            <g key={r}>
              <line x1={x0} x2={x1} y1={y} y2={y} stroke={color.night} strokeWidth={2.4} opacity={0.55} />
              {threads.map((t, i) =>
                (i + r) % 2 ? null : (
                  <rect key={i} x={t.x - tw / 2 - 0.5} y={y - 1.6} width={tw + 1} height={3.2} fill="#000" opacity={0.28} />
                ),
              )}
            </g>
          );
        })}
    </g>
  );
};
