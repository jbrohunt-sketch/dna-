import React from "react";
import { AbsoluteFill } from "remotion";
import { CENTER, color, count, dancer, FRAME } from "../design/tokens";
import { sans } from "../design/fonts";
import { type Pt } from "../shapes/geo";
import { Dancer } from "../shapes/Dancer";
import { DyedThreads, symmetricShift } from "../shapes/IkatThreads";
import { Doppi } from "../shapes/Doppi";

// Phase 3 styleframes (v3 graphic direction). Frame-0 constants are shared by SF1 and SF3 so
// the identity ring is exactly the opening hem band (loop anchor).
export const FRAME0 = { cx: CENTER.x, cy: CENTER.y, R: dancer.R, rotation: 28 } as const;

const Canvas: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ backgroundColor: color.cream }}>
    <svg viewBox={`0 0 ${FRAME.width} ${FRAME.height}`} width={FRAME.width} height={FRAME.height}>
      {children}
    </svg>
  </AbsoluteFill>
);

// SF1 — frame 0: mid-spin, overhead, nothing else in the world yet.
export const SF1Spin: React.FC = () => (
  <Canvas>
    <Dancer id="sf1" cx={FRAME0.cx} cy={FRAME0.cy} R={FRAME0.R} rotation={FRAME0.rotation} />
  </Canvas>
);

// SF2 — the T2→T3 hinge as ONE object: full-height warp threads seen through the frame-0
// ring (the doira rim the world has kept). The pluck bends every thread the same way along
// one smooth curve, decaying away from the plucked pair (the dutar strings). Abrbandi: one
// stepped flame is resist-dyed across the threads, offset per bundle of three.
export const SF2Transform: React.FC = () => {
  const { cx, cy, R } = FRAME0;
  const cols = count.warpThreads;
  const pitch = (2 * R) / cols; // field edges = disc edges
  const lw = dancer.lineWeight;
  const H = FRAME.height;
  const amp = 58;
  const plucked = cols / 2 - 1; // ONE string at full amplitude
  const y0 = cy - R;
  const y1 = cy + R;
  const threads = Array.from({ length: cols }, (_, i) => {
    const x = cx - R + pitch * (i + 0.5);
    const k = Math.abs(i - plucked);
    const a = k > 6 ? 0 : amp * Math.exp(-k / 1.4); // neighbours bend less; far threads straight
    const at = (t: number): Pt => {
      const y = t * H;
      const s = y > y0 && y < y1 ? Math.sin((Math.PI * (y - y0)) / (y1 - y0)) ** 2 : 0; // raised cosine: no corners
      return [x + a * s, y];
    };
    return { at, u: x - (cx - pitch / 2), misreg: symmetricShift(i, cols, 2, 0.02) };
  });
  const rIn = R * (1 - dancer.band);
  const motifLen = rIn * 1.5;
  const t0 = (cy - motifLen / 2) / H;
  const motifUp = { t0: 1 - (t0 + motifLen / H), t1: 1 - t0, half: motifLen / 2 / dancer.ikatAspect * 2 };
  const dyed = threads.map((t) => ({ ...t, at: (tt: number) => t.at(1 - tt) }));
  return (
    <Canvas>
      {threads.map((t, i) => (
        <polyline
          key={i}
          points={Array.from({ length: 193 }, (_, k) => t.at(k / 192))
            .map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`)
            .join(" ")}
          fill="none"
          stroke={i === plucked ? color.ink : color.sky}
          strokeWidth={lw}
        />
      ))}
      {/* resist-dye changes the thread itself: dye is exactly thread-width, on the thread path */}
      <DyedThreads threads={dyed} motif={motifUp} width={lw} samples={480} />
      <circle cx={cx} cy={cy} r={R - (R * dancer.band) / 4} fill="none" stroke={color.cobalt} strokeWidth={(R * dancer.band) / 2} />
    </Canvas>
  );
};

// SF3 — identity hold. The skirt at rest: a solid bold-blue disc; its inner ring is the
// plucked string closed into a circle (string weight + colour). The doppi at the centre
// (markaz = centre) is ≥ 30% of the disc. In the loop handoff it eases to frame-0 size and
// rotation while the arms and braids bloom out of it. ◇ type pending the reference.
export const SF3Identity: React.FC = () => {
  const { cx, cy, R } = FRAME0;
  const capSize = R * 0.7;
  return (
    <Canvas>
      <circle cx={cx} cy={cy} r={R} fill={color.cobalt} />
      {/* tilted to the frame-0 rotation: it implies the spin and is the loop's start pose */}
      <g transform={`translate(${cx} ${cy}) rotate(${FRAME0.rotation})`}>
        <Doppi size={capSize} keyline={0} />
      </g>
      <text
        x={cx - R}
        y={cy - R - 150}
        textLength={2 * R}
        lengthAdjust="spacing"
        fontFamily={sans}
        fontWeight={600}
        fontSize={84}
        fill={color.ink}
      >
        FARHANG MARKAZ
      </text>
    </Canvas>
  );
};
