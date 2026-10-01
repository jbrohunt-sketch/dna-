import React from "react";
import { AbsoluteFill } from "remotion";
import { color, material } from "../design/tokens";
import { serif } from "../design/fonts";

// FARHANG / MARKAZ set inside the ring — markaz is "centre". The divider is a silk
// string (the dutar line), not an ornament.
export const Wordmark: React.FC<{ readonly cy: number; readonly size?: number; readonly opacity?: number }> = ({
  cy,
  size = 76,
  opacity = 1,
}) => {
  const tracking = 0.32;
  const line: React.CSSProperties = {
    fontFamily: serif,
    fontWeight: 500,
    fontSize: size,
    lineHeight: 1,
    letterSpacing: `${tracking}em`,
    paddingLeft: `${tracking}em`,
    color: color.bone,
    fontFeatureSettings: '"kern", "liga"',
  };
  return (
    <AbsoluteFill style={{ alignItems: "center", opacity }}>
      <div
        style={{
          position: "absolute",
          top: cy,
          translate: "0 -50%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: size * 0.4,
        }}
      >
        <div style={line}>FARHANG</div>
        <div style={{ width: 210, height: 1, backgroundColor: material.silk, opacity: 0.55 }} />
        <div style={line}>MARKAZ</div>
      </div>
    </AbsoluteFill>
  );
};
