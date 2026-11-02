import React, { createContext, useContext, useId } from "react";
import { random, useCurrentFrame } from "remotion";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import type { JoksExpression } from "../../fondasi/expression";
import { EXTRA_COLORS as X, STYLE } from "../style";
import { POSES, type Pose } from "./poses";

/**
 * Joks rig: vector recreation of the jokoding mascot (ADR 0004). Native
 * coordinate space is the official PNG canvas, 886 x 1060. Head, visor, eyes,
 * mouth, hands and body are separate parts so they animate independently.
 */

type Palette = ReturnType<typeof useBrand>["palette"];
type Ctx = { C: Palette; k: { glow: string; red: string }; frame: number; seed: number };
const JoksCtx = createContext<Ctx | null>(null);
const useJ = (): Ctx => {
  const v = useContext(JoksCtx);
  if (!v) throw new Error("Joks parts must render inside <Joks>");
  return v;
};

const SW = STYLE.outlineJoks;

const HEAD_PATH =
  "M60 700 L48 330 C44 250 100 205 180 205 C238 205 285 235 310 282 C330 140 440 48 575 48 C742 48 842 150 838 330 L822 688 C821 700 812 706 800 706 L72 712 C64 712 60 708 60 700 Z";

const BODY_PATH =
  "M288 1015 L288 832 C288 772 330 750 382 750 L500 750 C560 750 592 782 592 842 L592 1015 L500 1015 L500 935 C500 905 485 893 460 893 L420 893 C392 893 378 906 378 936 L378 1015 Z";

// ── face ───────────────────────────────────────────────────────────────────
const EYE_L = { x: 288, y: 492 };
const EYE_R = { x: 568, y: 492 };

type EyeKind = "oval" | "happy" | "surprised" | "sad" | "angry" | "flat";

const Eye: React.FC<{ cx: number; cy: number; kind: EyeKind; blink: number; side: 1 | -1 }> = ({ cx, cy, kind, blink, side }) => {
  const { C, k } = useJ();
  const sy = 1 - blink * 0.92;
  const glow = { filter: `url(#${k.glow})` };
  switch (kind) {
    case "happy":
      return <path d={`M${cx - 30} ${cy + 18} Q${cx} ${cy - 34} ${cx + 30} ${cy + 18}`} fill="none" stroke={C.glow} strokeWidth={16} strokeLinecap="round" style={glow} />;
    case "flat":
      return (
        <g style={glow}>
          <path d={`M${cx - 34} ${cy} A34 30 0 0 0 ${cx + 34} ${cy} Z`} fill={C.glow} />
          <line x1={cx - 42} y1={cy - 14} x2={cx + 42} y2={cy - 4} stroke={C.glow} strokeWidth={10} strokeLinecap="round" />
        </g>
      );
    case "angry":
      return (
        <g style={{ filter: `url(#${k.red})` }}>
          <path d={`M${cx - 30} ${cy - 6 - side * 10} L${cx + 30} ${cy - 6 + side * 10} L${cx + 26} ${cy + 22} A30 26 0 0 1 ${cx - 26} ${cy + 22} Z`} fill={C.merah} />
          <line x1={cx - 40} y1={cy - 22 - side * 12} x2={cx + 40} y2={cy - 22 + side * 12} stroke={C.merah} strokeWidth={10} strokeLinecap="round" />
        </g>
      );
    case "sad":
      return (
        <g style={glow}>
          <ellipse cx={cx} cy={cy + 10} rx={30} ry={40 * sy} fill={C.glow} />
          <line x1={cx - 42} y1={cy - 46 + side * 10} x2={cx + 42} y2={cy - 46 - side * 10} stroke={C.glow} strokeWidth={10} strokeLinecap="round" />
        </g>
      );
    case "surprised":
      return (
        <g style={glow}>
          <ellipse cx={cx} cy={cy + 6} rx={32} ry={44 * sy} fill={C.glow} />
          <circle cx={cx - 10} cy={cy - 12} r={7} fill={X.white} opacity={sy} />
          <path d={`M${cx - 30} ${cy - 58} Q${cx} ${cy - 78} ${cx + 30} ${cy - 58}`} fill="none" stroke={C.glow} strokeWidth={9} strokeLinecap="round" />
        </g>
      );
    default:
      return <ellipse cx={cx} cy={cy} rx={34} ry={50 * sy} fill={C.glow} style={glow} />;
  }
};

type MouthKind = "smile" | "open" | "o" | "frown" | "wavy" | "angry";

