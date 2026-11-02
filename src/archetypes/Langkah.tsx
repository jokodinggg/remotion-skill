import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { useBrand } from "../fondasi/brand/BrandProvider";
import { poppins } from "../fondasi/brand/fonts";
import { atWord } from "../fondasi/motion/timing";
import { useTimeline } from "../fondasi/timeline/TimelineProvider";
import { CheckCross } from "../library/props/CheckCross";
import { EXTRA_COLORS as X, tint } from "../library/style";
import { Backdrop, kick, TYPE, useSpringAt, useSticker, useContentBox, useFillerKick, useLineFrames, useTopClear } from "./parts";

const CARD_H = 206; // max; four cards shrink to fit
const GAP = 40;
const GAP_4 = 20;
const FINALE_DELAY_S = 1; // after the last card: it gets its check and the stack waves
const BADGE_D = 136;
const TILT = [-1.5, 1.2, -1, 1.4];

/** One step card; the spring hook lives here so the parent can map items freely. */
const StepCard: React.FC<{
  n: number;
  title: string;
  at: number;
  doneAt: number;
  waveAt: number;
  extra: number;
  top: number;
  left: number;
  width: number;
  height: number;
}> = ({ n, title, at, doneAt, waveAt, extra, top, left, width, height }) => {
  const frame = useCurrentFrame();
  const { palette: C } = useBrand();
  const sticker = useSticker();
  const p = useSpringAt(at, "snappy");
  const done = frame >= doneAt;
  const check = useSpringAt(doneAt, "bouncy");
  const accent = kick(frame, at, 22) + kick(frame, waveAt, 20) + (done ? 0 : extra);
  if (p === 0) return null;
  const tilt = TILT[(n - 1) % TILT.length];
  return (
    <div
      style={{
        ...sticker(done ? X.white : tint(C.glow, 0.45)),
        position: "absolute",
        left,
        top,
        width,
        height,
        display: "flex",
        alignItems: "center",
        gap: 28,
        padding: "0 28px",
        transform: `translateX(${(1 - Math.min(1.05, p)) * 360}px) rotate(${tilt + (1 - Math.min(1, p)) * 6}deg) scale(${1 + accent * 0.05})`,
        // short slide + fade keeps the card out of the right rail (x > 960, y 900–1500)
        opacity: Math.min(1, p * 2.5) * (done ? 0.92 : 1),
      }}
    >
      {done ? (
        <div style={{ width: BADGE_D, height: BADGE_D, flexShrink: 0, transform: `scale(${0.5 + 0.5 * Math.min(1.15, check)})` }}>
          <CheckCross ok width={BADGE_D} />
        </div>
      ) : (
        <div
          style={{
            ...sticker(C.kuning, BADGE_D / 2),
            boxShadow: "none",
            width: BADGE_D,
            height: BADGE_D,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...TYPE.headlineS,
            color: C.thunder,
          }}
        >
          {n}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ ...TYPE.labelS, color: C.hijauTua, letterSpacing: 3 }}>LANGKAH {n}</div>
        <div style={{ ...TYPE.headlineS, color: C.thunder, whiteSpace: "nowrap" }}>{title}</div>
      </div>
    </div>
  );
};

/**
 * Langkah: numbered step cards (1-2-3, max 4) stacked in the safe box. Each
 * card slides in from the right at its `at` word (use the Kata Kunci); the
 * newest card is Glow-tinted with a Kuning number badge; when the next step
 * lands the card turns white and its badge flips to a green check. One second
 * after the last card (or on the line's last word, if sooner) the last card
 * gets its check and the stack waves. The stack starts below the logo (y 400).
 * Titles are headline type (96 px / 800) on one line: keep them ≤ 10 chars.
 */
export const Langkah: React.FC<{ lineId: string; items: { title: string; at: string }[] }> = ({ lineId, items }) => {
  const { fps } = useVideoConfig();
  const timeline = useTimeline();
  const box = useContentBox();
  const list = items.slice(0, 4);
  const ats = list.map((it) => atWord(timeline, lineId, it.at, fps));
  const { lastWord } = useLineFrames(lineId);
  const topClear = useTopClear();
  const finaleAt = Math.min(ats[ats.length - 1] + Math.round(FINALE_DELAY_S * fps), Math.max(lastWord, ats[ats.length - 1] + 1));
  const extra = useFillerKick(lineId, [...ats, finaleAt]);
  const gap = list.length > 3 ? GAP_4 : GAP;
  const bottom = box.y + box.h - 20; // room for the hard shadow
  const cardH = Math.min(CARD_H, (bottom - topClear - (list.length - 1) * gap) / list.length);
  const total = list.length * cardH + (list.length - 1) * gap;
  const top0 = Math.max(topClear, box.y + (box.h - total) / 2);
  return (
    <AbsoluteFill style={{ fontFamily: poppins, overflow: "hidden" }}>
      <Backdrop />
      {list.map((it, i) => (
        <StepCard
          key={i}
          n={i + 1}
          title={it.title}
          at={ats[i]}
          doneAt={i + 1 < ats.length ? ats[i + 1] : finaleAt}
          waveAt={finaleAt + i * 5}
          extra={extra}
          top={top0 + i * (cardH + gap)}
          left={box.x + 10}
          width={box.w - 20}
          height={cardH}
        />
      ))}
    </AbsoluteFill>
  );
};
