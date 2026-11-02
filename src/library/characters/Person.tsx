import React from "react";
import { random, useCurrentFrame } from "remotion";
import { useBrand } from "../../fondasi/brand/BrandProvider";
import type { PersonMood } from "../../fondasi/expression";
import { EXTRA_COLORS as X, STYLE } from "../style";
import {
  hijabColor,
  PERSON_BOX,
  PERSON_NEUTRALS as N,
  personSize,
  SKIN,
  SKIN_SHADE,
  tint,
  type PersonLook,
  type PersonPose,
} from "./variants";

/**
 * Parametric chibi Person in the Joks sticker style: Thunder outline, flat
 * fills, one gloss stroke per volume. Ported from the spike Person and
 * extended with hair/skin/outfit/accessory variants, six moods and four poses.
 * Native space: head centre (210, 180); see PERSON_BOX for each pose's viewBox.
 */

type Palette = ReturnType<typeof useBrand>["palette"];

const OL = STYLE.outlineProp;
const HEAD = { cx: 210, cy: 180, rx: 118, ry: 112 };
const EYE_L = { x: 168, y: 194 };
const EYE_R = { x: 252, y: 194 };
const NECK_PIVOT = { x: 210, y: 300 };

// ── small shapes ───────────────────────────────────────────────────────────
/** Outlined capsule limb along a polyline: Thunder under-stroke, colored stroke on top. */
const Limb: React.FC<{ pts: [number, number][]; w: number; fill: string; C: Palette }> = ({ pts, w, fill, C }) => {
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  return (
    <>
      <path d={d} fill="none" stroke={C.thunder} strokeWidth={w + OL * 2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={fill} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
};

const Hand: React.FC<{ x: number; y: number; r?: number; skin: string; C: Palette; point?: boolean }> = ({ x, y, r = 25, skin, C, point }) => (
  <g>
    {point && <rect x={x + r - 10} y={y - 10} width={52} height={20} rx={10} fill={skin} stroke={C.thunder} strokeWidth={OL - 3} />}
    <circle cx={x} cy={y} r={r} fill={skin} stroke={C.thunder} strokeWidth={OL - 2} />
  </g>
);

const Sparkle: React.FC<{ x: number; y: number; s: number; fill: string }> = ({ x, y, s, fill }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -30 Q4 -4 30 0 Q4 4 0 30 Q-4 4 -30 0 Q-4 -4 0 -30 Z" fill={fill} />
);

// ── body ───────────────────────────────────────────────────────────────────
// ends at y 455 so the outline stays inside the 460 crop
const SEATED_TORSO = "M72 455 C72 360 120 300 210 300 C300 300 348 360 348 455 Z";
const STANDING_TORSO = "M122 404 C122 338 154 306 210 306 C266 306 298 338 298 404 L302 566 C302 578 294 584 282 584 L138 584 C126 584 118 578 118 566 Z";

type Pt = [number, number];
/** Sleeve polyline per arm plus the hand centre; the right arm is the viewer's right. */
type ArmSet = { l: Pt[]; r: Pt[]; lHand: Pt; rHand: Pt; point?: boolean };
const LEFT_DOWN = { l: [[134, 352], [104, 516]] as Pt[], lHand: [104, 526] as Pt };
const ARMS: Record<Exclude<PersonPose, "duduk">, ArmSet> = {
  berdiri: { ...LEFT_DOWN, r: [[286, 352], [316, 516]], rHand: [316, 526] },
  nunjuk: { ...LEFT_DOWN, r: [[286, 352], [400, 344], [470, 338]], rHand: [480, 338], point: true },
  "angkat-tangan": { ...LEFT_DOWN, r: [[286, 352], [380, 268], [392, 156]], rHand: [392, 142] },
};

const Legs: React.FC<{ C: Palette }> = ({ C }) => (
  <g>
    <Limb pts={[[172, 560], [166, 700]]} w={56} fill={N.pants} C={C} />
    <Limb pts={[[248, 560], [254, 700]]} w={56} fill={N.pants} C={C} />
    <path d="M150 600 L148 660" stroke={N.pantsGloss} strokeWidth={10} strokeLinecap="round" />
    <path d="M114 724 C114 698 138 690 166 692 C190 694 198 708 196 726 C196 736 188 740 176 740 L124 740 C116 740 114 734 114 724 Z" fill={C.thunder} stroke={C.thunder} strokeWidth={OL - 2} strokeLinejoin="round" />
    <path d="M306 724 C306 698 282 690 254 692 C230 694 222 708 224 726 C224 736 232 740 244 740 L296 740 C304 740 306 734 306 724 Z" fill={C.thunder} stroke={C.thunder} strokeWidth={OL - 2} strokeLinejoin="round" />
    <path d="M134 708 Q146 700 160 700" fill="none" stroke={N.hairGloss} strokeWidth={6} strokeLinecap="round" />
    <path d="M286 708 Q274 700 260 700" fill="none" stroke={N.hairGloss} strokeWidth={6} strokeLinecap="round" />
  </g>
);

// ── hair / hijab ───────────────────────────────────────────────────────────
const HAIR_BACK_LONG =
  "M96 150 C96 80 150 46 210 46 C270 46 324 80 324 150 C338 230 342 300 332 352 C304 368 272 366 252 356 L168 356 C148 366 116 368 88 352 C78 300 82 230 96 150 Z";
const HAIR_SHORT =
  "M94 170 C88 90 150 52 214 54 C290 56 336 100 330 168 C300 140 262 128 236 104 C222 134 160 150 94 170 Z";
const BANGS_LONG =
  "M92 186 C84 92 150 52 212 52 C282 52 340 96 330 186 C318 156 302 134 286 120 C262 148 214 156 168 138 C140 146 110 164 92 186 Z";
const LOCK_L = "M92 176 C82 240 84 320 104 392 C118 400 134 398 142 388 C126 330 122 260 128 196 Z";
const LOCK_R = "M328 176 C338 240 336 320 316 392 C302 400 286 398 278 388 C294 330 298 260 292 196 Z";
const HIJAB =
  "M210 48 C300 48 346 110 344 192 C342 240 332 268 336 294 C362 308 376 336 364 360 C332 382 270 378 210 392 C150 378 88 382 56 360 C44 336 58 308 84 294 C88 268 78 240 76 192 C74 110 120 48 210 48 Z";
const HIJAB_FACE = { cx: 210, cy: 196, rx: 96, ry: 98 };

// ── face ───────────────────────────────────────────────────────────────────
const Eyes: React.FC<{ mood: PersonMood; blink: number; C: Palette }> = ({ mood, blink, C }) => {
  const sy = 1 - blink * 0.9;
  const ink = C.thunder;
  const oval = (p: { x: number; y: number }, rx: number, ry: number, hl = 5) => (
    <g key={p.x}>
      <ellipse cx={p.x} cy={p.y} rx={rx} ry={ry * sy} fill={ink} />
      <circle cx={p.x - rx * 0.35} cy={p.y - ry * 0.4 * sy} r={hl} fill={X.white} opacity={1 - blink} />
    </g>
  );
  switch (mood) {
    case "senang":
      return (
        <g fill="none" stroke={ink} strokeWidth={9} strokeLinecap="round">
          <path d={`M${EYE_L.x - 18} ${EYE_L.y + 4} Q${EYE_L.x} ${EYE_L.y - 22} ${EYE_L.x + 18} ${EYE_L.y + 4}`} />
          <path d={`M${EYE_R.x - 18} ${EYE_R.y + 4} Q${EYE_R.x} ${EYE_R.y - 22} ${EYE_R.x + 18} ${EYE_R.y + 4}`} />
        </g>
      );
    case "panik":
      return (
        <>
          {[EYE_L, EYE_R].map((p) => (
            <g key={p.x}>
              <ellipse cx={p.x} cy={p.y} rx={19} ry={26 * sy} fill={X.white} stroke={ink} strokeWidth={6} />
              <circle cx={p.x} cy={p.y + 2} r={8 * sy} fill={ink} />
            </g>
          ))}
        </>
      );
    case "kagum":
      return (
        <>
          {[EYE_L, EYE_R].map((p) => (
            <g key={p.x}>
              <ellipse cx={p.x} cy={p.y} rx={19} ry={20 * sy} fill={ink} />
              <circle cx={p.x - 6} cy={p.y - 7 * sy} r={7} fill={X.white} opacity={1 - blink} />
              <circle cx={p.x + 7} cy={p.y + 7 * sy} r={3.5} fill={X.white} opacity={1 - blink} />
            </g>
          ))}
        </>
      );
    case "sedih":
      return (
        <>
          {[
            { p: EYE_L, side: 1 },
            { p: EYE_R, side: -1 },
          ].map(({ p, side }) => (
            <g key={p.x}>
              <ellipse cx={p.x} cy={p.y + 4} rx={14} ry={16 * sy} fill={ink} />
              <circle cx={p.x - 4} cy={p.y + 2} r={4} fill={X.white} opacity={1 - blink} />
              {/* droopy upper lid: outer corner lower */}
              <path d={`M${p.x - side * 22} ${p.y + 2} L${p.x + side * 20} ${p.y - 12}`} stroke={ink} strokeWidth={7} strokeLinecap="round" />
            </g>
          ))}
        </>
      );
    case "bingung":
      return (
        <>
          {oval(EYE_L, 14, 21)}
          {oval({ x: EYE_R.x, y: EYE_R.y + 2 }, 10, 13, 3.5)}
        </>
      );
    default:
      return (
        <>
          {oval(EYE_L, 14, 20)}
          {oval(EYE_R, 14, 20)}
        </>
      );
  }
};

const BROWS: Partial<Record<PersonMood, [string, string]>> = {
  panik: ["M144 162 L188 150", "M276 162 L232 150"],
  sedih: ["M146 164 L188 156", "M274 164 L232 156"],
  kagum: ["M146 160 Q166 144 188 152", "M274 160 Q254 144 232 152"],
  bingung: ["M146 156 Q166 146 188 152", "M234 170 L276 160"],
};

const Mouth: React.FC<{ mood: PersonMood; talk: number; C: Palette }> = ({ mood, talk, C }) => {
  const ink = C.thunder;
  if (talk > 0.05) {
    const h = 8 + talk * 26;
    return <path d={`M190 240 L230 240 Q228 ${240 + h} 210 ${240 + h} Q192 ${240 + h} 190 240 Z`} fill={N.mouth} stroke={ink} strokeWidth={6} strokeLinejoin="round" />;
  }
  switch (mood) {
    case "senang":
      return (
        <g>
          <path d="M182 236 L238 236 Q236 268 210 268 Q184 268 182 236 Z" fill={N.mouth} stroke={ink} strokeWidth={7} strokeLinejoin="round" />
          <path d="M196 260 Q210 250 224 260 Q218 266 210 266 Q202 266 196 260 Z" fill={N.tongue} />
        </g>
      );
    case "panik":
      return <path d="M184 252 Q197 240 210 252 T236 252" fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" />;
    case "sedih":
      return <path d="M192 256 Q210 240 228 256" fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" />;
    case "kagum":
      return <ellipse cx={210} cy={250} rx={11} ry={14} fill={N.mouth} stroke={ink} strokeWidth={6} />;
    case "bingung":
      return <path d="M196 250 Q206 242 216 250 T236 246" fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" />;
    default:
      return <path d="M192 244 Q210 256 228 244" fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" />;
  }
};

const MoodExtras: React.FC<{ mood: PersonMood; frame: number; phase: number; C: Palette; font: string }> = ({ mood, frame: t, phase, C, font }) => {
  switch (mood) {
    case "panik":
      return (
        <>
          {[0, 1].map((i) => {
            const k = ((t + i * 18 + phase * 6) % 36) / 36;
            return (
              <path
                key={i}
                transform={`translate(${i ? 346 : 72} ${116 + k * 50})`}
                opacity={1 - k}
                d="M0 -18 Q14 4 0 14 Q-14 4 0 -18 Z"
                fill={X.tear}
                stroke={C.thunder}
                strokeWidth={5}
              />
            );
          })}
        </>
      );
    case "sedih": {
      const k = ((t + phase * 10) % 60) / 60;
      return <path transform={`translate(${EYE_L.x - 6} ${EYE_L.y + 26 + k * 40})`} opacity={1 - k} d="M0 -12 Q9 2 0 9 Q-9 2 0 -12 Z" fill={X.tear} stroke={C.thunder} strokeWidth={4} />;
    }
    case "kagum": {
      const tw = (n: number) => 0.8 + 0.2 * Math.sin(t / 8 + n + phase);
      return (
        <>
          <Sparkle x={356} y={74} s={0.9 * tw(0)} fill={C.kuning} />
          <Sparkle x={70} y={104} s={0.45 * tw(2)} fill={C.kuning} />
        </>
      );
    }
    case "bingung":
      return (
        <text
          x={350}
          y={92}
          fontSize={104}
          fontFamily={`${font}, sans-serif`}
          fontWeight={800}
          fill={C.kuning}
          stroke={C.thunder}
          strokeWidth={7}
          paintOrder="stroke"
          transform="rotate(12 350 92)"
        >
          ?
        </text>
      );
    default:
      return null;
  }
};

// ── accessories ────────────────────────────────────────────────────────────
const Glasses: React.FC<{ C: Palette; temples: boolean }> = ({ C, temples }) => (
  <g fill="none" stroke={C.thunder} strokeWidth={7} strokeLinecap="round">
    {temples && (
      <>
        <path d="M140 190 L98 184" />
        <path d="M280 190 L322 184" />
      </>
    )}
    <path d="M196 192 Q210 184 224 192" />
    {[EYE_L, EYE_R].map((p) => (
      <g key={p.x}>
        <circle cx={p.x} cy={p.y} r={29} fill={X.white} fillOpacity={0.22} />
        <path d={`M${p.x - 16} ${p.y - 14} Q${p.x - 10} ${p.y - 20} ${p.x - 2} ${p.y - 21}`} stroke={X.white} strokeWidth={5} />
      </g>
    ))}
  </g>
);

const Headset: React.FC<{ C: Palette }> = ({ C }) => (
  <g>
    <path d="M86 196 C78 12 342 12 334 196" fill="none" stroke={C.thunder} strokeWidth={24} strokeLinecap="round" />
    <path d="M86 196 C78 12 342 12 334 196" fill="none" stroke={N.headset} strokeWidth={8} strokeLinecap="round" />
    <path d="M84 222 Q96 266 158 266" fill="none" stroke={C.thunder} strokeWidth={8} strokeLinecap="round" />
    <circle cx={164} cy={266} r={10} fill={C.thunder} />
    {[66, 314].map((x) => (
      <g key={x}>
        <rect x={x} y={158} width={40} height={68} rx={16} fill={N.headset} stroke={C.thunder} strokeWidth={OL - 2} />
        <path d={`M${x + 12} ${172} L${x + 12} ${190}`} stroke={tint(N.headset, 0.4)} strokeWidth={6} strokeLinecap="round" />
      </g>
    ))}
  </g>
);

// ── Person ─────────────────────────────────────────────────────────────────
export type PersonProps = {
  look: PersonLook;
  mood: PersonMood;
  pose: PersonPose;
  /** 0..1 mouth opening while speaking; overrides the mood mouth */
  talk?: number;
  /** 0..1 eyelid close */
  blink?: number;
  /** rendered width of the 420-unit head-and-shoulders core; see personSize() */
  width?: number;
  /** shifts the idle bob / extras phase so a crowd does not move in sync */
  seed?: number;
  style?: React.CSSProperties;
};

export const Person: React.FC<PersonProps> = ({ look, mood, pose, talk = 0, blink = 0, width = 440, seed = 0, style }) => {
  const { palette: C, font } = useBrand();
  const frame = useCurrentFrame();
  const phase = random(`person-${seed}`) * Math.PI * 2;
  const outfit = (C as Record<string, string>)[look.outfit] ?? look.outfit;
  const skin = SKIN[look.skin];
  const skinShade = SKIN_SHADE[look.skin];
  const box = PERSON_BOX[pose];
  const size = personSize(pose, width);
  const seated = pose === "duduk";
  const hijab = look.hair === "hijab";
  const hijabFill = hijabColor(outfit, [N.beige, N.charcoal, C.hijauTua]);

  const shake = mood === "panik" ? Math.sin(frame * 1.7) * 3 : 0;
  const bob = Math.sin(frame / 14 + phase) * 4;
  const tilt = mood === "bingung" ? -6 : mood === "sedih" ? 3 : 0;
  const headT = `translate(${shake} ${bob}) rotate(${tilt} ${NECK_PIVOT.x} ${NECK_PIVOT.y})`;
  const arms = seated ? null : ARMS[pose];

  return (
    <svg viewBox={`0 0 ${box.w} ${box.h}`} width={size.w} height={size.h} style={{ overflow: "visible", ...style }}>
      {/* hair behind the body */}
      {look.hair === "panjang" && (
        <g transform={headT}>
          <path d={HAIR_BACK_LONG} fill={N.hair} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
        </g>
      )}

      {!seated && <Legs C={C} />}

      {/* torso */}
      {seated ? (
        <>
          <path d={SEATED_TORSO} fill={outfit} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
          <path d="M120 372 C106 400 100 430 100 452" fill="none" stroke={C.thunder} strokeWidth={6} strokeLinecap="round" />
          <path d="M300 372 C314 400 320 430 320 452" fill="none" stroke={C.thunder} strokeWidth={6} strokeLinecap="round" />
          <path d="M132 404 C134 372 146 350 166 338" fill="none" stroke={tint(outfit, 0.35)} strokeWidth={12} strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d={STANDING_TORSO} fill={outfit} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
          <path d="M150 440 C150 400 156 370 170 352" fill="none" stroke={tint(outfit, 0.35)} strokeWidth={12} strokeLinecap="round" />
        </>
      )}
      {!hijab && <path d={seated ? "M150 312 Q210 360 270 312" : "M164 318 Q210 352 256 318"} fill="none" stroke={C.thunder} strokeWidth={OL} strokeLinecap="round" />}

      {/* arms (standing poses) */}
      {arms && (
        <>
          <Limb pts={arms.l} w={44} fill={outfit} C={C} />
          <Limb pts={arms.r} w={44} fill={outfit} C={C} />
          <Hand x={arms.lHand[0]} y={arms.lHand[1]} skin={skin} C={C} />
          <Hand x={arms.rHand[0]} y={arms.rHand[1]} skin={skin} C={C} point={arms.point} />
        </>
      )}

      {/* neck */}
      <rect x={185} y={262} width={50} height={52} rx={10} fill={skinShade} stroke={C.thunder} strokeWidth={OL} />

      <g transform={headT}>
        {hijab ? (
          <>
            <path d={HIJAB} fill={hijabFill} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
            <path d="M110 160 C112 118 138 88 176 74" fill="none" stroke={tint(hijabFill, 0.35)} strokeWidth={12} strokeLinecap="round" />
            <ellipse {...HIJAB_FACE} fill={skin} stroke={C.thunder} strokeWidth={OL} />
          </>
        ) : (
          <>
            {look.hair === "pendek" && (
              <>
                <ellipse cx={92} cy={192} rx={20} ry={26} fill={skin} stroke={C.thunder} strokeWidth={OL} />
                <ellipse cx={328} cy={192} rx={20} ry={26} fill={skin} stroke={C.thunder} strokeWidth={OL} />
              </>
            )}
            <ellipse {...HEAD} fill={skin} stroke={C.thunder} strokeWidth={OL} />
            {look.hair === "pendek" ? (
              <path d={HAIR_SHORT} fill={N.hair} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
            ) : (
              <>
                <path d={LOCK_L} fill={N.hair} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
                <path d={LOCK_R} fill={N.hair} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
                <path d={BANGS_LONG} fill={N.hair} stroke={C.thunder} strokeWidth={OL} strokeLinejoin="round" />
              </>
            )}
            <path d="M150 84 Q190 66 232 70" fill="none" stroke={N.hairGloss} strokeWidth={10} strokeLinecap="round" />
          </>
        )}

        {/* face */}
        <ellipse cx={144} cy={230} rx={18} ry={9} fill={X.cheek} opacity={mood === "senang" ? 0.8 : 0.5} />
        <ellipse cx={276} cy={230} rx={18} ry={9} fill={X.cheek} opacity={mood === "senang" ? 0.8 : 0.5} />
        <Eyes mood={mood} blink={blink} C={C} />
        {BROWS[mood]?.map((d) => <path key={d} d={d} fill="none" stroke={C.thunder} strokeWidth={8} strokeLinecap="round" />)}
        <Mouth mood={mood} talk={talk} C={C} />
        {look.accessory === "kacamata" && <Glasses C={C} temples={look.hair === "pendek"} />}
        {look.accessory === "headset" && <Headset C={C} />}
        <MoodExtras mood={mood} frame={frame} phase={phase} C={C} font={font.family} />
      </g>
    </svg>
  );
};
