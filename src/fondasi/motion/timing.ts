import { normalizeWord } from "../timeline/normalize";
import type { Timeline, TimelineLine } from "../schema";

const toFrame = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

function findLine(t: Timeline, lineId: string): TimelineLine {
  const line = t.lines.find((l) => l.id === lineId);
  if (!line) throw new Error(`Baris tidak ditemukan: ${lineId}`);
  return line;
}

export function atWord(t: Timeline, lineId: string, which: string | number, fps: number): number {
  const line = findLine(t, lineId);
  const word =
    typeof which === "number"
      ? line.words[which]
      : line.words.find((x) => normalizeWord(x.text) === normalizeWord(which));
  if (!word) throw new Error(`Kata tidak ditemukan: ${which} di baris ${lineId}`);
  return toFrame(word.startMs, fps);
}

export function atKeyword(t: Timeline, lineId: string, i: number, fps: number): number {
  const word = findLine(t, lineId).words.filter((x) => x.keyword)[i];
  if (!word) throw new Error(`Kata kunci ke-${i} tidak ditemukan di baris ${lineId}`);
  return toFrame(word.startMs, fps);
}

/** Mouth openness 0..~0.9: animated inside a spoken word, 0 elsewhere. */
export function talkAmount(t: Timeline, lineId: string, ms: number): number {
  const line = findLine(t, lineId);
  const inWord = line.words.some((x) => ms >= x.startMs && ms <= x.endMs);
  return inWord ? 0.35 + 0.55 * Math.abs(Math.sin(ms / 55)) : 0;
}
