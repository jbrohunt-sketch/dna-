import React from "react";
import { AbsoluteFill } from "remotion";
import { CENTER, color, dancer, FRAME } from "../design/tokens";
import { Dancer } from "../shapes/Dancer";

// Legibility check: the dancer alone at film scale. Downscale the render to 108×192 to test
// thumbnail legibility (skill §10).
export const DancerCheck: React.FC<{ readonly doppiGround: "ink" | "milk" }> = ({ doppiGround }) => (
  <AbsoluteFill style={{ backgroundColor: color.cream }}>
    <svg viewBox={`0 0 ${FRAME.width} ${FRAME.height}`}>
      <Dancer id="chk" cx={CENTER.x} cy={CENTER.y} R={dancer.R} rotation={28} doppiGround={doppiGround} />
    </svg>
  </AbsoluteFill>
);
