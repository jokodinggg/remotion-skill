import type { TimedWord, Timeline, TimelineLine } from "../../src/fondasi/schema";

export const w = (text: string, startMs: number, endMs: number, keyword = false): TimedWord => ({
  text, startMs, endMs, keyword, inserted: false,
});

export const mkLine = (id: string, startMs: number, durMs: number, words: TimedWord[], tag = "calm"): TimelineLine => ({
  id, speaker: "narator", tag, startMs, durMs, words, pauses: [],
});

export const mkTimeline = (lines: TimelineLine[], durationMs: number): Timeline => ({
  slug: "x", seri: "joki-cepat", title: "x", cta: true, fps: 60, durationMs, tailMs: 0, voOffsetMs: 0,
  vo: { mode: "single", src: "vo.mp3" }, lines, music: null, diffs: [],
});
