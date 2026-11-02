import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useLine } from "../timeline/TimelineProvider";

const WHIP_FRAMES = 10;
const SCALE_FRAMES = 12;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Wraps the content of one line: renders only while the line is on screen, with an entrance at its start. */
export const LineTransition: React.FC<{
  lineId: string;
  kind: "cut" | "whip" | "scale";
  children: React.ReactNode;
}> = ({ lineId, kind, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const line = useLine(lineId);
  const start = Math.round((line.startMs / 1000) * fps);
  const end = start + Math.round((line.durMs / 1000) * fps);
  if (frame < start || frame >= end) return null;
  const local = frame - start;
  let style: React.CSSProperties = {};
  if (kind === "whip") {
    const x = interpolate(local, [0, WHIP_FRAMES], [140, 0], clamp);
    const blur = interpolate(local, [0, WHIP_FRAMES], [12, 0], clamp);
    style = { transform: `translateX(${x}px)`, filter: `blur(${blur}px)` };
  } else if (kind === "scale") {
    style = {
      transform: `scale(${interpolate(local, [0, SCALE_FRAMES], [1.08, 1], clamp)})`,
      opacity: interpolate(local, [0, SCALE_FRAMES], [0, 1], clamp),
    };
  }
  return <div style={{ position: "absolute", inset: 0, ...style }}>{children}</div>;
};
