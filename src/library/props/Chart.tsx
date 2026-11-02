// Native viewBox 420 x 300 (aspect 7:5).
import React from "react";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { EXTRA_COLORS as X, STYLE, tint } from "../style";

const W = 420;
const H = 300;
const OL = STYLE.outlineProp;
const PLOT = { left: 54, right: 366, base: 236, height: 160 };

/**
 * Bar chart card. Bars scale to the largest of `values` and grow with
 * `progress` (0..1, default 1); the last bar is Hijau Tua as the highlight.
 */
export const Chart: React.FC<{ values: number[]; progress?: number; width?: number }> = ({ values, progress = 1, width = W }) => {
  const { palette: C } = useBrand();
  const max = Math.max(1e-9, ...values);
  const p = Math.max(0, Math.min(1, progress));
  const slot = (PLOT.right - PLOT.left) / Math.max(1, values.length);
  const barW = slot * 0.62;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} style={{ overflow: "visible" }}>
      <rect x={10} y={10 + STYLE.hardShadowOffset} width={400} height={270} rx={24} fill={C.thunder} stroke={C.thunder} strokeWidth={OL} />
      <rect x={10} y={10} width={400} height={270} rx={24} fill={X.white} stroke={C.thunder} strokeWidth={OL} />
      <rect x={38} y={34} width={120} height={14} rx={7} fill={X.cell} />
      {values.map((v, i) => {
        const h = (Math.max(0, v) / max) * PLOT.height * p;
        if (h < 2) return null;
        const x = PLOT.left + i * slot + (slot - barW) / 2;
        const fill = i === values.length - 1 ? C.hijauTua : C.lawnGreen;
        return (
          <g key={i}>
            <rect x={x} y={PLOT.base - h} width={barW} height={h} rx={8} fill={fill} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
            {h > 44 && <path d={`M${x + 12} ${PLOT.base - h + 16} L${x + 12} ${PLOT.base - h + 36}`} stroke={tint(fill, 0.4)} strokeWidth={6} strokeLinecap="round" />}
          </g>
        );
      })}
      <line x1={36} y1={PLOT.base} x2={384} y2={PLOT.base} stroke={C.thunder} strokeWidth={OL} strokeLinecap="round" />
    </svg>
  );
};
