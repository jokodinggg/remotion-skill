// Native viewBox 240 x 360 (aspect 2:3).
import React from "react";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { EXTRA_COLORS as X, STYLE, tint } from "../style";

const W = 240;
const H = 360;
const OL = STYLE.outlineProp;

/** Server tower with three rack units, drive slots and status lights. */
export const Server: React.FC<{ width?: number }> = ({ width = W }) => {
  const { palette: C } = useBrand();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} style={{ overflow: "visible" }}>
      {[50, 166].map((x) => (
        <rect key={x} x={x} y={326} width={24} height={24} rx={6} fill={C.thunder} />
      ))}
      <rect x={20} y={10} width={200} height={324} rx={22} fill={X.charcoal} stroke={C.thunder} strokeWidth={OL} />
      <path d="M33 44 L33 120" stroke={tint(X.charcoal, 0.4)} strokeWidth={6} strokeLinecap="round" />
      {[36, 132, 228].map((y, i) => (
        <g key={y}>
          <rect x={46} y={y} width={148} height={78} rx={12} fill={X.metal} stroke={C.thunder} strokeWidth={OL - 2} />
          <rect x={62} y={y + 22} width={70} height={10} rx={5} fill={C.thunder} />
          <rect x={62} y={y + 44} width={70} height={10} rx={5} fill={C.thunder} />
          <circle cx={158} cy={y + 27} r={9} fill={i === 1 ? C.kuning : C.glow} stroke={C.thunder} strokeWidth={4} />
          <circle cx={158} cy={y + 52} r={9} fill={C.hijauTerang} stroke={C.thunder} strokeWidth={4} />
        </g>
      ))}
    </svg>
  );
};
