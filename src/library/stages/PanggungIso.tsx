import React from "react";
import { AbsoluteFill } from "remotion";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { STYLE, tint } from "../style";

/** Floor diamond centre and half-extents in composition px; stand figures around (cx, cy). */
export const PANGGUNG_ISO = { cx: 540, cy: 1150, halfW: 440, halfH: 220, depth: 46 } as const;
const N = 6; // tiles per side

/** Isometric stage, 1080 x 1920: Mint Cream with a tiled floor slab in light green tints. */
export const PanggungIso: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { palette: C } = useBrand();
  const { cx, cy, halfW, halfH, depth } = PANGGUNG_ISO;
  const pt = (i: number, j: number): string => `${cx + ((i - j) * halfW) / N} ${cy - halfH + ((i + j) * halfH) / N}`;
  const top = `${cx} ${cy - halfH}`;
  const right = `${cx + halfW} ${cy}`;
  const bottom = `${cx} ${cy + halfH}`;
  const left = `${cx - halfW} ${cy}`;
  const down = (p: string) => {
    const [x, y] = p.split(" ").map(Number);
    return `${x} ${y + depth}`;
  };
  const tiles: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      tiles.push(
        <path
          key={`${i}-${j}`}
          d={`M${pt(i, j)} L${pt(i + 1, j)} L${pt(i + 1, j + 1)} L${pt(i, j + 1)} Z`}
          fill={tint(C.lawnGreen, (i + j) % 2 ? 0.7 : 0.78)}
          stroke={tint(C.lawnGreen, 0.55)}
          strokeWidth={3}
        />,
      );
    }
  }
  return (
    <AbsoluteFill style={{ backgroundColor: C.mintCream }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d={`M${left} L${bottom} L${down(bottom)} L${down(left)} Z`} fill={tint(C.hijauTua, 0.5)} />
        <path d={`M${bottom} L${right} L${down(right)} L${down(bottom)} Z`} fill={tint(C.hijauTua, 0.35)} />
        {tiles}
        <path d={`M${left} L${bottom} L${right}`} fill="none" stroke={C.thunder} strokeWidth={STYLE.outlineProp} strokeLinejoin="round" />
        <path
          d={`M${top} L${right} L${down(right)} L${down(bottom)} L${down(left)} L${left} Z`}
          fill="none"
          stroke={C.thunder}
          strokeWidth={STYLE.outlineProp}
          strokeLinejoin="round"
        />
        <line x1={cx} y1={cy + halfH} x2={cx} y2={cy + halfH + depth} stroke={C.thunder} strokeWidth={STYLE.outlineProp} strokeLinecap="round" />
      </svg>
      <AbsoluteFill>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
