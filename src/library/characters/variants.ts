import { random } from "remotion";
import { parseHex } from "../style";

/**
 * Person variants and the crowd layout. Pure data and math (no React), so
 * scenes and tests can place people without rendering them.
 */

export type PersonPose = "duduk" | "berdiri" | "nunjuk" | "angkat-tangan";

export type PersonLook = {
  hair: "pendek" | "panjang" | "hijab";
  skin: 0 | 1 | 2 | 3;
  /** Any color string, or a brand palette key (e.g. "lawnGreen"). */
  outfit: string;
  accessory?: "kacamata" | "headset";
};

export const SKIN = ["#F6D2B4", "#E4B58F", "#C68B5E", "#8D5A3B"] as const;
/** Neck / shade tone per skin, same index as SKIN. */
export const SKIN_SHADE = ["#E6B48F", "#CF9A70", "#A9714A", "#6F432B"] as const;

/**
 * Native coordinate space. The head and shoulders are 420 units wide in every
 * pose; `width` on <Person> is the rendered size of those 420 units, so people
 * at the same width share a scale whatever their pose. Each pose has its own
 * viewBox: duduk is the bust cropped at the desk line (y 460), the standing
 * poses run to the shoes (y 760), nunjuk is wider for the pointing arm.
 */
export const PERSON_CORE_W = 420;
export const PERSON_BOX: Record<PersonPose, { w: number; h: number }> = {
  duduk: { w: 420, h: 460 },
  berdiri: { w: 420, h: 760 },
  "angkat-tangan": { w: 440, h: 760 },
  nunjuk: { w: 540, h: 760 },
};

/** Rendered pixel size of a Person for a given pose and `width`. */
export const personSize = (pose: PersonPose, width: number): { w: number; h: number } => {
  const s = width / PERSON_CORE_W;
  return { w: PERSON_BOX[pose].w * s, h: PERSON_BOX[pose].h * s };
};

// ── color helpers ─────────────────────────────────────────────────────────
const luminance = (hex: string): number => {
  const rgb = parseHex(hex);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Hijab color: the candidate with the strongest luminance contrast to the outfit. */
export const hijabColor = (outfit: string, candidates: string[]): string => {
  const l = luminance(outfit);
  return candidates.reduce((best, c) => (Math.abs(luminance(c) - l) > Math.abs(luminance(best) - l) ? c : best), candidates[0]);
};

// ── crowd ─────────────────────────────────────────────────────────────────
/** Palette keys a crowd draws outfits from. Merah is reserved for anger/error. */
export const CROWD_OUTFITS = ["lawnGreen", "hijauTua", "hijauTerang", "kuning"] as const;

export type CrowdItem = { x: number; y: number; scale: number; look: PersonLook };
type Area = { w: number; h: number };

const BUST_RATIO = PERSON_BOX.duduk.h / PERSON_BOX.duduk.w;
const OVERLAP_X = 0.82; // neighbours overlap a little at the shoulders
const ROW_STEP = 0.5; // back row baseline sits this many bust heights higher
const MIN_SCALE = 0.7;

const rowsFor = (count: number, area: Area): number => {
  const rows = Math.round(Math.sqrt(count * (area.h / area.w) * 1.2));
  return Math.min(Math.max(rows, 1), Math.max(count, 1));
};

const rowScale = (r: number, rows: number): number => (rows === 1 ? 1 : MIN_SCALE + ((1 - MIN_SCALE) * r) / (rows - 1));

/** Rows back to front; earlier rows get the extra person when count does not divide. */
const rowCounts = (count: number, rows: number): number[] =>
  Array.from({ length: rows }, (_, r) => Math.floor(count / rows) + (r < count % rows ? 1 : 0));

/** Unscaled Person `width` (front-row size) that lets `count` busts fit in `area`. */
export const crowdPersonWidth = (count: number, area: Area): number => {
  const rows = rowsFor(count, area);
  const counts = rowCounts(count, rows);
  // horizontal: a row of n busts at scale s spans W*s*(OVERLAP_X*(n-1)+1)
  const byWidth = Math.min(...counts.map((n, r) => area.w / (rowScale(r, rows) * (OVERLAP_X * Math.max(n - 1, 0) + 1))));
  // vertical: back row top (baseline minus its bust) must stay at y >= 0
  const byHeight = area.h / (BUST_RATIO * (rowScale(0, rows) + ROW_STEP * (rows - 1)));
  const frontOnly = area.h / BUST_RATIO;
  return Math.min(byWidth, byHeight, frontOnly);
};

const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), Math.max(lo, hi));

/**
 * Seeded crowd of seated busts in loose rows, back row first (render order).
 * Back rows are smaller (0.7) and higher; every box (x, y, personSize("duduk",
 * crowdPersonWidth * scale)) lies inside `area`.
 */
export const crowdLayout = (count: number, seed: number, area: Area): CrowdItem[] => {
  const rows = rowsFor(count, area);
  const counts = rowCounts(count, rows);
  const W = crowdPersonWidth(count, area);
  const H = W * BUST_RATIO;
  const items: CrowdItem[] = [];
  let i = 0;
  counts.forEach((n, r) => {
    const s = rowScale(r, rows);
    const w = W * s;
    const h = H * s;
    const spacing = w * OVERLAP_X;
    const rowW = spacing * Math.max(n - 1, 0) + w;
    const start = (area.w - rowW) / 2;
    const baseline = area.h - (rows - 1 - r) * ROW_STEP * H;
    for (let c = 0; c < n; c++, i++) {
      const rnd = (k: string) => random(`crowd-${seed}-${i}-${k}`);
      const jx = (rnd("x") - 0.5) * 0.24 * w;
      const jy = (rnd("y") - 0.5) * 0.06 * h;
      const acc = rnd("accessory");
      items.push({
        x: clamp(start + c * spacing + jx, 0, area.w - w),
        y: clamp(baseline - h + jy, 0, area.h - h),
        scale: s,
        look: {
          hair: (["pendek", "panjang", "hijab"] as const)[Math.floor(rnd("hair") * 3)],
          skin: Math.floor(rnd("skin") * 4) as PersonLook["skin"],
          outfit: CROWD_OUTFITS[Math.floor(rnd("outfit") * CROWD_OUTFITS.length)],
          accessory: acc < 0.15 ? "kacamata" : acc < 0.25 ? "headset" : undefined,
        },
      });
    }
  });
  return items;
};
