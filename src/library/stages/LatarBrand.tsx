import React from "react";
import { AbsoluteFill, random } from "remotion";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { poppins } from "../../fondasi/brand/fonts";
import { tint } from "../style";

const GLYPHS = ["{ }", "</>", ";"];
const COLS = 3;
const ROWS = 6;
const SPAN = 2240; // wrap height: taller than the frame so glyphs enter and leave off-screen
const OFFSET = 160;

/**
 * Brand backdrop, 1080 x 1920: Mint Cream with code glyphs in a light Lawn
 * Green tint drifting slowly upward. `t` is the frame, passed by the caller.
 */
export const LatarBrand: React.FC<{ t: number; children?: React.ReactNode }> = ({ t, children }) => {
  const { palette: C } = useBrand();
  const color = tint(C.lawnGreen, 0.72);
  return (
    <AbsoluteFill style={{ backgroundColor: C.mintCream, overflow: "hidden" }}>
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const r = (k: string) => random(`latar-${i}-${k}`);
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = (col + 0.5) * (1080 / COLS) + (r("x") - 0.5) * 180;
        const y0 = row * (SPAN / ROWS) + (r("y") - 0.5) * 160;
        const speed = 0.25 + r("speed") * 0.25;
        const y = ((((y0 - t * speed) % SPAN) + SPAN) % SPAN) - OFFSET;
        const rot = (r("rot") - 0.5) * 30 + Math.sin(t / 90 + i) * 4;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              fontFamily: poppins,
              fontWeight: 700,
              fontSize: 90 + r("size") * 90,
              color,
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            {GLYPHS[(i + row) % GLYPHS.length]}
          </div>
        );
      })}
      <AbsoluteFill>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
