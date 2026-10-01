import React from "react";
import { AbsoluteFill } from "remotion";
import { color } from "../design/tokens";
import { serif } from "../design/fonts";

// FARHANG / MARKAZ — set inside the ring: markaz is "centre".
export const Wordmark: React.FC<{ readonly cy: number; readonly size?: number; readonly opacity?: number }> = ({
  cy,
  size = 84,
  opacity = 1,
}) => {
  const tracking = 0.3;
  const line: React.CSSProperties = {
    fontFamily: serif,
    fontWeight: 600,
    fontSize: size,
    lineHeight: 1,
    letterSpacing: `${tracking}em`,
    paddingLeft: `${tracking}em`, // optical centring: cancel trailing tracking
    color: color.bone,
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
          gap: size * 0.34,
        }}
      >
        <div style={line}>FARHANG</div>
        <div style={{ width: 56, height: 1, backgroundColor: color.gold, opacity: 0.9 }} />
        <div style={line}>MARKAZ</div>
      </div>
    </AbsoluteFill>
  );
};
