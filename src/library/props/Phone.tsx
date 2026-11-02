// Native viewBox 200 x 380 (aspect 10:19).
import React from "react";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { EXTRA_COLORS as X, STYLE, tint } from "../style";

const W = 200;
const H = 380;
const OL = STYLE.outlineProp;

/** Generic smartphone, screen towards the camera, showing a chat. No brand marks. */
export const Phone: React.FC<{ width?: number }> = ({ width = W }) => {
  const { palette: C } = useBrand();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} style={{ overflow: "visible" }}>
      <rect x={10} y={10} width={180} height={360} rx={34} fill={X.charcoal} stroke={C.thunder} strokeWidth={OL} />
      <path d="M17 70 L17 150" stroke={tint(X.charcoal, 0.4)} strokeWidth={5} strokeLinecap="round" />
      <rect x={26} y={34} width={148} height={312} rx={16} fill={C.layar} />
      <rect x={76} y={20} width={48} height={10} rx={5} fill={C.thunder} />
      <rect x={40} y={70} width={92} height={34} rx={14} fill={X.white} />
      <rect x={68} y={118} width={92} height={34} rx={14} fill={C.hijauTerang} />
      <rect x={40} y={166} width={70} height={34} rx={14} fill={X.white} />
      <rect x={60} y={214} width={100} height={34} rx={14} fill={C.hijauTerang} />
      <rect x={40} y={298} width={120} height={30} rx={15} fill={tint(C.layar, 0.15)} />
    </svg>
  );
};
