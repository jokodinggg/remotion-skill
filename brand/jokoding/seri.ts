import type { Seri } from "../../src/fondasi/brand/types";

const TAIL_WITHOUT_CTA_MS = 800;

export const SERI: Seri[] = [
  {
    id: "joki-cepat",
    chip: null,
    voice: "utama",
    musicMood: "tense-to-upbeat",
    durationRange: [15, 30],
    cta: true,
    tailMs: 2500,
  },
  {
    id: "kalau-ai",
    chip: "KALAU AI · SIMULASI",
    voice: "utama",
    musicMood: "curious-lofi",
    durationRange: [30, 60],
    cta: false,
    tailMs: 2500,
  },
];

export function getSeri(id: string): Seri {
  const found = SERI.find((s) => s.id === id);
  if (!found) throw new Error(`Seri tidak dikenal: ${id}`);
  return found;
}

export function effectiveTailMs(seri: Seri, script: { cta?: boolean }): number {
  return (script.cta ?? seri.cta) ? seri.tailMs : TAIL_WITHOUT_CTA_MS;
}
