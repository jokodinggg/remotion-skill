import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { useBrand } from "../fondasi/brand/BrandProvider";
import { poppins } from "../fondasi/brand/fonts";
import { Pop } from "../fondasi/motion/Pop";
import { useAtWord } from "../fondasi/timeline/TimelineProvider";
import { EXTRA_COLORS as X, tint } from "../library/style";
import { Backdrop, BORDER, clamp, kick, Sparks, TYPE, useKeywordFrames, useLineFrames, useSpringAt, useSticker, useContentBox, useFillerKick } from "./parts";

const RING_D = 560;
const RING_W = 58; // gauge band width
const TICKS = 36;
const COUNT_FRAMES = 42;
const LABEL_DELAY = 14;
const LABEL_GAP = 70;

const formatId = (n: number): string => Math.round(n).toLocaleString("id-ID");

/**
 * Angka: a big counting number inside a gauge ring.
 * - Ring pops at line start; the number counts 0 → `value` over 0.7 s from
 *   the `countAt` keyword (default: first Kata Kunci), the ring fills with it
 *   (to value/100 when `suffix` is "%", else full), and sparks fire on landing.
 * - `label` sits in a Thunder pill under the ring (label type, keep ≤ 30 chars)
 *   and pulses on every Kata Kunci after the count lands (plus filler beats so
 *   the line never sits still for > 1.5 s).
 * The number is headline type (140 px / 800) so it stays inside the
 * typography rule; the 560 px ring carries the "big number" weight.
 */
export const Angka: React.FC<{ lineId: string; value: number; suffix?: string; label: string; countAt?: string }> = ({
  lineId,
  value,
  suffix,
  label,
  countAt,
}) => {
  const frame = useCurrentFrame();
  const { palette: C } = useBrand();
  const sticker = useSticker();
  const box = useContentBox();
  const { start } = useLineFrames(lineId);
  const kw = useKeywordFrames(lineId);
  const countWord = useAtWord(lineId, countAt ?? 0);
  const countStart = countAt ? countWord : (kw[0] ?? start + 20);
  const landAt = countStart + COUNT_FRAMES;

  const t = interpolate(frame, [countStart, landAt], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const shown = value * t;
  const fillTo = suffix === "%" ? Math.min(1, Math.max(0, value / 100)) : 1;
  const land = kick(frame, landAt, 24);
  const labelIn = useSpringAt(start + LABEL_DELAY, "bouncy");
  const laterKw = kw.filter((f) => f > landAt);
  const pulse =
    laterKw.reduce((a, f) => a + kick(frame, f, 22), 0) + useFillerKick(lineId, [start + LABEL_DELAY, countStart, landAt, ...laterKw]);

  const cx = box.x + box.w / 2;
  const cy = box.y + 60 + RING_D / 2;
  const r = RING_D / 2 - RING_W / 2 - BORDER;
  const circ = 2 * Math.PI * r;

  return (
    <AbsoluteFill style={{ fontFamily: poppins, overflow: "hidden" }}>
      <Backdrop />
      {/* rays start behind the ring so their tips stay clear of the logo box */}
      <Sparks at={landAt} cx={cx} cy={cy} r={RING_D / 2 - 20} count={14} />
      <div style={{ position: "absolute", left: cx - RING_D / 2, top: cy - RING_D / 2, width: RING_D, height: RING_D }}>
        <Pop at={start} preset="bouncy" from={0.4}>
          <div style={{ position: "relative", width: RING_D, height: RING_D, transform: `scale(${1 + land * 0.06})` }}>
            <svg width={RING_D} height={RING_D + 12} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              {/* hard shadow + body */}
              <circle cx={RING_D / 2} cy={RING_D / 2 + 12} r={RING_D / 2 - BORDER / 2} fill={C.thunder} />
              <circle cx={RING_D / 2} cy={RING_D / 2} r={RING_D / 2 - BORDER / 2} fill={X.white} stroke={C.thunder} strokeWidth={BORDER} />
              {/* track + fill */}
              <circle cx={RING_D / 2} cy={RING_D / 2} r={r} fill="none" stroke={tint(C.lawnGreen, 0.8)} strokeWidth={RING_W} />
              <circle
                cx={RING_D / 2}
                cy={RING_D / 2}
                r={r}
                fill="none"
                stroke={C.lawnGreen}
                strokeWidth={RING_W}
                strokeLinecap="round"
                strokeDasharray={`${circ * fillTo * t} ${circ}`}
                transform={`rotate(-90 ${RING_D / 2} ${RING_D / 2})`}
                opacity={t > 0.001 ? 1 : 0}
              />
              {/* inner outline + ticks */}
              <circle cx={RING_D / 2} cy={RING_D / 2} r={r - RING_W / 2 - 2} fill={C.mintCream} stroke={C.thunder} strokeWidth={6} />
              {Array.from({ length: TICKS }, (_, i) => {
                const a = (i / TICKS) * Math.PI * 2;
                const lit = i / TICKS < fillTo * t;
                const r0 = r - RING_W / 2 - 26;
                const r1 = r0 - (i % 3 === 0 ? 26 : 14);
                return (
                  <line
                    key={i}
                    x1={RING_D / 2 + Math.sin(a) * r0}
                    y1={RING_D / 2 - Math.cos(a) * r0}
                    x2={RING_D / 2 + Math.sin(a) * r1}
                    y2={RING_D / 2 - Math.cos(a) * r1}
                    stroke={lit ? C.hijauTua : tint(C.thunder, 0.75)}
                    strokeWidth={6}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
                paddingTop: RING_D / 2 - 92,
                boxSizing: "border-box",
                color: C.thunder,
              }}
            >
              <span style={{ fontSize: 140, fontWeight: 800, letterSpacing: -4, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {formatId(shown)}
              </span>
              {suffix && <span style={{ ...TYPE.headlineS, color: C.lawnGreen, marginLeft: 6 }}>{suffix}</span>}
            </div>
          </div>
        </Pop>
      </div>
      <div
        style={{
          position: "absolute",
          left: box.x,
          width: box.w,
          top: cy + RING_D / 2 + LABEL_GAP,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            ...sticker(C.thunder, 999),
            padding: "18px 40px",
            color: C.mintCream,
            ...TYPE.label,
            textAlign: "center",
            maxWidth: box.w,
            opacity: Math.min(1, labelIn * 2),
            transform: `translateY(${(1 - Math.min(1, labelIn)) * 80}px) scale(${1 + pulse * 0.12}) rotate(-1.5deg)`,
          }}
        >
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};
