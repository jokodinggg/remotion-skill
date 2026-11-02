import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useBrand } from "../fondasi/brand/BrandProvider";
import { poppins } from "../fondasi/brand/fonts";
import { Camera } from "../fondasi/motion/Camera";
import { Pop } from "../fondasi/motion/Pop";
import { Burst, kick, Sparks, TYPE, useKeywordFrames, useLineFrames, useSpringAt, useSticker, wiggle, useContentBox, useFillerKick, useTopClear } from "./parts";

const CHAR_W = 520; // character slot width, left part of the safe box
const PROBLEM_W = 420; // problem slot, top-right part of the safe box
const PROBLEM_H = 460;
const BURST_SIZE = 470;
const ALERT_D = 150;

/**
 * Masalah: a character on a stage, hit by a problem prop.
 * - `stage` renders full-bleed behind everything (slow camera push).
 * - `character` sits bottom-centre of the left slot (x 120–640, bottom y 1150)
 *   and slides in at line start. Size it to fit 520 x 680.
 * - `problem` pops on a Kuning starburst in the top-right slot (x 540–960,
 *   y 400–860, below the logo) at the first Kata Kunci and wiggles on every
 *   later one; an "!" badge lands on the second keyword; filler beats bump it
 *   when the line would sit still for > 1.5 s. Size it to fit about 340 x 360.
 */
export const Masalah: React.FC<{ lineId: string; stage: React.ReactNode; character: React.ReactNode; problem: React.ReactNode }> = ({
  lineId,
  stage,
  character,
  problem,
}) => {
  const frame = useCurrentFrame();
  const { palette: C } = useBrand();
  const sticker = useSticker();
  const box = useContentBox();
  const { start, end } = useLineFrames(lineId);
  const kw = useKeywordFrames(lineId);
  const problemAt = kw[0] ?? start + 24;
  const alertAt = kw[1] ?? problemAt + 40;

  const charIn = useSpringAt(start, "snappy");
  const burstIn = useSpringAt(problemAt - 4, "bouncy");
  const shake = kw.reduce((a, f) => a + wiggle(frame, f, 9), 0);
  const bump = kw.reduce((a, f) => a + kick(frame, f, 20), 0) + useFillerKick(lineId, [start, problemAt, alertAt, ...kw]);

  const px = box.x + box.w - PROBLEM_W;
  const py = useTopClear(); // the slot reaches x 960: stay below the logo box
  const cx = px + PROBLEM_W / 2;
  const cy = py + PROBLEM_H / 2;

  return (
    <AbsoluteFill style={{ fontFamily: poppins, overflow: "hidden" }}>
      <Camera origin="540px 760px" keys={[{ frame: start, scale: 1, x: 0, y: 0 }, { frame: end, scale: 1.04, x: 0, y: 0 }]}>
        <AbsoluteFill>{stage}</AbsoluteFill>

        {/* character, left slot */}
        <div
          style={{
            position: "absolute",
            left: box.x,
            width: CHAR_W,
            top: box.y + box.h - 680,
            height: 680,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            transform: `translateX(${(1 - Math.min(1, charIn)) * -420}px) rotate(${shake * 0.25}deg)`,
            transformOrigin: "50% 100%",
          }}
        >
          {character}
        </div>

        {/* problem, top-right slot */}
        <div
          style={{
            position: "absolute",
            left: cx - BURST_SIZE / 2,
            top: cy - BURST_SIZE / 2 - 6,
            transform: `scale(${Math.min(1.15, burstIn) * (1 + bump * 0.08)}) rotate(${frame * 0.25}deg)`,
          }}
        >
          <Burst size={BURST_SIZE} />
        </div>
        <Sparks at={problemAt} cx={cx} cy={cy} r={BURST_SIZE / 2 - 10} count={12} colors={[C.thunder]} />
        <div
          style={{
            position: "absolute",
            left: px,
            top: py,
            width: PROBLEM_W,
            height: PROBLEM_H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `rotate(${-4 + shake}deg) scale(${1 + bump * 0.06})`,
          }}
        >
          <Pop at={problemAt} preset="bouncy" from={0.3}>
            {problem}
          </Pop>
        </div>

        {/* alert badge on the second keyword */}
        <div style={{ position: "absolute", left: px - 30, top: py + PROBLEM_H - ALERT_D + 10, transform: `rotate(${-10 + wiggle(frame, alertAt, 12)}deg)` }}>
          <Pop at={alertAt} preset="bouncy" from={0.2}>
            <div
              style={{
                ...sticker(C.mintCream, ALERT_D / 2),
                width: ALERT_D,
                height: ALERT_D,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...TYPE.headlineS,
                color: C.thunder,
              }}
            >
              !
            </div>
          </Pop>
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
