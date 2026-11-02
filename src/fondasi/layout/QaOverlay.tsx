import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { useBrand } from "../brand/BrandProvider";
import { forbiddenZones, type Rect } from "./safeArea";

const CYAN = "#00E5FF";

const outline = (r: Rect): React.CSSProperties => ({
  position: "absolute",
  left: r.x,
  top: r.y,
  width: r.w,
  height: r.h,
  border: `4px solid ${CYAN}`,
  boxSizing: "border-box",
});

/** QA-only overlay: forbidden zones, caption/logo boxes, time and frame. */
export const QaOverlay: React.FC = () => {
  const brand = useBrand();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { logo } = brand;
  const logoBox: Rect = { x: 1080 - logo.right - logo.width, y: logo.top, w: logo.width, h: 120 };

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {forbiddenZones(brand).map((z, i) => (
        <div
          key={i}
          style={{ position: "absolute", left: z.x, top: z.y, width: z.w, height: z.h, background: "rgba(255,0,0,0.28)" }}
        />
      ))}
      <div style={outline({ x: 120, y: 1180, w: 840, h: 300 })} />
      <div style={outline(logoBox)} />
      <div
        style={{
          position: "absolute",
          left: 16,
          top: 16,
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          fontFamily: "monospace",
          fontSize: 28,
          padding: "6px 16px",
          borderRadius: 999,
        }}
      >
        {`t=${(frame / fps).toFixed(2)}s f=${frame}`}
      </div>
    </div>
  );
};
