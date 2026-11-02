// Native viewBox 220 x 220 (aspect 1:1).
import React from "react";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { EXTRA_COLORS as X, STYLE, tint } from "../style";

const W = 220;
const H = 220;
const OL = STYLE.outlineProp;

/** Lawn Green coffee mug with steam. */
export const Coffee: React.FC<{ width?: number }> = ({ width = W }) => {
  const { palette: C } = useBrand();
  const handle = "M156 106 Q198 104 194 140 Q190 172 150 168";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} style={{ overflow: "visible" }}>
      {[70, 100, 130].map((x, i) => (
        <path key={x} d={`M${x} ${62 - (i % 2) * 6} Q${x - 12} 44 ${x} 30 Q${x + 12} 16 ${x} 6`} fill="none" stroke={X.steamStroke} strokeWidth={8} strokeLinecap="round" />
      ))}
      <path d={handle} fill="none" stroke={C.thunder} strokeWidth={14 + OL * 2} strokeLinecap="round" />
      <path d={handle} fill="none" stroke={C.lawnGreen} strokeWidth={14} strokeLinecap="round" />
      <path d="M40 80 L160 80 L150 196 Q148 210 134 210 L66 210 Q52 210 50 196 Z" fill={C.lawnGreen} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
      <ellipse cx={100} cy={80} rx={60} ry={16} fill={X.coffee} stroke={C.thunder} strokeWidth={OL} />
      <path d="M62 108 L68 182" stroke={tint(C.lawnGreen, 0.4)} strokeWidth={10} strokeLinecap="round" />
    </svg>
  );
};
