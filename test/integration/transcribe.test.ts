import { describe, expect, it } from "vitest";
import { similarity } from "../../src/fondasi/timeline/align";
import { normalizeWord } from "../../src/fondasi/timeline/normalize";
import { transcribeAudio } from "../../scripts/lib/whisper";

describe("transcribeAudio (whisper.cpp)", () => {
  it("transcribes deadline-01.wav into ordered words containing 'deadline'", async () => {
    const words = await transcribeAudio("test/fixtures/audio/deadline-01.wav");
    expect(words.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < words.length; i++) {
      expect(words[i].startMs).toBeGreaterThanOrEqual(words[i - 1].startMs);
    }
    const heard = words.map((w) => normalizeWord(w.text));
    expect(heard.some((w) => similarity(w, "deadline") >= 0.7)).toBe(true);
  }, 300_000);
});
