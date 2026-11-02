import React from "react";
import { Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { useQa } from "../timeline/TimelineProvider";

/** One-shot sound effect starting at frame `at`. */
export const Sfx: React.FC<{ name: string; at: number; volume?: number }> = ({ name, at, volume = 0.35 }) => {
  const qa = useQa();
  if (qa) return null;
  return (
    <Sequence from={at} layout="none">
      <Audio src={staticFile(`library/sfx/${name}.mp3`)} volume={volume} />
    </Sequence>
  );
};
