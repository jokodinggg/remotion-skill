import type { Timeline, TimelineLine } from "../schema";
import { chunkWords, type CaptionChunk } from "./chunk";

export type ActiveChunk = { line: TimelineLine; chunk: CaptionChunk };

/** The line and chunk on screen at `ms`, or null. Line: startMs <= ms < startMs + durMs; chunk: showFromMs <= ms < showUntilMs. */
export function activeChunk(timeline: Timeline, ms: number): ActiveChunk | null {
  const line = timeline.lines.find((l) => ms >= l.startMs && ms < l.startMs + l.durMs);
  if (!line) return null;
  const chunk = chunkWords(line.words, line.startMs + line.durMs, line.startMs).find(
    (c) => ms >= c.showFromMs && ms < c.showUntilMs,
  );
  return chunk ? { line, chunk } : null;
}