const Mouth: React.FC<{ kind: MouthKind; talk: number }> = ({ kind, talk }) => {
  const { C, k } = useJ();
  const g = { filter: `url(#${k.glow})` };
  // talking overrides into an open shape whose height follows `talk`
  if (talk > 0.05) {
    const h = 6 + talk * 26;
    return <path d={`M400 536 Q429 ${536 + h * 2} 458 536 Z`} fill={C.glow} style={g} />;
  }
  switch (kind) {
    case "open":
      return <path d="M404 532 L454 532 Q452 566 429 566 Q406 566 404 532 Z" fill={C.glow} style={g} />;
    case "o":
      return <ellipse cx={429} cy={548} rx={9} ry={12} fill="none" stroke={C.glow} strokeWidth={7} style={g} />;
    case "frown":
      return <path d="M404 560 Q429 536 454 560" fill="none" stroke={C.glow} strokeWidth={9} strokeLinecap="round" style={g} />;
    case "wavy":
      return <path d="M396 548 Q408 532 420 548 T444 548 T462 544" fill="none" stroke={C.glow} strokeWidth={8} strokeLinecap="round" style={g} />;
    case "angry":
      return <path d="M404 538 L454 538 L446 562 L412 562 Z" fill={C.merah} style={{ filter: `url(#${k.red})` }} />;
    default:
      return <path d="M401 541 Q429 566 457 541" fill="none" stroke={C.glow} strokeWidth={9} strokeLinecap="round" style={g} />;
  }
};

const FACE: Record<JoksExpression, { l: EyeKind; r: EyeKind; mouth: MouthKind; cheeks?: boolean }> = {
  netral: { l: "oval", r: "oval", mouth: "smile" },
  halo: { l: "oval", r: "oval", mouth: "open" },
  senang: { l: "happy", r: "happy", mouth: "open", cheeks: true },
  kaget: { l: "surprised", r: "surprised", mouth: "o" },
  sedih: { l: "sad", r: "sad", mouth: "frown" },
  marah: { l: "angry", r: "angry", mouth: "angry" },
  bingung: { l: "oval", r: "flat", mouth: "wavy" },
  jempol: { l: "oval", r: "happy", mouth: "open" },
  nunjuk: { l: "oval", r: "oval", mouth: "smile" },
};

// ── hands ──────────────────────────────────────────────────────────────────
const HandShape: React.FC<{ h: Pose["leftHand"] & { thumb?: boolean; point?: boolean } }> = ({ h }) => {
  const { C } = useJ();
  return (
    <g transform={`translate(${h.x} ${h.y}) rotate(${h.r})`}>
      {h.thumb && <rect x={-14} y={-92} width={28} height={50} rx={14} fill={C.lawnGreen} stroke={C.thunder} strokeWidth={SW - 2} />}
      {h.point && <rect x={-12} y={-96} width={24} height={52} rx={12} fill={C.lawnGreen} stroke={C.thunder} strokeWidth={SW - 2} />}
      <ellipse cx={0} cy={0} rx={42} ry={58} fill={C.lawnGreen} stroke={C.thunder} strokeWidth={SW - 2} />
      <path d="M-20 -28 Q-14 -44 2 -46" fill="none" stroke={C.hijauTerang} strokeWidth={8} strokeLinecap="round" />
    </g>
  );
};

// ── decorations ────────────────────────────────────────────────────────────
const Sparkle: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => {
  const { C } = useJ();
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -30 Q4 -4 30 0 Q4 4 0 30 Q-4 4 -30 0 Q-4 -4 0 -30 Z" fill={C.kuning} />;
};

