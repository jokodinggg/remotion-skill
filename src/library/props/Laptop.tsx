// Native viewBox 340 x 230 (aspect 34:23), both sides. Back side ported from the spike kit LaptopBack.
import React, { useId } from "react";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { EXTRA_COLORS as X, STYLE } from "../style";

const W = 340;
const H = 230;
const OL = STYLE.outlineProp;

/**
 * Laptop. "back": lid towards the camera (someone works behind it).
 * "front": open screen facing the camera. `glow` (0..1) is the screen light,
 * the one gradient the style allows.
 */
export const Laptop: React.FC<{ side: "front" | "back"; glow?: number; width?: number }> = ({ side, glow = 0.6, width = W }) => {
  const { palette: C } = useBrand();
  const glowId = `laptopGlow${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor={C.glow} stopOpacity={0.55} />
          <stop offset="100%" stopColor={C.glow} stopOpacity={0} />
        </radialGradient>
      </defs>
      {glow > 0 && <ellipse cx={170} cy={108} rx={230} ry={150} fill={`url(#${glowId})`} opacity={glow} />}
      {side === "back" ? (
        <>
          <rect x={20} y={10} width={300} height={196} rx={20} fill={X.metal} stroke={C.thunder} strokeWidth={OL} />
          <path d="M44 34 L120 34" stroke={X.metalLight} strokeWidth={10} strokeLinecap="round" />
          <circle cx={170} cy={108} r={24} fill={X.metalLight} stroke={C.thunder} strokeWidth={OL - 4} />
          <rect x={0} y={198} width={340} height={26} rx={10} fill={X.metalDark} stroke={C.thunder} strokeWidth={OL} />
        </>
      ) : (
        <>
          <rect x={30} y={10} width={280} height={180} rx={18} fill={X.metal} stroke={C.thunder} strokeWidth={OL} />
          <rect x={48} y={28} width={244} height={144} rx={8} fill={C.layar} />
          {[
            { x: 66, y: 52, w: 110, c: C.glow },
            { x: 86, y: 78, w: 140, c: C.hijauTerang },
            { x: 86, y: 104, w: 90, c: C.kuning },
            { x: 66, y: 130, w: 120, c: C.glow },
          ].map((l) => (
            <rect key={l.y} x={l.x} y={l.y} width={l.w} height={12} rx={6} fill={l.c} />
          ))}
          <path d="M0 198 L340 198 L326 222 Q322 226 314 226 L26 226 Q18 226 14 222 Z" fill={X.metalDark} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
          <path d="M140 198 L200 198 L196 206 L144 206 Z" fill={C.thunder} />
        </>
      )}
    </svg>
  );
};
