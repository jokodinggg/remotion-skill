import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useBrand } from "../brand/BrandProvider";
import { poppins } from "../brand/fonts";
import { normalizeWord } from "../timeline/normalize";
import { useTimeline } from "../timeline/TimelineProvider";
import { activeChunk } from "./active";

const FADE_IN_MS = 80;
const SCALE_MS = 120;
const KEYWORD_SCALE = 1.08;
const BOTTOM = 1920 - 1480;

function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeline = useTimeline();
  const { caption } = useBrand();
  const ms = (frame / fps) * 1000;

  const active = activeChunk(timeline, ms);
  if (!active) return null;
  const { chunk } = active;

  const opacity = interpolate(ms - chunk.showFromMs, [0, FADE_IN_MS], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 1080 - 960,
        bottom: BOTTOM,
        display: "flex",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          maxWidth: 840,
          boxSizing: "border-box",
          padding: "16px 28px",
          borderRadius: 18,
          backgroundColor: withAlpha(caption.bg, caption.bgOpacity),
          fontFamily: poppins,
          fontWeight: caption.fontWeight,
          fontSize: caption.fontSize,
          lineHeight: 1.3,
          textAlign: "center",
          textTransform: "lowercase",
        }}
      >
        {chunk.words.map((word, i) => {
          const spoken = ms >= word.startMs;
          const isBrand = normalizeWord(word.text) === "jokoding";
          const color = word.keyword ? caption.keyword : isBrand ? caption.brandWord : caption.text;
          const scale = word.keyword
            ? interpolate(ms - word.startMs, [0, SCALE_MS], [1, KEYWORD_SCALE], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 1;
          return (
            <React.Fragment key={i}>
              {i > 0 ? " " : null}
              <span
                style={{
                  display: "inline-block",
                  margin: "0 0.04em",
                  color,
                  opacity: spoken ? 1 : caption.inactiveOpacity,
                  transform: `scale(${scale})`,
                }}
              >
                {word.text.toLowerCase()}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
