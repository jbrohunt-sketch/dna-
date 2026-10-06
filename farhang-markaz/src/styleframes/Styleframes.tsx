import React from "react";
import { AbsoluteFill } from "remotion";
import { CENTER, color, count, dancer, FRAME } from "../design/tokens";
import { sans } from "../design/fonts";
import { lerp, polar, type Pt } from "../shapes/geo";
import { Dancer } from "../shapes/Dancer";
import { HemBand } from "../shapes/Skirt";
import { Doppi } from "../shapes/Doppi";
import { BraidMass, spine, Tassel } from "../shapes/Braids";
import { Dutar } from "../shapes/Dutar";
import { COLUMN_SPECS, IkatStrip } from "../shapes/Ikat";

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
    <Dancer id="sf1" cx={FRAME0.cx} cy={FRAME0.cy} R={FRAME0.R} rotation={FRAME0.rotation} braidLag={22} />
  </Canvas>
);

// SF2 — T2→T3 in one continuous gesture, read top to bottom (camera has pushed in on the
// braid tail): the 2-strand hero braid peels from the tail, straightens and unzips into two
// dutar strings; its sochpopuk slides down to mark the pluck; the pluck's triangle repeats
// outward with decaying amplitude (the vibration spreading) and each echo lands as a warp
// thread that takes the ikat dye — centre columns first.
export const SF2Transform: React.FC = () => {
  const head = { x: 330, y: -40 };
  const Rc = 900; // close-up scale
  const masses = Array.from({ length: 5 }, (_, i) => {
    const spread = -30 + (36 * i) / 4;
    return spine(head.x, head.y, 90 + spread, 6 + i * 2, Rc * 0.1, Rc * (0.42 + 0.05 * Math.sin(i * 2.1)));
  });
  const unzipY = 640;
  const sx = CENTER.x;
  const hero: Pt[] = Array.from({ length: 24 }, (_, i) => {
    const t = i / 23;
    return [lerp(head.x + 70, sx, Math.sin((t * Math.PI) / 2)), lerp(head.y + 120, unzipY, t)];
  });
  const gap = 26;
  const warpTop = 1470;
  const cols = count.plateSegments;
  const x0 = 90;
  const x1 = 990;
  const pitch = (x1 - x0) / cols;
  const pluckAt = 0.62;
  const amp = 30;
  const pluckY = lerp(unzipY, warpTop, pluckAt);
  const echoTop = 930;
  const specs = COLUMN_SPECS;
  return (
    <Canvas>
      {masses.map((sp, i) => (
        <BraidMass key={i} sp={sp} w0={Rc * 0.06} w1={Rc * 0.034} strands={5} divider={4} />
      ))}
      <BraidMass sp={hero} w0={Rc * 0.05} w1={gap + 12} strands={2} divider={dancer.minFeature + 1} tassel={false} />
      <g transform={`translate(${head.x} ${head.y})`}>
        <Doppi size={dancer.doppi * Rc} keyline={6} />
      </g>
      {/* echoes: the pluck triangle repeated outward, amplitude decaying with distance */}
      {Array.from({ length: cols }, (_, i) => {
        const cx = x0 + pitch * (i + 0.5);
        const k = Math.abs(i - (cols - 1) / 2) - 0.5; // 0 for the two centre columns
        if (k < 0.5) return null;
        const top = echoTop + k * 26;
        const a = amp * Math.max(0.15, 1 - k / 6) * (cx < sx ? -1 : 1);
        return (
          <polyline
            key={i}
            points={`${cx},${top} ${cx + a},${pluckY} ${cx},${warpTop + 4}`}
            fill="none"
            stroke={color.ink}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
      {/* warp columns taking the dye: centre first, staggered fronts (whole-step offsets) */}
      {Array.from({ length: cols }, (_, i) => {
        const top = warpTop;
        const H = FRAME.height + 200 - top;
        return (
          <IkatStrip
            key={i}
            strip={{ cx: x0 + pitch * (i + 0.5), baseY: FRAME.height + 200, W: pitch, t: 0 }}
            columns={1}
            H={H}
            flames={4}
            misregister
            specs={[specs[i % specs.length]]}
          />
        );
      })}
      {/* unzipped strings with tied frets; the plucked one carries the sochpopuk at the pluck */}
      <Dutar a={[sx, unzipY]} b={[sx, warpTop + 4]} gap={gap} frets={7} fretSpan={0.3} pluck={{ at: pluckAt, amp: amp * 0.7 }} weight={6} />
      {/* Dutar offsets +gap/2 to the left for a downward string: the plucked string bows left */}
      <Tassel at={[sx - gap / 2 - amp * 0.7, pluckY]} dir={180} s={14} />
    </Canvas>
  );
};

// SF3 — identity: the hem band at frame 0, FARHANG / MARKAZ inside (markaz = centre),
// divided by the two dutar strings spanning the ring, one plucked.
export const SF3Identity: React.FC = () => {
  const { cx, cy, R, rotation } = FRAME0;
  const rIn = R * (0.97 - dancer.band);
  return (
    <AbsoluteFill style={{ backgroundColor: color.cream }}>
      <svg viewBox={`0 0 ${FRAME.width} ${FRAME.height}`} width={FRAME.width} height={FRAME.height} style={{ position: "absolute" }}>
        <HemBand cx={cx} cy={cy} R={R} rotation={rotation} />
        <Dutar a={polar(cx, cy, rIn, 180)} b={polar(cx, cy, rIn, 0)} gap={14} pluck={{ at: 0.34, amp: -7 }} weight={dancer.minFeature + 1} />
      </svg>
      {(["FARHANG", "MARKAZ"] as const).map((word, i) => (
        <div
          key={word}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: cy + (i === 0 ? -112 : 34),
            textAlign: "center",
            fontFamily: sans,
            fontWeight: 700,
            fontSize: 78,
            lineHeight: 1,
            letterSpacing: "0.02em",
            color: color.ink,
          }}
        >
          {word}
        </div>
      ))}
    </AbsoluteFill>
  );
};
