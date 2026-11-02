// Native viewBox 440 x 320 (aspect 11:8).
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import { EXTRA_COLORS as X, STYLE } from "../style";

const W = 440;
const H = 320;
const OL = STYLE.outlineProp;
const BODY = { top: 78, bottom: 284, left: 40, right: 400 };
const BLINK_FRAMES = 15;

type Seg = { x: number; w: number; color: number };

/** Seeded code-like token bars per line: indent plus one to three segments. */
const codeLine = (i: number): Seg[] => {
  const r = (k: string) => random(`code-${i}-${k}`);
  let x = BODY.left + [0, 28, 56, 28][Math.floor(r("indent") * 4)];
  const segs: Seg[] = [];
  const n = 1 + Math.floor(r("n") * 3);
  for (let s = 0; s < n && x < BODY.right - 30; s++) {
    const w = Math.min(36 + r(`w${s}`) * 90, BODY.right - x);
    segs.push({ x, w, color: Math.floor(r(`c${s}`) * 4) });
    x += w + 14;
  }
  return segs;
};

/**
 * Dark editor window card with `lines` rows of code bars. `typed` (0..1,
 * default 1) reveals the bars in reading order; a Kuning cursor sits at the
 * end and blinks on the composition frame.
 */
export const CodeWindow: React.FC<{ lines: number; typed?: number; width?: number }> = ({ lines, typed = 1, width = W }) => {
  const { palette: C } = useBrand();
  const frame = useCurrentFrame();
  const colors = [C.glow, C.hijauTerang, C.kuning, X.white];
  const n = Math.max(1, Math.round(lines));
  const step = Math.min(34, (BODY.bottom - BODY.top) / n);
  const barH = Math.max(6, step * 0.42);
  const rows = Array.from({ length: n }, (_, i) => codeLine(i));
  const total = rows.reduce((a, segs) => a + segs.reduce((b, s) => b + s.w, 0), 0);
  let budget = Math.max(0, Math.min(1, typed)) * total;
  let cursor = { x: BODY.left, y: BODY.top };
  const visible = rows.map((segs, i) => {
    const y = BODY.top + i * step;
    return segs.map((s) => {
      const w = Math.min(s.w, budget);
      budget -= w;
      if (w > 0) cursor = { x: s.x + w + 6, y };
      return { ...s, w, y };
    });
  });
  const cursorOn = Math.floor(frame / BLINK_FRAMES) % 2 === 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} style={{ overflow: "visible" }}>
      <rect x={10} y={10 + STYLE.hardShadowOffset} width={420} height={290} rx={24} fill={C.thunder} stroke={C.thunder} strokeWidth={OL} />
      <rect x={10} y={10} width={420} height={290} rx={24} fill={C.layar} stroke={C.thunder} strokeWidth={OL} />
      <path d="M10 58 L10 34 Q10 10 34 10 L406 10 Q430 10 430 34 L430 58 Z" fill={C.thunder} />
      {[40, 68, 96].map((x) => (
        <circle key={x} cx={x} cy={34} r={8} fill={X.metal} />
      ))}
      {visible.flat().map((s, i) => (s.w > 0 ? <rect key={i} x={s.x} y={s.y} width={s.w} height={barH} rx={barH / 2} fill={colors[s.color]} /> : null))}
      {cursorOn && <rect x={cursor.x} y={cursor.y - 2} width={10} height={barH + 4} rx={2} fill={C.kuning} />}
    </svg>
  );
};
