// Native viewBox 200 x 200 (aspect 1:1). Port of the spike kit WallClock.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { EXTRA_COLORS as X, STYLE } from "../style";

const W = 200;
const OL = STYLE.outlineProp;

/**
 * Wall clock showing `minutes` since midnight (e.g. 23 * 60 + 52). The thin
 * second hand ticks once per second from the composition frame. `size` is the
 * spike's name for the diameter; `width` wins when both are given.
 */
export const WallClock: React.FC<{ minutes: number; size?: number; width?: number }> = ({ minutes, size, width }) => {
  const { palette: C } = useBrand();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = width ?? size ?? W;
  const hour = (minutes / 60) % 12;
  const minute = minutes % 60;
  const second = Math.floor(frame / fps) % 60;
  return (
    <svg viewBox={`0 0 ${W} ${W}`} width={d} height={d} style={{ overflow: "visible" }}>
      <circle cx={100} cy={100} r={88} fill={X.white} stroke={C.thunder} strokeWidth={OL} />
      <circle cx={100} cy={100} r={72} fill="none" stroke={X.clockRing} strokeWidth={6} />
      <path d="M40 64 Q52 42 74 30" fill="none" stroke={X.clockRing} strokeWidth={8} strokeLinecap="round" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={97} y={24} width={6} height={i % 3 === 0 ? 18 : 10} rx={3} fill={C.thunder} transform={`rotate(${i * 30} 100 100)`} />
      ))}
      <line x1={100} y1={100} x2={100} y2={58} stroke={C.thunder} strokeWidth={10} strokeLinecap="round" transform={`rotate(${hour * 30} 100 100)`} />
      <line x1={100} y1={100} x2={100} y2={38} stroke={C.lawnGreen} strokeWidth={8} strokeLinecap="round" transform={`rotate(${minute * 6} 100 100)`} />
      <line x1={100} y1={112} x2={100} y2={34} stroke={C.thunder} strokeWidth={3} strokeLinecap="round" transform={`rotate(${second * 6} 100 100)`} />
      <circle cx={100} cy={100} r={9} fill={C.thunder} />
    </svg>
  );
};
