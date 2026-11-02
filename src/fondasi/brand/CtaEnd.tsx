import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useBrand } from "./BrandProvider";
import { poppins } from "./fonts";

const CARD_TOP = 820;

/** Closing CTA card plus closing line. Renders nothing before `startFrame`. */
export const CtaEnd: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { palette, cta } = useBrand();
  if (frame < startFrame) return null;

  const t = spring({ frame: frame - startFrame, fps, config: { damping: 12, stiffness: 140 } });
  const scale = interpolate(t, [0, 1], [0.6, 1]);
  const rotate = interpolate(t, [0, 1], [-6, -2]);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: CARD_TOP,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 56,
        opacity: Math.min(1, t),
        transform: `scale(${scale}) rotate(${rotate}deg)`,
        transformOrigin: "50% 0%",
        fontFamily: poppins,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          background: palette.lawnGreen,
          borderRadius: 30,
          border: `8px solid ${palette.thunder}`,
          padding: "22px 32px",
          boxShadow: `0 12px 0 ${palette.thunder}`,
        }}
      >
        <svg width={74} height={74} viewBox="0 0 74 74">
          <path
            d="M37 6 C20 6 7 18 7 34 C7 41 10 47 14 52 L10 66 L25 60 C29 62 33 62 37 62 C54 62 67 50 67 34 C67 18 54 6 37 6 Z"
            fill={palette.mintCream}
            stroke={palette.thunder}
            strokeWidth={6}
            strokeLinejoin="round"
          />
          <circle cx={24} cy={34} r={5} fill={palette.thunder} />
          <circle cx={37} cy={34} r={5} fill={palette.thunder} />
          <circle cx={50} cy={34} r={5} fill={palette.thunder} />
        </svg>
        <div>
          <div style={{ fontWeight: 800, fontSize: 44, color: palette.mintCream, lineHeight: 1.05 }}>{cta.title}</div>
          <div style={{ fontWeight: 600, fontSize: 28, color: palette.glow }}>{cta.sub}</div>
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 56, lineHeight: 1.1, color: palette.thunder }}>{cta.closing}</div>
    </div>
  );
};
