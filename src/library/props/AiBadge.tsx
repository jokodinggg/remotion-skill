// Native viewBox 240 x 250 (aspect 24:25).
import React from "react";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { poppins } from "../../fondasi/brand/fonts";
import { EXTRA_COLORS as X, STYLE, tint } from "../style";

const W = 240;
const H = 250;
const OL = STYLE.outlineProp;

/** Generic AI icon: friendly robot head with an "AI" chip. Not any product's logo. */
export const AiBadge: React.FC<{ width?: number }> = ({ width = W }) => {
  const { palette: C } = useBrand();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} style={{ overflow: "visible" }}>
      <line x1={120} y1={50} x2={120} y2={26} stroke={C.thunder} strokeWidth={OL} strokeLinecap="round" />
      <circle cx={120} cy={22} r={14} fill={C.kuning} stroke={C.thunder} strokeWidth={OL - 2} />
      {[12, 206].map((x) => (
        <rect key={x} x={x} y={96} width={22} height={52} rx={10} fill={C.lawnGreen} stroke={C.thunder} strokeWidth={OL - 2} />
      ))}
      <rect x={30} y={50} width={180} height={146} rx={44} fill={tint(C.hijauTerang, 0.55)} stroke={C.thunder} strokeWidth={OL} />
      <path d="M52 96 Q54 74 72 66" fill="none" stroke={X.white} strokeWidth={9} strokeLinecap="round" />
      <rect x={56} y={86} width={128} height={72} rx={30} fill={C.layar} stroke={C.thunder} strokeWidth={OL - 4} />
      <ellipse cx={96} cy={118} rx={12} ry={16} fill={C.glow} />
      <ellipse cx={144} cy={118} rx={12} ry={16} fill={C.glow} />
      <path d="M108 142 Q120 150 132 142" fill="none" stroke={C.glow} strokeWidth={6} strokeLinecap="round" />
      <rect x={78} y={200} width={84} height={42} rx={21} fill={C.lawnGreen} stroke={C.thunder} strokeWidth={OL - 2} />
      <text x={120} y={231} textAnchor="middle" fontFamily={poppins} fontWeight={800} fontSize={28} fill={X.white}>
        AI
      </text>
    </svg>
  );
};
