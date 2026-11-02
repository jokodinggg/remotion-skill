import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useBrand } from "../fondasi/brand/BrandProvider";
import { poppins } from "../fondasi/brand/fonts";
import { EXTRA_COLORS as X, tint } from "../library/style";
import { Backdrop, float, kick, TYPE, useContentBox, useKeywordFrames, useLineFrames, useSpringAt, useSticker, useFillerKick, useTopClear } from "./parts";

type Side = { label: string; visual: React.ReactNode };

const GAP = 44;
const VS_D = 180;
const LR_TOP = 100; // lr: panels start below the VS badge, which straddles their top edge
const SHADOW_PAD = 20; // keeps the panels' hard shadow above the content bottom

/**
 * Perbandingan: A vs B on two sticker panels with a Kuning VS badge.
 * Beats: left panel slides in at line start (label bumps on the first Kata
 * Kunci), VS slams halfway, right panel slides in on the last Kata Kunci,
 * and the right label bumps again on the final word; filler beats bump the VS
 * badge if the line would sit still for > 1.5 s. By convention the right
 * (or bottom) side is the option the video recommends: it gets the Glow tint.
 * - "lr" (default): side by side, VS centred over the top edge, label pill at
 *   the bottom of each panel. Fit each visual to ~340 x 420.
 * - "tb": stacked, VS on the gap at the right, visual left and label right.
 *   Fit each visual to ~360 x 280.
 */
export const Perbandingan: React.FC<{ lineId: string; left: Side; right: Side; layout?: "lr" | "tb" }> = ({ lineId, left, right, layout = "lr" }) => {
  const frame = useCurrentFrame();
  const { palette: C } = useBrand();
  const sticker = useSticker();
  const box = useContentBox();
  const { start, lastWord } = useLineFrames(lineId);
  const kw = useKeywordFrames(lineId);
  const leftAccent = kw[0] ?? start + 12;
  const rightAt = kw.length > 1 ? kw[kw.length - 1] : Math.round((start + lastWord) / 2);
  const vsAt = Math.round((start + rightAt) / 2);

  const leftIn = useSpringAt(start, "snappy");
  const rightIn = useSpringAt(rightAt, "bouncy");
  const vsIn = useSpringAt(vsAt, "bouncy");
  const filler = useFillerKick(lineId, [leftAccent, vsAt, rightAt, lastWord]);
  const topClear = useTopClear();

  const lr = layout === "lr";
  const top = lr ? box.y + LR_TOP : topClear; // tb: the top panel spans to x 960, so start below the logo
  const h = box.y + box.h - SHADOW_PAD - top;
  const panelW = lr ? (box.w - GAP) / 2 : box.w;
  const panelH = lr ? h : (h - GAP) / 2;
  const rects = [
    { x: box.x, y: top },
    lr ? { x: box.x + panelW + GAP, y: top } : { x: box.x, y: top + panelH + GAP },
  ];
  const vs = lr ? { x: box.x + box.w / 2, y: top } : { x: box.x + box.w - VS_D / 2 - 30, y: top + panelH + GAP / 2 };

  const panel = (side: Side, i: 0 | 1) => {
    const p = i === 0 ? leftIn : rightIn;
    if (p === 0) return null;
    const off = (1 - Math.min(1.1, p)) * (i === 0 ? -360 : 360); // short slide + fade keeps it out of the right rail
    const accent = i === 0 ? kick(frame, leftAccent, 22) : kick(frame, rightAt + 6, 22) + kick(frame, lastWord, 22);
    const pill = (
      <div
        style={{
          ...sticker(i === 0 ? C.thunder : C.lawnGreen, 999),
          boxShadow: "none",
          padding: "14px 30px",
          color: C.mintCream,
          ...TYPE.label,
          textAlign: "center",
          transform: `scale(${1 + accent * 0.14}) rotate(${i === 0 ? -2 : 2}deg)`,
          maxWidth: lr ? panelW - 40 : 380,
        }}
      >
        {side.label}
      </div>
    );
    const visual = <div style={{ transform: `translateY(${float(frame, i * 3)}px)` }}>{side.visual}</div>;
    return (
      <div
        style={{
          ...sticker(i === 1 ? tint(C.glow, 0.55) : X.white),
          position: "absolute",
          left: rects[i].x,
          top: rects[i].y,
          width: panelW,
          height: panelH,
          display: "flex",
          flexDirection: lr ? "column" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: lr ? "90px 20px 40px" : "20px 40px",
          opacity: Math.min(1, p * 2.5),
          transform: `translateX(${off}px) rotate(${(i === 0 ? -1.2 : 1.2) * Math.min(1, p)}deg)`,
        }}
      >
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: lr ? "100%" : 400 }}>{visual}</div>
        {pill}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ fontFamily: poppins, overflow: "hidden" }}>
      <Backdrop />
      {panel(left, 0)}
      {panel(right, 1)}
      <div
        style={{
          ...sticker(C.kuning, VS_D / 2),
          position: "absolute",
          left: vs.x - VS_D / 2,
          top: vs.y - VS_D / 2,
          width: VS_D,
          height: VS_D,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...TYPE.headlineS,
          color: C.thunder,
          transform: `scale(${vsIn === 0 ? 0 : (0.3 + 0.7 * vsIn) * (1 + filler * 0.12)}) rotate(${-10 + Math.sin(frame / 18) * 4}deg)`,
        }}
      >
        VS
      </div>
    </AbsoluteFill>
  );
};
