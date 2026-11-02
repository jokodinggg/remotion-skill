import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useBrand } from "../fondasi/brand/BrandProvider";
import { poppins } from "../fondasi/brand/fonts";
import type { Rect } from "../fondasi/layout/safeArea";
import { atWord } from "../fondasi/motion/timing";
import { useTimeline } from "../fondasi/timeline/TimelineProvider";
import { EXTRA_COLORS as X, tint } from "../library/style";
import { Backdrop, clamp, kick, TYPE, useSpringAt, useSticker, useContentBox, useFillerKick, useLogoBox, useTopClear } from "./parts";
import { diagramLayout } from "./diagramLayout";

type Node = { id: string; label: string; at: string };

const DRAW_FRAMES = 14; // an edge draws in over the frames before its target pops
const PULSE_PERIOD = 54; // frames for a data dot to travel one edge
const ARROW = 26;
const DOT_COLORS = ["lawnGreen", "kuning", "hijauTerang", "glow"] as const;

type Pt = { x: number; y: number };
const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
};

const edgeCurve = (a: Rect, b: Rect): [Pt, Pt, Pt, Pt] => {
  const down = b.y > a.y + a.h / 2;
  if (down) {
    // leave / enter on the inner side so zigzag arrows run short and near-vertical
    const side = Math.sign(b.x + b.w / 2 - (a.x + a.w / 2));
    const p0 = { x: a.x + a.w * (0.5 + side * 0.24), y: a.y + a.h + 10 };
    const p3 = { x: b.x + b.w * (0.5 - side * 0.24), y: b.y - 14 - ARROW };
    const dy = (p3.y - p0.y) * 0.6;
    return [p0, { x: p0.x, y: p0.y + dy }, { x: p3.x, y: p3.y - dy }, p3];
  }
  // same row (or upward): connect side to side
  const ltr = b.x > a.x;
  const p0 = { x: ltr ? a.x + a.w + 10 : a.x - 10, y: a.y + a.h / 2 };
  const p3 = { x: ltr ? b.x - 14 - ARROW : b.x + b.w + 14 + ARROW, y: b.y + b.h / 2 };
  const dx = (p3.x - p0.x) * 0.5;
  return [p0, { x: p0.x + dx, y: p0.y }, { x: p3.x - dx, y: p3.y }, p3];
};

const DiagramNode: React.FC<{ index: number; label: string; rect: Rect; at: number; active: boolean; extra: number }> = ({
  index,
  label,
  rect,
  at,
  active,
  extra,
}) => {
  const frame = useCurrentFrame();
  const { palette: C } = useBrand();
  const sticker = useSticker();
  const p = useSpringAt(at, "bouncy");
  if (p === 0) return null;
  const dot = C[DOT_COLORS[index % DOT_COLORS.length]];
  return (
    <div
      style={{
        ...sticker(active ? tint(C.glow, 0.35) : X.white, 32),
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: "0 26px",
        opacity: Math.min(1, p * 2),
        transform: `scale(${(0.4 + 0.6 * p) * (1 + (kick(frame, at, 20) + (active ? extra : 0)) * 0.06)}) rotate(${index % 2 === 0 ? -1.5 : 1.5}deg)`,
      }}
    >
      <div
        style={{
          ...sticker(dot, 999),
          boxShadow: "none",
          width: 76,
          height: 76,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...TYPE.label,
          color: C.thunder,
        }}
      >
        {index + 1}
      </div>
      <div style={{ ...TYPE.label, color: C.thunder, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
    </div>
  );
};

/**
 * Diagram: a node-and-arrow flow (e.g. how an AI agent works). Nodes are laid
 * out top-to-bottom by `diagramLayout` (lone nodes zigzag), pop at their `at`
 * word (use the Kata Kunci), and the edge into a node draws in during the
 * 14 frames before it pops. The newest node is Glow-tinted; once an edge is
 * drawn a Kuning data dot keeps travelling along it. Filler beats bump the
 * newest node if the line would sit still for > 1.5 s. If a node would sit
 * under the logo box, the whole layout starts below it (y 400).
 * Labels are label type (44 px / 600), ≤ 12 chars; 3–5 nodes read best.
 */
export const Diagram: React.FC<{ lineId: string; nodes: Node[]; edges: [string, string][] }> = ({ lineId, nodes, edges }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { palette: C } = useBrand();
  const timeline = useTimeline();
  const box = useContentBox();
  const topClear = useTopClear();
  const logoX = useLogoBox().x - 10;
  const inner: Rect = { x: box.x + 10, y: box.y + 20, w: box.w - 20, h: box.h - 40 };
  const first = diagramLayout(nodes, edges, inner);
  // a node reaching under the logo box: start the whole layout below the logo instead
  const hitsLogo = Object.values(first).some((r) => r.x + r.w > logoX && r.y < topClear);
  const layout = hitsLogo ? diagramLayout(nodes, edges, { ...inner, y: topClear, h: inner.y + inner.h - topClear }) : first;
  const at: Record<string, number> = Object.fromEntries(nodes.map((n) => [n.id, atWord(timeline, lineId, n.at, fps)]));
  const shown = nodes.filter((n) => frame >= at[n.id]);
  const extra = useFillerKick(lineId, nodes.map((n) => at[n.id]));
  const activeId = shown.length ? shown.reduce((a, b) => (at[b.id] >= at[a.id] ? b : a)).id : null;

  return (
    <AbsoluteFill style={{ fontFamily: poppins, overflow: "hidden" }}>
      <Backdrop />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {edges.map(([a, b], i) => {
          if (!layout[a] || !layout[b]) return null;
          const end = Math.max(at[b], at[a] + DRAW_FRAMES);
          const p = interpolate(frame, [end - DRAW_FRAMES, end], [0, 1], clamp);
          if (p === 0) return null;
          const [p0, p1, p2, p3] = edgeCurve(layout[a], layout[b]);
          const d = `M${p0.x} ${p0.y} C${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y}`;
          // arrowhead: the curve ends ARROW px short of the node; the triangle fills that gap
          const pre = bez(p0, p1, p2, p3, 0.96);
          const len = Math.hypot(p3.x - pre.x, p3.y - pre.y) || 1;
          const dir = { x: (p3.x - pre.x) / len, y: (p3.y - pre.y) / len };
          const half = ARROW * 0.8;
          const head = [
            [p3.x + dir.x * ARROW, p3.y + dir.y * ARROW],
            [p3.x - dir.y * half, p3.y + dir.x * half],
            [p3.x + dir.y * half, p3.y - dir.x * half],
          ].map(([x, y]) => `${x},${y}`);
          const pulseT = ((frame - end) % PULSE_PERIOD) / PULSE_PERIOD;
          const dot = frame > end ? bez(p0, p1, p2, p3, pulseT) : null;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={C.thunder} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
              {p > 0.95 && <polygon points={head.join(" ")} fill={C.thunder} stroke={C.thunder} strokeWidth={6} strokeLinejoin="round" />}
              {dot && <circle cx={dot.x} cy={dot.y} r={15} fill={C.kuning} stroke={C.thunder} strokeWidth={6} />}
            </g>
          );
        })}
      </svg>
      {nodes.map((n, i) => (
        <DiagramNode key={n.id} index={i} label={n.label} rect={layout[n.id]} at={at[n.id]} active={n.id === activeId} extra={extra} />
      ))}
    </AbsoluteFill>
  );
};
