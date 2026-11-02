// Native viewBox 300 x 330 (aspect 10:11). Port of the spike kit NightWindow, plus a daylight variant.
import React, { useId } from "react";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { EXTRA_COLORS as X, STYLE } from "../style";

const W = 300;
const H = 330;
const OL = STYLE.outlineProp;
const STARS: [number, number][] = [
  [60, 60],
  [110, 132],
  [70, 222],
  [232, 206],
  [180, 256],
];

/**
 * Four-pane window. `night` (default true): dark sky, crescent moon and stars
 * that twinkle with `t` (the frame, passed by the caller). `night={false}`:
 * daylight sky with a Kuning sun and clouds that drift slowly with `t`.
 */
export const NightWindow: React.FC<{ t: number; night?: boolean; width?: number }> = ({ t, night = true, width = W }) => {
  const { palette: C } = useBrand();
  const clipId = `windowPane${useId().replace(/:/g, "")}`;
  const drift = (speed: number, offset: number) => ((((t * speed + offset) % 380) + 380) % 380) - 80;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={clipId}>
          <rect x={10} y={10} width={280} height={300} rx={22} />
        </clipPath>
      </defs>
      <rect x={10} y={10} width={280} height={300} rx={22} fill={night ? C.layar : X.sky} />
      <g clipPath={`url(#${clipId})`}>
        {night ? (
          <>
            <circle cx={200} cy={90} r={40} fill={X.moon} />
            <circle cx={218} cy={78} r={36} fill={C.layar} />
            {STARS.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={4} fill={X.moon} opacity={0.4 + 0.6 * Math.abs(Math.sin(t / 20 + i))} />
            ))}
          </>
        ) : (
          <>
            <circle cx={214} cy={86} r={38} fill={C.kuning} stroke={C.thunder} strokeWidth={OL - 4} />
            {[
              [drift(0.25, 110), 200, 1],
              [drift(0.18, 230), 120, 0.75],
            ].map(([x, y, s], i) => (
              <path
                key={i}
                transform={`translate(${x} ${y}) scale(${s})`}
                d="M0 30 Q-4 6 20 6 Q28 -14 50 -6 Q70 -16 80 6 Q100 6 96 30 Z"
                fill={X.white}
                stroke={C.thunder}
                strokeWidth={(OL - 4) / s}
                strokeLinejoin="round"
              />
            ))}
          </>
        )}
      </g>
      <path d="M32 40 L32 120" stroke={X.white} strokeOpacity={night ? 0.18 : 0.6} strokeWidth={8} strokeLinecap="round" />
      <line x1={150} y1={10} x2={150} y2={310} stroke={C.thunder} strokeWidth={OL} />
      <line x1={10} y1={160} x2={290} y2={160} stroke={C.thunder} strokeWidth={OL} />
      <rect x={10} y={10} width={280} height={300} rx={22} fill="none" stroke={C.thunder} strokeWidth={OL} />
      <rect x={0} y={300} width={300} height={24} rx={10} fill={X.white} stroke={C.thunder} strokeWidth={OL} />
    </svg>
  );
};
