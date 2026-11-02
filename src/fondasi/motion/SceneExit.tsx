import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const EXIT_FRAMES = 18;

/** Exit animation over 18 frames starting at `at`. */
export const SceneExit: React.FC<{
  at: number;
  kind: "fade" | "slide-up" | "scale-down";
  children: React.ReactNode;
}> = ({ at, kind, children }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + EXIT_FRAMES], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const transform =
    kind === "slide-up" ? `translateY(${-120 * t}px)` : kind === "scale-down" ? `scale(${1 - 0.15 * t})` : undefined;
  return <div style={{ opacity: 1 - t, transform }}>{children}</div>;
};
