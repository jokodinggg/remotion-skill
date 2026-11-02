import type { BrandKit } from "../../src/fondasi/brand/types";

export const JOKODING: BrandKit = {
  id: "jokoding",
  palette: {
    lawnGreen: "#44AA00",
    thunder: "#322F30",
    mintCream: "#F9FDF7",
    hijauTua: "#2E7A00",
    hijauTerang: "#7BDB2E",
    layar: "#262324",
    glow: "#B9FF7A",
    kuning: "#FFD400",
    merah: "#FF6B57",
  },
  font: { family: "Poppins", weights: ["400", "500", "600", "700", "800"] },
  logo: {
    color: "brand/jokoding/logo/logo-color.png",
    light: "brand/jokoding/logo/logo-light.png",
    right: 60,
    top: 262,
    width: 210,
  },
  voices: { utama: { name: "Voice utama", elevenLabsId: null } },
  cta: {
    title: "Chat WhatsApp",
    sub: "link di bio · jokoding.id",
    closing: "Apa pilihanmu?",
  },
  caption: {
    bg: "#322F30",
    bgOpacity: 0.94,
    text: "#FFD400",
    brandWord: "#7BDB2E",
    keyword: "#B9FF7A",
    fontSize: 46,
    fontWeight: "600",
    inactiveOpacity: 0.45,
  },
  safeArea: { top: 250, bottom: 420, rail: { xMin: 960, yMin: 900, yMax: 1500 } },
};
