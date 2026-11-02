import React from "react";
import { Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { useQa, useTimeline } from "../timeline/TimelineProvider";

const toFrames = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

export const VoTrack: React.FC = () => {
  const timeline = useTimeline();
  const qa = useQa();
  const { fps } = useVideoConfig();
  if (qa) return null;
  const { vo } = timeline;
  if (vo.mode === "single") {
    return <Audio src={staticFile(vo.src)} trimBefore={toFrames(timeline.voOffsetMs, fps)} />;
  }
  return (
    <>
      {vo.files.map((f) => (
        <Sequence key={f.lineId} from={toFrames(f.startMs, fps)} layout="none">
          <Audio src={staticFile(f.src)} />
        </Sequence>
      ))}
    </>
  );
};
