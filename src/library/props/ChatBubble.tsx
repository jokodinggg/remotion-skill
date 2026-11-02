// Native viewBox 480 x 200 (aspect 12:5). Text is clamped to three lines.
import React from "react";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { poppins } from "../../fondasi/brand/fonts";
import { EXTRA_COLORS as X, STYLE } from "../style";

const W = 480;
const H = 200;
const OL = STYLE.outlineProp;
/** Bubble body 10..470 x 10..160 with the tail at bottom-left; mirrored for "right". */
const SHAPE = "M50 10 H430 Q470 10 470 50 V120 Q470 160 430 160 H124 L46 194 L72 160 H50 Q10 160 10 120 V50 Q10 10 50 10 Z";

/**
 * Chat bubble card. "left": incoming, white. "right": outgoing, Hijau Terang.
 * Font size steps down for longer text; aim for under ~60 characters.
 */
export const ChatBubble: React.FC<{ text: string; from: "left" | "right"; width?: number }> = ({ text, from, width = W }) => {
  const { palette: C } = useBrand();
  const mirror = from === "right" ? `translate(${W} 0) scale(-1 1)` : undefined;
  const fontSize = text.length <= 22 ? 40 : text.length <= 44 ? 32 : 26;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} style={{ overflow: "visible" }}>
      <g transform={mirror}>
        <path d={SHAPE} transform={`translate(0 ${STYLE.hardShadowOffset})`} fill={C.thunder} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
        <path d={SHAPE} fill={from === "right" ? C.hijauTerang : X.white} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
      </g>
      <foreignObject x={36} y={20} width={408} height={130}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: from === "right" ? "flex-end" : "flex-start",
            textAlign: from === "right" ? "right" : "left",
            fontFamily: poppins,
            fontWeight: 600,
            fontSize,
            lineHeight: 1.15,
            color: C.thunder,
            overflow: "hidden",
          }}
        >
          <span style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{text}</span>
        </div>
      </foreignObject>
    </svg>
  );
};
