import React from "react";
import { CENTER, color, dancer, FRAME } from "../design/tokens";
import { Layer, Stage } from "../motifs/Stage";
import { OverheadDancer } from "../dancer/OverheadDancer";
import { Doira, DoiraGround } from "../motifs/Doira";
import { Dutar } from "../motifs/Dutar";
import { Warp } from "../motifs/Warp";
import { Girih } from "../motifs/Girih";
import { GoldOrbit } from "../motifs/GoldOrbit";
import { Wordmark } from "../identity/Wordmark";
import { IkatRing } from "../identity/IkatRing";

// SF1 — frame 0: overhead, mid-spin, nothing else in the world yet.
export const SF1Spin: React.FC = () => (
  <Stage poolR={900}>
    <OverheadDancer
      uid="sf1"
      cx={CENTER.x}
      cy={CENTER.y}
      rotation={28}
      flare={1}
      braidLag={28}
      braidReach={1}
      armSweep={-8}
      smear={5}
      foldPhase={0.6}
    />
  </Stage>
);

// SF2 — the transformation world, one moment: raking light across the doira skin just
// after a rim strike; the braid has become a dutar string hovering above the skin, plucked;
// below the drum the string divides into an ikat warp that is being woven.
export const SF2World: React.FC = () => {
  const dc = { x: 820, y: 560, R: 760 };
  const key = { x: 300, y: 470, r: 1100 };
  const lower = { x: 520, y: 1720, r: 620 };
  return (
    <Stage poolX={key.x} poolY={key.y} poolR={1000} poolStrength={0.6}>
      <Doira uid="sf2" cx={dc.x} cy={dc.y} radius={dc.R} rotation={4} strike={{ x: 250, y: 640, t: 0.34, amp: 11 }} pool={key} />
      <Warp from={[452, 1400]} yTop={1555} x0={80} x1={1000} y1={1920} count={150} dye={1} weave={1} weaveFrom={1820} pool={lower} />
      <Dutar
        uid="sf2s"
        a={[296, -30]}
        b={[452, 1400]}
        gap={22}
        braidTo={0.14}
        frets={[0.17, 0.52]}
        pluck={{ at: 0.74, amp: 13 }}
        shadow={{ dx: 26, dy: 20, clip: { cx: dc.x, cy: dc.y, r: dc.R * 0.9 } }}
      />
    </Stage>
  );
};

// SF3 — identity. The ring is the skirt's hem band (r = dancer.skirtRadius), so the last
// frame hands straight back to the opening spin. Around it, what the film accumulated:
// halqa rhythm, khatam linework, the tassel's gold orbit.
export const SF3Identity: React.FC = () => {
  const cx = CENTER.x;
  const cy = 900;
  const R = dancer.skirtRadius;
  return (
    <Stage poolY={cy} poolR={820}>
      <Layer>
        <defs>
          <radialGradient id="sf3-girihMask" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={720}>
            <stop offset="0.54" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.66" stopColor="#fff" stopOpacity={1} />
            <stop offset="0.86" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask id="sf3-m">
            <rect width={FRAME.width} height={FRAME.height} fill="url(#sf3-girihMask)" />
          </mask>
        </defs>
        <g mask="url(#sf3-m)">
          <Girih x={0} y={0} width={FRAME.width} height={FRAME.height} cell={128} opacity={0.38} originX={cx} originY={cy} />
        </g>
        <DoiraGround cx={cx} cy={cy} radius={R + 52} opacity={0.75} />
        <GoldOrbit cx={cx} cy={cy} radius={R + 120} reveal={0.58} bead={-36} opacity={0.9} />
        <circle cx={cx} cy={cy} r={R - 25} fill="none" stroke={color.ink} strokeWidth={2} />
      </Layer>
      <IkatRing cx={cx} cy={cy} />
      <Wordmark cy={cy} size={74} />
    </Stage>
  );
};
