import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { useBrand } from "../fondasi/brand/BrandProvider";
import { defaultExpression, type JoksExpression } from "../fondasi/expression";
import { Pop } from "../fondasi/motion/Pop";
import { useLine, useTalk } from "../fondasi/timeline/TimelineProvider";
import { Joks } from "../library/joks/Joks";
import { lerpPose, POSES } from "../library/joks/poses";
import { EXTRA_COLORS as X } from "../library/style";
import { Backdrop, blinkAt, BORDER, clamp, float, kick, Sparks, useKeywordFrames, useLineFrames, useSpringAt, useContentBox, useFillerKick, useTopClear } from "./parts";

const JOKS_W = 560; // with a prop: Joks on the left
const JOKS_W_SOLO = 660; // without a prop: Joks centred
const JOKS_H_RATIO = 1180 / 1006; // Joks svg viewBox aspect
const SPOT_D = 380;
const POINT_FRAMES = 12;

/** Four-point sparkle star. */
const Sparkle: React.FC<{ x: number; y: number; s: number; color: string; stroke: string }> = ({ x, y, s, color, stroke }) => (
  <svg width={s} height={s} viewBox="-50 -50 100 100" style={{ position: "absolute", left: x - s / 2, top: y - s / 2, overflow: "visible" }}>
    <path d="M0 -48 Q8 -8 48 0 Q8 8 0 48 Q-8 8 -48 0 Q-8 -8 0 -48 Z" fill={color} stroke={stroke} strokeWidth={7} strokeLinejoin="round" />
  </svg>
);

/**
 * JoksSolusi: Joks rises in from below and explains, mouth driven by
 * `useTalk(lineId)`, blinking on a seed. With a `prop`, Joks stands left and
 * on the first Kata Kunci the prop pops onto a spotlight disc (top-right,
 * centre ~x 760 y 600, below the logo; fit it to ~280 x 280) while Joks swings into the
 * pointing pose; sparkles land on the second keyword. Without a prop Joks
 * stands centred and bounces on each keyword. Filler beats add a small hop
 * if the line would otherwise sit still for > 1.5 s.
 * `expression` defaults to `defaultExpression(line.tag).joks`.
 */
export const JoksSolusi: React.FC<{ lineId: string; prop?: React.ReactNode; expression?: JoksExpression }> = ({ lineId, prop, expression }) => {
  const frame = useCurrentFrame();
  const { palette: C } = useBrand();
  const box = useContentBox();
  const line = useLine(lineId);
  const talk = useTalk(lineId);
  const { start } = useLineFrames(lineId);
  const kw = useKeywordFrames(lineId);
  const expr = expression ?? defaultExpression(line.tag).joks;
  const propAt = kw[0] ?? start + 30;
  const sparkleAt = kw[1] ?? propAt + 45;

  const enter = useSpringAt(start, "bouncy");
  const spotIn = useSpringAt(propAt - 3, "bouncy");
  const sparkleIn = useSpringAt(sparkleAt, "bouncy");
  const point = prop ? interpolate(frame, [propAt, propAt + POINT_FRAMES], [0, 1], clamp) : 0;
  const pose = point > 0 ? lerpPose(POSES[expr], POSES.nunjuk, point) : undefined;
  const hop = kw.reduce((a, f) => a + kick(frame, f, 24), 0) + useFillerKick(lineId, [start, propAt, sparkleAt, ...kw]) * 0.6;
  const topClear = useTopClear();

  const w = prop ? JOKS_W : JOKS_W_SOLO;
  const h = w * JOKS_H_RATIO;
  const left = prop ? box.x : box.x + (box.w - w) / 2;
  const bottom = box.y + box.h;
  const spot = { x: box.x + box.w - SPOT_D / 2 - 10, y: topClear + 10 + SPOT_D / 2 }; // below the logo box

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Backdrop />
      {prop && (
        <>
          {/* spotlight disc with a rotating dashed ring */}
          <div style={{ position: "absolute", left: spot.x - SPOT_D / 2, top: spot.y - SPOT_D / 2, transform: `scale(${Math.min(1.1, spotIn)})` }}>
            <svg width={SPOT_D} height={SPOT_D} viewBox={`0 0 ${SPOT_D} ${SPOT_D}`} style={{ overflow: "visible" }}>
              <circle cx={SPOT_D / 2} cy={SPOT_D / 2 + 12} r={SPOT_D / 2 - 30} fill={C.thunder} />
              <circle cx={SPOT_D / 2} cy={SPOT_D / 2} r={SPOT_D / 2 - 30} fill={X.white} stroke={C.thunder} strokeWidth={BORDER} />
              <circle
                cx={SPOT_D / 2}
                cy={SPOT_D / 2}
                r={SPOT_D / 2 - 6}
                fill="none"
                stroke={C.lawnGreen}
                strokeWidth={8}
                strokeDasharray="22 18"
                strokeLinecap="round"
                transform={`rotate(${frame * 0.8} ${SPOT_D / 2} ${SPOT_D / 2})`}
              />
            </svg>
          </div>
          <Sparks at={propAt} cx={spot.x} cy={spot.y} r={SPOT_D / 2} count={12} />
          <div
            style={{
              position: "absolute",
              left: spot.x - SPOT_D / 2,
              top: spot.y - SPOT_D / 2,
              width: SPOT_D,
              height: SPOT_D,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `translateY(${float(frame, 2, 6)}px) scale(${1 + kick(frame, sparkleAt, 22) * 0.1})`,
            }}
          >
            <Pop at={propAt} preset="bouncy" from={0.2}>
              {prop}
            </Pop>
          </div>
          {sparkleIn > 0 && (
            <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, sparkleIn) }}>
              <Sparkle x={spot.x - SPOT_D / 2 + 20} y={spot.y - SPOT_D / 2 + 30} s={70 * Math.min(1.1, sparkleIn)} color={C.kuning} stroke={C.thunder} />
              <Sparkle x={spot.x + SPOT_D / 2 - 24} y={spot.y + SPOT_D / 2 - 40} s={54 * Math.min(1.1, sparkleIn)} color={C.glow} stroke={C.thunder} />
            </div>
          )}
        </>
      )}
      <div
        style={{
          position: "absolute",
          left,
          top: bottom - h,
          width: w,
          height: h,
          // short rise + fade: a long slide from below would cross the caption band and bottom zone
          opacity: Math.min(1, enter * 3),
          transform: `translateY(${(1 - Math.min(1, enter)) * 220 - hop * 40}px)`,
        }}
      >
        <Joks expression={expr} pose={pose} talk={talk} blink={blinkAt(frame, 7)} width={w} seed={7} />
      </div>
    </AbsoluteFill>
  );
};
