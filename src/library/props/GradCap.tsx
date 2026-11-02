// Native viewBox 300 x 220 (aspect 15:11).
import React from "react";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { EXTRA_COLORS as X, STYLE } from "../style";

const W = 300;
const H = 220;
const OL = STYLE.outlineProp;

/** Graduation cap (toga) with a Kuning tassel. */
export const GradCap: React.FC<{ width?: number }> = ({ width = W }) => {
  const { palette: C } = useBrand();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} style={{ overflow: "visible" }}>
      <path d="M72 100 L72 158 Q150 198 228 158 L228 100 Z" fill={C.thunder} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
      <path d="M92 150 Q112 164 138 168" fill="none" stroke={X.hairGloss} strokeWidth={8} strokeLinecap="round" />
      <path d="M150 20 L290 78 L150 136 L10 78 Z" fill={C.thunder} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
      <path d="M58 76 L140 42" stroke={X.hairGloss} strokeWidth={10} strokeLinecap="round" />
      <path d="M150 78 L250 98 L250 150" fill="none" stroke={C.kuning} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={150} cy={78} r={11} fill={C.kuning} stroke={C.thunder} strokeWidth={4} />
      <path d="M238 146 L262 146 L268 190 Q250 200 232 190 Z" fill={C.kuning} stroke={C.thunder} strokeWidth={OL - 4} strokeLinejoin="round" />
    </svg>
  );
};
