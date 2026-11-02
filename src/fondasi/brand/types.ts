export type PaletteKey =
  | "lawnGreen"
  | "thunder"
  | "mintCream"
  | "hijauTua"
  | "hijauTerang"
  | "layar"
  | "glow"
  | "kuning"
  | "merah";

export type BrandKit = {
  id: string;
  palette: Record<PaletteKey, string>;
  font: { family: "Poppins"; weights: ("400" | "500" | "600" | "700" | "800")[] };
  /** `color` and `light` are paths relative to `public/`. */
  logo: { color: string; light: string; right: number; top: number; width: number };
  voices: Record<string, { name: string; elevenLabsId: string | null }>;
  cta: { title: string; sub: string; closing: string };
  caption: {
    bg: string;
    bgOpacity: number;
    text: string;
    brandWord: string;
    keyword: string;
    fontSize: number;
    fontWeight: "600";
    inactiveOpacity: number;
  };
  safeArea: {
    top: number;
    bottom: number;
    rail: { xMin: number; yMin: number; yMax: number };
  };
};

export type Seri = {
  id: string;
  chip: string | null;
  voice: string;
  musicMood: string;
  durationRange: [number, number];
  cta: boolean;
  tailMs: number;
};
