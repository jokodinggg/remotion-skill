import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

export type CamKey = { frame: number; scale: number; x: number; y: number };
type Cam = { scale: number; x: number; y: number };

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** Camera state at `frame`: eased between keys, clamped outside the range. */
export function camAt(keys: CamKey[], frame: number): Cam {
  if (keys.length === 0) return { scale: 1, x: 0, y: 0 };
  const k = [...keys].sort((a, b) => a.frame - b.frame);
  if (frame <= k[0].frame) return { scale: k[0].scale, x: k[0].x, y: k[0].y };
  const last = k[k.length - 1];
  if (frame >= last.frame) return { scale: last.scale, x: last.x, y: last.y };
  let i = 0;
  while (k[i + 1].frame <= frame) i++;
  const a = k[i];
  const b = k[i + 1];
  const t = ease((frame - a.frame) / (b.frame - a.frame));
  const mix = (from: number, to: number) => interpolate(t, [0, 1], [from, to]);
  return { scale: mix(a.scale, b.scale), x: mix(a.x, b.x), y: mix(a.y, b.y) };
}

export const Camera: React.FC<{ keys: CamKey[]; origin?: string; children: React.ReactNode }> = ({
  keys,
  origin = "540px 1000px",
  children,
}) => {
  const { scale, x, y } = camAt(keys, useCurrentFrame());
  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: origin, transform: `translate(${x}px, ${y}px) scale(${scale})` }}>
      {children}
    </div>
  );
};
