import React from "react";
import { Folder, Still } from "remotion";
import { SF1Spin, SF2World, SF3Identity } from "./styleframes/Styleframes";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Styleframes">
        <Still id="SF1-Spin" component={SF1Spin} width={1080} height={1920} />
        <Still id="SF2-World" component={SF2World} width={1080} height={1920} />
        <Still id="SF3-Identity" component={SF3Identity} width={1080} height={1920} />
      </Folder>
    </>
  );
};
