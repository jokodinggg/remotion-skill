import type { TimedWord } from "../schema";

export type CaptionChunk = { words: TimedWord[]; showFromMs: number; showUntilMs: number };

const MAX_WORDS = 6;
const MIN_WORDS_FOR_GAP_SPLIT = 3;
const GAP_SPLIT_MS = 300;
const LEAD_IN_MS = 150;

export function chunkWords(words: TimedWord[], lineEndMs: number, lineStartMs = 0): CaptionChunk[] {
  if (words.length === 0) return [];
  const groups: TimedWord[][] = [];
  let current: TimedWord[] = [];
  words.forEach((word, i) => {
    current.push(word);
    const next = words[i + 1];
    const full = current.length >= MAX_WORDS;
    const gapSplit =
      next !== undefined &&
      current.length >= MIN_WORDS_FOR_GAP_SPLIT &&
      next.startMs - word.endMs >= GAP_SPLIT_MS;
    if (full || gapSplit) {
      groups.push(current);
      current = [];
    }
  });
  if (current.length > 0) groups.push(current);

  const froms = groups.map((g) => Math.max(lineStartMs, g[0].startMs - LEAD_IN_MS));
  return groups.map((g, i) => ({
    words: g,
    showFromMs: froms[i],
    showUntilMs: i + 1 < groups.length ? froms[i + 1] : lineEndMs,
  }));
}
