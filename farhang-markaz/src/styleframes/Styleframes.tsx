import React from "react";
import { AbsoluteFill } from "remotion";
import { CENTER, color, count, dancer, FRAME } from "../design/tokens";
import { sans } from "../design/fonts";
import { type Pt } from "../shapes/geo";
import { Dancer } from "../shapes/Dancer";
import { HemBand } from "../shapes/Skirt";
import { bundleShift, DyedThreads } from "../shapes/IkatThreads";
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
  const rIn = R * (1 - dancer.band);
  const cols = count.warpThreads;
  const pitch = (2 * rIn) / cols;
  const lw = dancer.lineWeight;
  const pluckY = cy + R * 0.18;
  const sigma = R * 0.75;
  const amp = 46;
  const plucked = cols / 2 - 1; // left string of the centre pair
  const H = FRAME.height;
  const threads = Array.from({ length: cols }, (_, i) => {
    const x = cx - rIn + pitch * (i + 0.5);
    const k = Math.abs(i - plucked);
    const a = amp * Math.exp(-k / 6);
    const at = (t: number): Pt => {
      const y = t * H;
      return [x + a * Math.exp(-(((y - pluckY) / sigma) ** 2)), y];
    };
    return { at, u: x - (cx - pitch * 1.5), misreg: bundleShift(i, 3, 0.012) };
  });
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
      <DyedThreads threads={dyed} motif={motifUp} width={pitch - 4} samples={480} />
      <HemBand cx={cx} cy={cy} R={R} />
    </Canvas>
  );
};

// SF3 — identity hold. The skirt at rest: a solid bold-blue disc (the hem band edge marked
// by one cream line) with the doppi tile at its centre (markaz = centre). In the loop
// handoff the tile eases to frame-0 size/rotation and the arms and braids bloom out of it.
// Wordmark cap height = hem band width. ◇ type pending the reference.
export const SF3Identity: React.FC = () => {
  const { cx, cy, R } = FRAME0;
  const band = R * dancer.band;
  const fontSize = band / 0.73; // Inter Tight cap height ≈ 0.73 em
  return (
    <AbsoluteFill style={{ backgroundColor: color.cream }}>
      <svg viewBox={`0 0 ${FRAME.width} ${FRAME.height}`} width={FRAME.width} height={FRAME.height} style={{ position: "absolute" }}>
        <circle cx={cx} cy={cy} r={R} fill={color.cobalt} />
        <circle cx={cx} cy={cy} r={R - band} fill="none" stroke={color.cream} strokeWidth={dancer.minFeature * 2} />
        <g transform={`translate(${cx} ${cy})`}>
          <Doppi size={R * 0.5} keyline={0} />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: cy + R + band * 1.4,
          textAlign: "center",
          fontFamily: sans,
          fontWeight: 700,
          fontSize,
          lineHeight: 1,
          letterSpacing: "0.04em",
          paddingLeft: "0.04em",
          color: color.ink,
        }}
      >
        FARHANG MARKAZ
      </div>
    </AbsoluteFill>
  );
};
