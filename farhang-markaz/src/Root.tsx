import React from "react";
import { Folder, Still } from "remotion";
import { BOARD, GrammarBoard } from "./board/GrammarBoard";
import { DancerCheck } from "./checks/DancerCheck";
import { SF1Spin, SF2Transform, SF3Identity } from "./styleframes/Styleframes";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Grammar">
        <Still id="VisualGrammar" component={GrammarBoard} width={BOARD.width} height={BOARD.height} />
      </Folder>
      <Folder name="Styleframes">
        <Still id="SF1-Spin" component={SF1Spin} width={1080} height={1920} />
        <Still id="SF2-Transform" component={SF2Transform} width={1080} height={1920} />
        <Still id="SF3-Identity" component={SF3Identity} width={1080} height={1920} />
      </Folder>
      <Folder name="Checks">
        <Still id="DancerCheck-ink" component={DancerCheck} width={1080} height={1920} defaultProps={{ doppiGround: "ink" as const }} />
        <Still id="DancerCheck-milk" component={DancerCheck} width={1080} height={1920} defaultProps={{ doppiGround: "milk" as const }} />
      </Folder>
    </>
  );
};
