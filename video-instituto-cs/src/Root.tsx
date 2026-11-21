import React from "react";
import { Composition } from "remotion";
import { Video, FPS, TOTAL } from "./Video";

export const Root: React.FC = () => (
  <Composition id="SobreOsCursos" component={Video} durationInFrames={Math.round(TOTAL * FPS)} fps={FPS} width={1080} height={1920} />
);
