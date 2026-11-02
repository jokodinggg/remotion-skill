// Native viewBox 960 x 260 (aspect 48:13). Port of the spike kit Desk.
import React from "react";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { EXTRA_COLORS as X, STYLE } from "../style";

const W = 960;
const H = 260;
const OL = STYLE.outlineProp;

/** Study desk seen from the front: wooden top slab over a two-drawer cabinet. */
export const Desk: React.FC<{ width?: number }> = ({ width = W }) => {
  const { palette: C } = useBrand();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} style={{ overflow: "visible" }}>
      <rect x={60} y={66} width={840} height={189} fill={X.woodDark} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
      <rect x={10} y={10} width={940} height={56} rx={18} fill={X.wood} stroke={C.thunder} strokeWidth={OL} />
      <path d="M44 32 L300 32" stroke={X.woodGloss} strokeWidth={10} strokeLinecap="round" />
      {[120, 540].map((x) => (
        <g key={x}>
          <rect x={x} y={100} width={300} height={70} rx={12} fill={X.wood} stroke={C.thunder} strokeWidth={OL} />
          <rect x={x + 120} y={128} width={60} height={14} rx={7} fill={C.thunder} />
        </g>
      ))}
    </svg>
  );
};
