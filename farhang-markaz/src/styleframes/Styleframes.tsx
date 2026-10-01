import React from "react";
import { CENTER, color, dancer, FRAME } from "../design/tokens";
import { polar } from "../design/geometry";
import { Stage } from "../motifs/Stage";
import { OverheadDancer } from "../dancer/OverheadDancer";
import { Doira, DoiraGround, Ripple } from "../motifs/Doira";
import { Dutar } from "../motifs/Dutar";
import { Warp } from "../motifs/Warp";
import { Girih } from "../motifs/Girih";
import { GoldOrbit } from "../motifs/GoldOrbit";
import { Wordmark } from "../identity/Wordmark";
import { hemPath } from "../dancer/IkatSkirt";

// SF1 — frame 0: overhead, mid-spin, nothing else in the world yet.
export const SF1Spin: React.FC = () => (
  <Stage poolR={820}>
    <OverheadDancer
      uid="sf1"
      cx={CENTER.x}
      cy={CENTER.y}
      rotation={28}
      flare={0.97}
      braidLag={46}
      braidReach={1}
      armSweep={-10}
      smear={9}
      hemPhase={0.6}
    />
  </Stage>
);

// SF2 — the transformation world: skirt → doira (strike), braid → dutar string (pluck),
// string → warp → ikat → weave → tile linework.
export const SF2World: React.FC = () => {
  const dx = 650;
  const dy = 560;
  const R = 520;
  const sx = 452;
  return (
    <Stage poolX={dx} poolY={dy} poolR={900}>
      <Doira
        uid="sf2"
        cx={dx}
        cy={dy}
        radius={R}
        rotation={12}
        ikatGhost={0.13}
        strike={{ x: 250, y: 620, t: 0.42 }}
      />
      <Girih x={0} y={1560} width={FRAME.width} height={360} cell={132} opacity={0.5} originX={540} originY={1760} />
      <Warp xTop={sx} yTop={1150} fanEnd={1380} x0={120} x1={960} y1={1680} count={120} dye={1} weave={0.4} weaveFrom={1450} />
      <Dutar
        x={sx}
        y0={-10}
        y1={1160}
        gap={26}
        braidTo={170}
        neck={{ from: 220, to: 760 }}
        pluck={{ y: 930, amp: 16 }}
      />
    </Stage>
  );
};

// SF3 — identity. The ring IS the skirt hem at frame 0 (r = dancer.skirtRadius),
// so the last frame hands straight back to the opening spin.
export const SF3Identity: React.FC = () => {
  const cx = CENTER.x;
  const cy = 900;
  const R = dancer.skirtRadius;
  const arc = (a0: number, a1: number) => {
    const [x0, y0] = polar(cx, cy, R, a0);
    const [x1, y1] = polar(cx, cy, R, a1);
    return `M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1}`;
  };
  return (
    <Stage poolY={cy} poolR={720} overlay={<Wordmark cy={cy} size={78} />}>
      <defs>
        <clipPath id="sf3-in">
          <circle cx={cx} cy={cy} r={R - 26} />
        </clipPath>
      </defs>
      {/* accumulated world, held back to a whisper inside the ring */}
      <g clipPath="url(#sf3-in)">
        <Girih x={cx - R} y={cy - R} width={2 * R} height={2 * R} cell={120} opacity={0.12} originX={cx} originY={cy} />
        <g opacity={0.45}><Ripple cx={cx} cy={cy} t={0.7} R={R * 0.7} /></g>
      </g>
      <DoiraGround cx={cx} cy={cy} radius={R + 46} opacity={0.5} />
      <path d={hemPath(cx, cy, R + 14, 0, 0.6)} fill="none" stroke={color.pomegranate} strokeWidth={1} opacity={0.5} />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={color.bone} strokeWidth={2.2} opacity={0.92} />
      {/* three jewel events on the ring */}
      <path d={arc(-128, -92)} fill="none" stroke={color.cobalt} strokeWidth={6} strokeLinecap="round" />
      <path d={arc(-8, 28)} fill="none" stroke={color.ruby} strokeWidth={6} strokeLinecap="round" />
      <path d={arc(112, 148)} fill="none" stroke={color.turquoise} strokeWidth={6} strokeLinecap="round" />
      <GoldOrbit cx={cx} cy={cy} radius={R + 110} reveal={0.62} bead={-34} opacity={0.85} />
    </Stage>
  );
};
