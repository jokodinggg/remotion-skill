import React from "react";
import { interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { useBrand } from "../fondasi/brand/BrandProvider";
import { SPRINGS, type SpringPreset } from "../fondasi/motion/springs";
import { useSafeArea, type Rect } from "../fondasi/layout/safeArea";
import { useLine, useTimeline } from "../fondasi/timeline/TimelineProvider";
import { atKeyword } from "../fondasi/motion/timing";
import { LatarBrand } from "../library/stages/LatarBrand";
import { fillerBeats, MAX_BEAT_GAP_S } from "./tempo";
import { STYLE } from "../library/style";

/** Shared building blocks for the archetypes: line frames, springs, sticker styling, accents. */

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Sticker border width for archetype UI (cards, pills, badges) at composition scale. */
export const BORDER = 8;

export const TYPE = {
  headline: { fontSize: 120, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 },
  headlineS: { fontSize: 96, fontWeight: 800, lineHeight: 1.02, letterSpacing: -1.5 },
  label: { fontSize: 44, fontWeight: 600, lineHeight: 1.15 },
  labelS: { fontSize: 36, fontWeight: 600, lineHeight: 1.15 },
} as const;

/** Archetype content stops here: 30 px above the caption band (y 1180–1480). */
export const CONTENT_BOTTOM = 1150;

/** The safe area from useSafeArea(), cut off at CONTENT_BOTTOM: where archetype content lives. */
export function useContentBox(): Rect {
  const safe = useSafeArea();
  return { ...safe, h: Math.min(safe.h, CONTENT_BOTTOM - safe.y) };
}

const LOGO_BOX_H = 120; // same logo box QaOverlay draws
const LOGO_MARGIN = 18;

/** The logo box QaOverlay outlines (x 810–1020, y 262–382 for jokoding). */
export function useLogoBox(): Rect {
  const { logo } = useBrand();
  return { x: 1080 - logo.right - logo.width, y: logo.top, w: logo.width, h: LOGO_BOX_H };
}

/**
 * Top edge for anything that reaches under the logo box: its bottom plus a
 * margin, i.e. y 400 for jokoding. The safe box starts at y 300, so its
 * top-right corner overlaps the logo; keep that corner empty.
 */
export function useTopClear(): number {
  const logo = useLogoBox();
  return logo.y + logo.h + LOGO_MARGIN;
}

/**
 * Kick amount from filler beats: given the frames where an archetype already
 * changes, adds a subtle accent wherever the line would otherwise go more than
 * 1.5 s without a visible change.
 */
export function useFillerKick(lineId: string, anchors: number[]): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { start, end } = useLineFrames(lineId);
  return fillerBeats(anchors, start, end, Math.round(MAX_BEAT_GAP_S * fps)).reduce((a, f) => a + kick(frame, f, 22), 0);
}

/** Absolute frames of a line: first frame, last frame (exclusive), and word span. */
export function useLineFrames(lineId: string) {
  const { fps } = useVideoConfig();
  const line = useLine(lineId);
  const f = (ms: number) => Math.round((ms / 1000) * fps);
  return {
    start: f(line.startMs),
    end: f(line.startMs + line.durMs),
    firstWord: f(line.words[0]?.startMs ?? line.startMs),
    lastWord: f(line.words.at(-1)?.startMs ?? line.startMs),
  };
}

/** Frames of every Kata Kunci of a line, in order. */
export function useKeywordFrames(lineId: string): number[] {
  const { fps } = useVideoConfig();
  const timeline = useTimeline();
  const count = useLine(lineId).words.filter((w) => w.keyword).length;
  return Array.from({ length: count }, (_, i) => atKeyword(timeline, lineId, i, fps));
}

/** Spring progress 0..1(+overshoot) from frame `at`; 0 before it. */
export function useSpringAt(at: number, preset: SpringPreset = "snappy"): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return 0;
  return spring({ frame: frame - at, fps, config: SPRINGS[preset] });
}

