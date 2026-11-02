// Native viewBox 220 x 240 (aspect 11:12). Port of the spike kit Calendar (header recolored: Merah is reserved for errors).
import React from "react";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { poppins } from "../../fondasi/brand/fonts";
import { EXTRA_COLORS as X, STYLE, tint } from "../style";

const W = 220;
const H = 240;
const OL = STYLE.outlineProp;
const cell = (i: number) => ({ x: 30 + (i % 4) * 44, y: 92 + Math.floor(i / 4) * 44 });

/**
 * Wall calendar: Lawn Green header with `label` (keep it short, e.g. "BESOK")
 * and a 4 x 3 grid of day cells. `circled` (0..11) highlights one cell in
 * Kuning and rings it with a Thunder marker stroke.
 */
export const Calendar: React.FC<{ label: string; circled?: number; width?: number }> = ({ label, circled, width = W }) => {
  const { palette: C } = useBrand();
  const idx = circled === undefined ? -1 : Math.max(0, Math.min(11, Math.round(circled)));
  const ring = idx < 0 ? null : cell(idx);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} style={{ overflow: "visible" }}>
      <rect x={10} y={20} width={200} height={210} rx={18} fill={X.white} stroke={C.thunder} strokeWidth={OL} />
      <path d="M10 70 L10 38 Q10 20 28 20 L192 20 Q210 20 210 38 L210 70 Z" fill={C.lawnGreen} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
      <path d="M30 34 L80 34" stroke={tint(C.lawnGreen, 0.4)} strokeWidth={7} strokeLinecap="round" />
      <text x={110} y={60} textAnchor="middle" fontFamily={poppins} fontWeight={700} fontSize={label.length > 7 ? 22 : 26} fill={X.white}>
        {label}
      </text>
      {Array.from({ length: 12 }, (_, i) => {
        const p = cell(i);
        return <rect key={i} x={p.x} y={p.y} width={30} height={26} rx={6} fill={i === idx ? C.kuning : X.cell} />;
      })}
      {ring && (
        <ellipse cx={ring.x + 15} cy={ring.y + 13} rx={28} ry={22} fill="none" stroke={C.thunder} strokeWidth={6} transform={`rotate(-8 ${ring.x + 15} ${ring.y + 13})`} />
      )}
      {[64, 156].map((x) => (
        <rect key={x} x={x - 6} y={6} width={12} height={30} rx={6} fill={C.thunder} />
      ))}
    </svg>
  );
};
