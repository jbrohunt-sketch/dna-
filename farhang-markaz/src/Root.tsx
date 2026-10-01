import React from "react";
import { Folder, Still } from "remotion";
import { BOARD, GrammarBoard } from "./board/GrammarBoard";
import { DancerCheck } from "./checks/DancerCheck";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Grammar">
        <Still id="VisualGrammar" component={GrammarBoard} width={BOARD.width} height={BOARD.height} />
      </Folder>
      <Folder name="Checks">
        <Still id="DancerCheck-ink" component={DancerCheck} width={1080} height={1920} defaultProps={{ doppiGround: "ink" as const }} />
        <Still id="DancerCheck-milk" component={DancerCheck} width={1080} height={1920} defaultProps={{ doppiGround: "milk" as const }} />
      </Folder>
    </>
  );
};
