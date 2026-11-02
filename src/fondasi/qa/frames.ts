import type { Timeline } from "../schema";

/** Sorted, unique frames worth inspecting: line starts, keywords, line midpoints, CTA. */
export function qaFrames(t: Timeline): number[] {
  const mss: number[] = [];
  for (const line of t.lines) {
    mss.push(line.startMs + 300, line.startMs + line.durMs / 2);
    for (const w of line.words) if (w.keyword) mss.push(w.startMs);
  }
  mss.push(t.durationMs - 1000);
  const total = Math.ceil((t.durationMs / 1000) * t.fps);
  const frames = mss.map((ms) =>
    Math.min(total - 1, Math.max(0, Math.round((ms / 1000) * t.fps))),
  );
  return [...new Set(frames)].sort((a, b) => a - b);
}

export function qaPages(frames: number[], perPage = 6): number[][] {
  const pages: number[][] = [];
  for (let i = 0; i < frames.length; i += perPage) pages.push(frames.slice(i, i + perPage));
  return pages;
}
