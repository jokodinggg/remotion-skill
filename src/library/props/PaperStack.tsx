// Native viewBox 200 x 180 (aspect 10:9). Port of the spike kit PaperStack.
import React from "react";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { EXTRA_COLORS as X, STYLE } from "../style";

const W = 200;
const H = 180;
const OL = STYLE.outlineProp;

/** Messy stack of five sheets, top sheet white with two text lines. */
export const PaperStack: React.FC<{ width?: number }> = ({ width = W }) => {
  const { palette: C } = useBrand();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} style={{ overflow: "visible" }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const y = 140 - i * 26;
        return (
          <rect
            key={i}
            x={20 + (i % 2) * 8}
            y={y}
            width={156}
            height={30}
            rx={6}
            fill={i === 4 ? X.white : X.paperShade}
            stroke={C.thunder}
            strokeWidth={OL}
            transform={`rotate(${i % 2 ? 3 : -2} 100 ${y + 15})`}
          />
        );
      })}
      <path d="M44 52 L112 50" stroke={X.clockRing} strokeWidth={8} strokeLinecap="round" />
    </svg>
  );
};
