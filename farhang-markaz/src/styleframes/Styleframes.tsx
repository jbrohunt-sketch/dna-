import React from "react";
import { AbsoluteFill } from "remotion";
import { CENTER, color, count, dancer, FRAME } from "../design/tokens";
import { sans } from "../design/fonts";
import { type Pt } from "../shapes/geo";
import { Dancer } from "../shapes/Dancer";
import { HemBand } from "../shapes/Skirt";
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
  const pluckY = cy + R * 0.18;
  const sigma = R * 0.75;
  const amp = 46;
  const H = FRAME.height;
  const threads = Array.from({ length: cols }, (_, i) => {
    const x = cx - R + pitch * (i + 0.5);
    const k = Math.abs(i - (cols - 1) / 2) - 0.5; // 0 = the plucked centre pair (the strings)
    const a = amp * Math.exp(-k / 6);
    const at = (t: number): Pt => {
      const y = t * H;
      return [x + a * Math.exp(-(((y - pluckY) / sigma) ** 2)), y];
    };
    return { at, u: x - cx, misreg: symmetricShift(i, cols, 3, 0.014) };
  });
  const rIn = R * (1 - dancer.band);
  const motif = { t0: (cy - rIn * 0.78) / H, t1: (cy + rIn * 0.7) / H, half: rIn * 0.5 };
  // flame points up the warp: invert t so its base is at the bottom
  const dyed = threads.map((t) => ({ ...t, at: (tt: number) => t.at(1 - tt) }));
  const motifUp = { t0: 1 - motif.t1, t1: 1 - motif.t0, half: motif.half };
  return (
    <Canvas>
      {threads.map((t, i) => (
        <polyline
          key={i}
          points={Array.from({ length: 97 }, (_, k) => t.at(k / 96))
            .map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`)
            .join(" ")}
          fill="none"
          stroke={color.ink}
          strokeWidth={lw}
        />
      ))}
      {/* resist-dye changes the thread itself: dye is exactly thread-width, on the thread path */}
      <DyedThreads threads={dyed} motif={motifUp} width={lw} samples={480} />
      <HemBand cx={cx} cy={cy} R={R} />
    </Canvas>
  );
};

// SF3 — identity hold. The skirt at rest: a solid bold-blue disc; its inner ring is the
// plucked string closed into a circle (string weight + colour). The doppi at the centre
// (markaz = centre) is ≥ 30% of the disc. In the loop handoff it eases to frame-0 size and
// rotation while the arms and braids bloom out of it. ◇ type pending the reference.
export const SF3Identity: React.FC = () => {
  const { cx, cy, R } = FRAME0;
  const band = R * dancer.band;
  const capSize = R * 0.62;
  const rIn = R - band;
  return (
    <Canvas>
      <circle cx={cx} cy={cy} r={R} fill={color.cobalt} />
      <circle cx={cx} cy={cy} r={rIn} fill="none" stroke={color.ink} strokeWidth={dancer.lineWeight} />
      <g transform={`translate(${cx} ${cy})`}>
        <Doppi size={capSize} keyline={0} />
      </g>
      <text
        x={cx - rIn}
        y={cy + R + capSize}
        textLength={2 * rIn}
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
