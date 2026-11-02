// Native viewBox 260 x 300 (aspect 13:15). Port of the spike kit DeskLamp; the light cone now stays inside the box.
import React from "react";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { STYLE, tint } from "../style";

const W = 260;
const H = 300;
const OL = STYLE.outlineProp;

/** Kuning desk lamp; `on` (0..1) fades the flat, translucent light cone. */
export const DeskLamp: React.FC<{ on?: number; width?: number }> = ({ on = 1, width = W }) => {
  const { palette: C } = useBrand();
  const arm = "M80 274 L54 156 L126 76";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} style={{ overflow: "visible" }}>
      {on > 0 && <path d="M150 112 L120 296 L258 296 L186 96 Z" fill={tint(C.kuning, 0.5)} opacity={0.4 * on} />}
      <path d={arm} fill="none" stroke={C.thunder} strokeWidth={OL + 10} strokeLinecap="round" strokeLinejoin="round" />
      <path d={arm} fill="none" stroke={C.kuning} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={24} y={270} width={120} height={26} rx={12} fill={C.kuning} stroke={C.thunder} strokeWidth={OL} />
      <path d="M100 44 L200 94 Q180 136 146 124 L80 74 Z" fill={C.kuning} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
      <path d="M108 62 L136 76" stroke={tint(C.kuning, 0.55)} strokeWidth={9} strokeLinecap="round" />
      <circle cx={126} cy={76} r={10} fill={C.thunder} />
    </svg>
  );
};
