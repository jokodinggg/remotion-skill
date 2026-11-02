// Native viewBox 160 x 160 (aspect 1:1).
import React from "react";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { EXTRA_COLORS as X, STYLE, tint } from "../style";

const W = 160;
const OL = STYLE.outlineProp;

/** Round badge: Lawn Green check when `ok`, Merah cross otherwise (the only Merah prop). */
export const CheckCross: React.FC<{ ok: boolean; width?: number }> = ({ ok, width = W }) => {
  const { palette: C } = useBrand();
  const fill = ok ? C.lawnGreen : C.merah;
  return (
    <svg viewBox={`0 0 ${W} ${W}`} width={width} height={width} style={{ overflow: "visible" }}>
      <circle cx={80} cy={80} r={68} fill={fill} stroke={C.thunder} strokeWidth={OL} />
      <path d="M36 66 Q42 46 60 38" fill="none" stroke={tint(fill, 0.45)} strokeWidth={9} strokeLinecap="round" />
      <path
        d={ok ? "M48 82 L70 104 L114 58" : "M56 56 L104 104 M104 56 L56 104"}
        fill="none"
        stroke={X.white}
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
