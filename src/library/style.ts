/**
 * Shared illustration style. EXTRA_COLORS is the library's one neutral table:
 * every color the brand palette lacks lives here (characters and props alike).
 */
export const STYLE = { outlineProp: 10, outlineJoks: 14, hardShadow: "0 12px 0", hardShadowOffset: 12 } as const;

export const EXTRA_COLORS = {
  white: "#FFFFFF",
  // joks
  visorLine: "#4A4747",
  steamStroke: "#C9C6C6",
  cheek: "#F07AA0",
  tear: "#7CCBF0",
  // person
  hair: "#322F30",
  hairGloss: "#5A5657",
  pants: "#4A5568",
  pantsGloss: "#6B7789",
  mouth: "#6E2E2E",
  tongue: "#F07AA0",
  beige: "#EFE3CF",
  charcoal: "#5A5657",
  headset: "#5A5657",
  // props
  wood: "#E8B97C",
  woodDark: "#C98F4E",
  woodGloss: "#F4D3A6",
  paperShade: "#F1F1EC",
  cell: "#EEF0EA",
  clockRing: "#E4E4DD",
  metal: "#9AA3AE",
  metalLight: "#C9D0D8",
  metalDark: "#7D8691",
  moon: "#FFF6C9",
  sky: "#CDEBFA",
  coffee: "#7A4A2A",
  // stages
  wall: "#EAF6E2",
  wallNight: "#D9EACE",
  floor: "#CFE6BC",
} as const;

// ── color helpers (flat tints, never gradients) ───────────────────────────
export const parseHex = (hex: string): [number, number, number] | null => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toHex = (rgb: number[]): string => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

/** Mix a hex color toward white by `amount` (0..1). Non-hex input is returned unchanged. */
export const tint = (hex: string, amount: number): string => {
  const rgb = parseHex(hex);
  return rgb ? toHex(rgb.map((v) => v + (255 - v) * amount)) : hex;
};
