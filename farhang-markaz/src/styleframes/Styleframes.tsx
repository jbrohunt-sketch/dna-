import React from "react";
import { AbsoluteFill } from "remotion";
import { CENTER, color, count, dancer, FRAME } from "../design/tokens";
import { sans } from "../design/fonts";
import { type Pt } from "../shapes/geo";
import { Dancer } from "../shapes/Dancer";
import { HemBand } from "../shapes/Skirt";
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

// SF2 — the T2→T3 hinge as ONE object inside the frame-0 ring (the doira rim the world has
// kept): 12 warp threads; the centre two are the plucked dutar strings, the others echo the
// pluck with decaying amplitude. Ikat is resist-dyed on the warp before weaving, so one large
// stepped flame appears ACROSS the threads, each thread's dye offset by whole steps.
const flameProfile = (t: number) =>
  t < 0 || t > 1 ? 0 : t < 0.34 ? 0.12 + 0.88 * Math.sin((t / 0.34) * (Math.PI / 2)) : Math.pow((1 - t) / 0.66, 0.9);

export const SF2Transform: React.FC = () => {
  const { cx, cy, R } = FRAME0;
  const rIn = R * (1 - dancer.band);
  const inner = rIn - 10;
  const cols = count.warpThreads;
  const pitch = (2 * inner) / cols;
  const pluckY = cy + R * 0.22;
  const amp = 34;
  const lw = dancer.lineWeight;
  const flame = { base: cy + inner * 0.62, tip: cy - inner * 0.72, half: inner * 0.44, steps: 5 };
  const stepH = (flame.base - flame.tip) / flame.steps;
  const threads = Array.from({ length: cols }, (_, i) => {
    const x = cx - inner + pitch * (i + 0.5);
    const dx = x - cx;
    const half = Math.sqrt(Math.max(0, inner * inner - dx * dx));
    const k = Math.abs(i - (cols - 1) / 2) - 0.5; // 0 = the two strings
    const a = amp * Math.max(0.1, 1 - k / 11) * (dx < 0 ? -1 : 1);
    return { x, top: cy - half, bot: cy + half, a, misreg: ((i % 3) - 1) * stepH * 0.5 };
  });
  const xAt = (t: (typeof threads)[number], y: number) =>
    y < pluckY ? t.x + (t.a * (y - t.top)) / (pluckY - t.top) : t.x + (t.a * (t.bot - y)) / (t.bot - pluckY);
  // dyed spans per thread, stepped (quantised) profile, offset per thread
  const spans = (t: (typeof threads)[number], scale: number, t0: number, t1: number) => {
    const out: Pt[][] = [];
    let cur: Pt[] | null = null;
    for (let y = flame.base; y >= flame.tip; y -= 3) {
      const tt = (flame.base - (y - t.misreg)) / (flame.base - flame.tip);
      const q = (Math.floor(tt * flame.steps) + 0.5) / flame.steps;
      const local = (q - t0) / (t1 - t0);
      const dyed = Math.abs(t.x - cx) < flame.half * scale * flameProfile(local) && y > t.top && y < t.bot;
      if (dyed) {
        if (!cur) cur = [];
        cur.push([xAt(t, y), y]);
      } else if (cur) {
        out.push(cur);
        cur = null;
      }
    }
    if (cur) out.push(cur);
    return out;
  };
  const pts = (p: Pt[]) => p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");
  return (
    <Canvas>
      <HemBand cx={cx} cy={cy} R={R} />
      {threads.map((t, i) => (
        <polyline key={i} points={`${t.x},${t.top} ${t.x + t.a},${pluckY} ${t.x},${t.bot}`} fill="none" stroke={color.ink} strokeWidth={lw} strokeLinejoin="round" />
      ))}
      {threads.map((t, i) =>
        spans(t, 1, 0, 1).map((sp, j) => <polyline key={`r${i}-${j}`} points={pts(sp)} fill="none" stroke={color.red} strokeWidth={pitch - 4} />),
      )}
      {threads.map((t, i) =>
        spans(t, 0.42, 0.16, 0.74).map((sp, j) => <polyline key={`m${i}-${j}`} points={pts(sp)} fill="none" stroke={color.milk} strokeWidth={pitch - 4} />),
      )}
    </Canvas>
  );
};

// SF3 — identity. The mark is the frame-0 hem band with the doppi at its centre
// (markaz = centre): exactly what SF1 shows before the panels, arms and braids bloom out of
// it, so the loop needs no new shape. Wordmark sits below the mark. ◇ type size/tracking.
export const SF3Identity: React.FC = () => {
  const { cx, cy, R } = FRAME0;
  return (
    <AbsoluteFill style={{ backgroundColor: color.cream }}>
      <svg viewBox={`0 0 ${FRAME.width} ${FRAME.height}`} width={FRAME.width} height={FRAME.height} style={{ position: "absolute" }}>
        <HemBand cx={cx} cy={cy} R={R} />
        {/* end-card hold: doppi at 0.5R; it eases back to frame-0 size (0.28R, 28°) in the loop handoff */}
        <g transform={`translate(${cx} ${cy}) rotate(0)`}>
          <Doppi size={R * 0.5} keyline={0} />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: cy + R + 96,
          textAlign: "center",
          fontFamily: sans,
          fontWeight: 700,
          fontSize: 58,
          lineHeight: 1,
          letterSpacing: "0.1em",
          paddingLeft: "0.1em",
          color: color.ink,
        }}
      >
        FARHANG MARKAZ
      </div>
    </AbsoluteFill>
  );
};
