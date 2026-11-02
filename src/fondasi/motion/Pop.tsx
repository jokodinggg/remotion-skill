import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRINGS, type SpringPreset } from "./springs";

/** Scale + opacity entrance at frame `at`. Invisible before `at`, so layout does not jump. */
export const Pop: React.FC<{
  at: number;
  preset?: SpringPreset;
  from?: number;
  children: React.ReactNode;
}> = ({ at, preset = "bouncy", from = 0.6, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return <div style={{ opacity: 0 }}>{children}</div>;
  const p = spring({ frame: frame - at, fps, config: SPRINGS[preset] });
  return <div style={{ opacity: Math.min(1, Math.max(0, p)), transform: `scale(${from + (1 - from) * p})` }}>{children}</div>;
};
