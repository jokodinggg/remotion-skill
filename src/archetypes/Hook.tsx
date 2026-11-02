import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { useBrand } from "../fondasi/brand/BrandProvider";
import { poppins } from "../fondasi/brand/fonts";
import { Camera } from "../fondasi/motion/Camera";
import { Pop } from "../fondasi/motion/Pop";
import { normalizeWord } from "../fondasi/timeline/normalize";
import { useLine } from "../fondasi/timeline/TimelineProvider";
import { Backdrop, clamp, kick, TYPE, useKeywordFrames, useLineFrames, useSpringAt, useContentBox, useFillerKick, useTopClear } from "./parts";

const WORD_STAGGER = 4; // frames between headline words
const CHARACTER_DELAY = 16; // frames after line start
const CHARACTER_SLOT_H = 360;
const PUSH = 1.06; // keeps the slot bottom (y 1150) above the caption band at full push

/**
 * Hook: one big question or statement (120 px / 800) that slams in word by
 * word, a Kuning marker under every headline word that matches a Kata Kunci
 * (drawn when the keyword is spoken), an optional reacting character below,
 * and a slow camera push with a punch on the first keyword. Filler beats
 * bump the headline if the line would otherwise sit still for > 1.5 s.
 * With a character the headline starts below the logo (y 400) and the
 * character slot is the bottom 360 px (fit it to ~600 x 360).
 */
export const Hook: React.FC<{ lineId: string; headline: string; character?: React.ReactNode }> = ({ lineId, headline, character }) => {
  const frame = useCurrentFrame();
  const { palette: C } = useBrand();
  const box = useContentBox();
  const line = useLine(lineId);
  const { start, end } = useLineFrames(lineId);
  const kwFrames = useKeywordFrames(lineId);
  const kwWords = line.words.filter((w) => w.keyword);
  const firstKw = kwFrames[0] ?? start + 30;

  const words = headline.split(/\s+/).filter(Boolean);
  const markerAt = (word: string): number | null => {
    const i = kwWords.findIndex((k) => normalizeWord(k.text) === normalizeWord(word));
    return i < 0 ? null : kwFrames[i];
  };

  const charIn = useSpringAt(start + CHARACTER_DELAY, "bouncy");
  const jump = kwFrames.reduce((acc, f) => acc + kick(frame, f, 26), 0);
  const originY = box.y + box.h / 2;
  const topClear = useTopClear();
  const filler = useFillerKick(lineId, [start + words.length * WORD_STAGGER, start + CHARACTER_DELAY, ...kwFrames]);
  const headTop = character ? topClear : box.y;
  const headH = character ? box.y + box.h - CHARACTER_SLOT_H - topClear : box.h;

  return (
    <AbsoluteFill style={{ fontFamily: poppins, overflow: "hidden" }}>
      <Camera
        origin={`540px ${originY}px`}
        keys={[
          { frame: start, scale: 1, x: 0, y: 0 },
          { frame: firstKw, scale: 1.02, x: 0, y: 0 },
          { frame: firstKw + 8, scale: 1.04, x: 0, y: 0 },
          { frame: end, scale: PUSH, x: 0, y: 0 },
        ]}
      >
        <Backdrop />
        <div
          style={{
            position: "absolute",
            left: box.x,
            width: box.w,
            top: headTop,
            height: headH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ ...TYPE.headline, color: C.thunder, textAlign: "center", textWrap: "balance", transform: `scale(${1 + filler * 0.04})` }}>
            {words.map((word, i) => {
              const at = start + i * WORD_STAGGER;
              const t = interpolate(frame, [at, at + 10], [0, 1], clamp);
              const mAt = markerAt(word);
              const m = mAt === null ? 0 : interpolate(frame, [mAt, mAt + 8], [0, 1], clamp);
              const bump = mAt === null ? 0 : kick(frame, mAt, 20);
              return (
                <span
                  key={i}
                  style={{
                    position: "relative",
                    display: "inline-block",
                    margin: "0 0.12em",
                    opacity: t,
                    transform: `translateY(${(1 - t) * 50}px) scale(${1 + bump * 0.12}) rotate(${mAt === null ? 0 : -2 * m}deg)`,
                  }}
                >
                  {mAt !== null && (
                    <span
                      style={{
                        position: "absolute",
                        left: "-0.1em",
                        right: "-0.1em",
                        bottom: "0.04em",
                        height: "0.5em",
                        background: C.kuning,
                        borderRadius: 14,
                        transform: `scaleX(${m})`,
                        transformOrigin: "0 50%",
                        zIndex: -1,
                      }}
                    />
                  )}
                  <span style={{ position: "relative" }}>{word}</span>
                </span>
              );
            })}
          </div>
        </div>
        {character && (
          <div
            style={{
              position: "absolute",
              left: box.x,
              width: box.w,
              top: box.y + box.h - CHARACTER_SLOT_H,
              height: CHARACTER_SLOT_H,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              transform: `translateY(${(1 - Math.min(charIn, 1)) * 120 - jump * 60}px)`,
              opacity: Math.min(1, charIn * 2),
            }}
          >
            <Pop at={start + CHARACTER_DELAY} preset="bouncy" from={0.8}>
              {character}
            </Pop>
          </div>
        )}
      </Camera>
    </AbsoluteFill>
  );
};