/** Decaying kick 0→1→0 over ~`len` frames after `at` (for accents on a Kata Kunci). */
export const kick = (frame: number, at: number, len = 22): number => {
  if (frame < at || frame > at + len) return 0;
  const t = (frame - at) / len;
  return Math.sin(t * Math.PI) * (1 - t);
};

/** Decaying wiggle in degrees after `at`. */
export const wiggle = (frame: number, at: number, amp = 8, len = 34): number => {
  if (frame < at || frame > at + len) return 0;
  const t = (frame - at) / len;
  return Math.sin(t * Math.PI * 5) * amp * (1 - t);
};

/** Seeded eyelid close 0..1: a short blink roughly every 3 s. */
export const blinkAt = (frame: number, seed: number): number => {
  const period = 170 + Math.floor(random(`blink-${seed}`) * 60);
  const local = (frame + Math.floor(random(`blink-o-${seed}`) * period)) % period;
  return local < 8 ? Math.sin((local / 8) * Math.PI) : 0;
};

/** Idle float in px, so nothing sits dead still between beats. */
export const float = (frame: number, seed = 0, amp = 8): number => Math.sin(frame / 24 + seed * 1.7) * amp;

/** Default archetype backdrop: LatarBrand with drifting glyphs, full-bleed. */
export const Backdrop: React.FC = () => <LatarBrand t={useCurrentFrame()} />;

/** Sticker surface: flat fill, Thunder outline, hard offset shadow. */
export function useSticker() {
  const { palette: C } = useBrand();
  return (fill: string, radius = 36): React.CSSProperties => ({
    background: fill,
    border: `${BORDER}px solid ${C.thunder}`,
    borderRadius: radius,
    boxShadow: `${STYLE.hardShadow} ${C.thunder}`,
    boxSizing: "border-box",
  });
}

/** Rays bursting out of a centre point at `at` (accent for a Kata Kunci). */
export const Sparks: React.FC<{ at: number; cx: number; cy: number; r: number; count?: number; colors?: string[] }> = ({
  at,
  cx,
  cy,
  r,
  count = 10,
  colors,
}) => {
  const frame = useCurrentFrame();
  const { palette: C } = useBrand();
  const local = frame - at;
  if (local < 0 || local > 30) return null;
  const t = interpolate(local, [0, 30], [0, 1], clamp);
  const ease = 1 - (1 - t) ** 3;
  const cols = colors ?? [C.kuning, C.lawnGreen];
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }} width={1} height={1}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + 0.3;
        const r0 = r + 30 * ease;
        const r1 = r + 30 + 80 * ease;
        const len = (r1 - r0) * (1 - t);
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r0}
            y1={cy + Math.sin(a) * r0}
            x2={cx + Math.cos(a) * (r0 + len + 1)}
            y2={cy + Math.sin(a) * (r0 + len + 1)}
            stroke={cols[i % cols.length]}
            strokeWidth={14}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

/** Spiky starburst sticker (Kuning by default) used behind a problem or number. */
export const Burst: React.FC<{ size: number; fill?: string; points?: number; rotate?: number }> = ({ size, fill, points = 14, rotate = 0 }) => {
  const { palette: C } = useBrand();
  const R = 100;
  const r = 78;
  const d = Array.from({ length: points * 2 }, (_, i) => {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    return `${i === 0 ? "M" : "L"}${(110 + Math.cos(a) * rad).toFixed(1)} ${(110 + Math.sin(a) * rad).toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 220 232" width={size} height={(size * 232) / 220} style={{ overflow: "visible", transform: `rotate(${rotate}deg)` }}>
      <path d={`${d} Z`} transform="translate(0 6)" fill={C.thunder} />
      <path d={`${d} Z`} fill={fill ?? C.kuning} stroke={C.thunder} strokeWidth={4} strokeLinejoin="round" />
    </svg>
  );
};
