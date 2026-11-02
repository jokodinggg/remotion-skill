import { describe, expect, it } from "vitest";
import { pickMusic, type MusicMeta } from "../../scripts/lib/music";

function meta(file: string, mood: string, bpm: number): MusicMeta {
  return { file, mood, bpm, durationMs: 30000, prompt: "", source: "eleven-music", license: "owned" };
}

const library = [
  meta("a.mp3", "tense-to-upbeat", 90),
  meta("b.mp3", "tense-to-upbeat", 118),
  meta("c.mp3", "curious-lofi", 110),
  meta("d.mp3", "tense-to-upbeat", 130),
];

describe("pickMusic", () => {
  it("picks the closest BPM within the same mood", () => {
    expect(pickMusic(library, "tense-to-upbeat", 110)?.file).toBe("b.mp3");
    expect(pickMusic(library, "tense-to-upbeat", 60)?.file).toBe("a.mp3");
  });

  it("returns null for a mood with no entries", () => {
    expect(pickMusic(library, "sad-piano", 110)).toBeNull();
    expect(pickMusic([], "tense-to-upbeat", 110)).toBeNull();
  });
});