const Extras: React.FC<{ e: JoksExpression }> = ({ e }) => {
  const { C, frame: t, seed } = useJ();
  // seed only shifts the twinkle phase, so geometry never moves
  const twinkle = (n: number) => 0.75 + 0.25 * Math.sin(t / 8 + n + random(`joks-sparkle-${seed}-${n}`) * 6.28);
  switch (e) {
    case "senang":
    case "jempol":
      return (
        <>
          <Sparkle x={590} y={-10} s={1.1 * twinkle(0)} />
          <Sparkle x={780} y={40} s={0.5 * twinkle(2)} />
          <Sparkle x={70} y={110} s={0.35 * twinkle(4)} />
        </>
      );
    case "kaget":
      return (
        <g transform="translate(700 -40) rotate(8)">
          <rect x={-18} y={-70} width={36} height={78} rx={10} fill={C.kuning} stroke={C.thunder} strokeWidth={8} />
          <circle cx={0} cy={36} r={17} fill={C.kuning} stroke={C.thunder} strokeWidth={8} />
        </g>
      );
    case "bingung":
      return (
        <g fontFamily="Poppins, sans-serif" fontWeight={800} fill={C.kuning} stroke={C.thunder} strokeWidth={7} paintOrder="stroke">
          <text x={700} y={20} fontSize={110} transform="rotate(12 700 20)">?</text>
          <text x={640} y={-30} fontSize={70} transform="rotate(-8 640 -30)">?</text>
        </g>
      );
    case "sedih":
      return (
        <g fill={X.tear}>
          {[EYE_L, EYE_R].map((p, i) => {
            const fall = ((t + i * 20) % 50) / 50;
            return <path key={i} transform={`translate(${p.x} ${p.y + 60 + fall * 60})`} opacity={1 - fall} d="M0 -14 Q10 2 0 10 Q-10 2 0 -14 Z" />;
          })}
        </g>
      );
    case "marah":
      return (
        <g fill={X.white} stroke={X.steamStroke} strokeWidth={6}>
          {[
            [140, 10, 34],
            [170, 70, 18],
            [700, -20, 40],
            [670, 50, 22],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y - ((t + i * 9) % 40) * 0.6} r={r} />
          ))}
        </g>
      );
    default:
      return null;
  }
};

export type JoksProps = {
  expression?: JoksExpression;
  /** override pose (e.g. interpolated between two expressions) */
  pose?: Pose;
  /** 0..1 mouth opening while speaking; overrides mouth shape */
  talk?: number;
  /** 0..1 eyelid close */
  blink?: number;
  width?: number;
  showExtras?: boolean;
  /** drives the randomness of decorations (Remotion random, deterministic) */
  seed?: number;
  style?: React.CSSProperties;
};

export const Joks: React.FC<JoksProps> = ({ expression = "netral", pose, talk = 0, blink = 0, width = 520, showExtras = true, seed = 0, style }) => {
  const { palette: C } = useBrand();
  const frame = useCurrentFrame();
  const uid = useId().replace(/:/g, "");
  const k = { glow: `joksGlow${uid}`, red: `joksGlowRed${uid}` };
  const p = pose ?? POSES[expression];
  const f = FACE[expression];
  return (
    <JoksCtx.Provider value={{ C, k, frame, seed }}>
      <svg viewBox="-60 -120 1006 1180" width={width} height={(width * 1180) / 1006} style={{ overflow: "visible", ...style }}>
        <defs>
          <filter id={k.glow} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={k.red} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* body */}
        <path d={BODY_PATH} fill={C.hijauTua} stroke={C.thunder} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M328 842 C328 808 346 790 382 786" fill="none" stroke={C.lawnGreen} strokeWidth={14} strokeLinecap="round" />

        {/* head group tilts as one */}
        <g transform={`rotate(${p.tilt} 443 420)`}>
          <path d={HEAD_PATH} fill={C.lawnGreen} stroke={C.thunder} strokeWidth={SW} strokeLinejoin="round" />
          <path d="M95 365 C92 282 140 228 228 228" fill="none" stroke={C.hijauTerang} strokeWidth={18} strokeLinecap="round" />
          <path d="M458 122 C522 84 602 82 660 98" fill="none" stroke={C.hijauTerang} strokeWidth={18} strokeLinecap="round" />
          <rect x={140} y={362} width={578} height={270} rx={48} fill={C.layar} stroke={C.thunder} strokeWidth={12} />
          <line x1={184} y1={398} x2={298} y2={398} stroke={X.visorLine} strokeWidth={12} strokeLinecap="round" />
          <Eye cx={EYE_L.x} cy={EYE_L.y} kind={f.l} blink={blink} side={1} />
          <Eye cx={EYE_R.x} cy={EYE_R.y} kind={f.r} blink={blink} side={-1} />
          {f.cheeks && (
            <>
              <ellipse cx={EYE_L.x} cy={EYE_L.y + 62} rx={34} ry={13} fill={X.cheek} opacity={0.85} />
              <ellipse cx={EYE_R.x} cy={EYE_R.y + 62} rx={34} ry={13} fill={X.cheek} opacity={0.85} />
            </>
          )}
          <Mouth kind={f.mouth} talk={talk} />
          {showExtras && <Extras e={expression} />}
        </g>

        <HandShape h={p.leftHand} />
        <HandShape h={p.rightHand} />
      </svg>
    </JoksCtx.Provider>
  );
};
