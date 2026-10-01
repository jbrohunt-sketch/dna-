import React from "react";
import { Folder, Still } from "remotion";
import { BOARD, GrammarBoard } from "./board/GrammarBoard";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Grammar">
        <Still id="VisualGrammar" component={GrammarBoard} width={BOARD.width} height={BOARD.height} />
      </Folder>
    </>
  );
};
