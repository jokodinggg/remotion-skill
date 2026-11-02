import { describe, expect, it } from "vitest";
import { sampleTimeline } from "../../src/archetypes/sampleTimeline";
import { TimelineSchema } from "../../src/fondasi/schema";

describe("sampleTimeline", () => {
  it("passes TimelineSchema.parse", () => {
    expect(() => TimelineSchema.parse(sampleTimeline)).not.toThrow();
  });

  it("has 7 lines with unique two-digit ids", () => {
    const ids = sampleTimeline.lines.map((l) => l.id);
    expect(ids).toEqual(["01", "02", "03", "04", "05", "06", "07"]);
  });

  it("gives every line 2.5–4 s of words and at least one keyword", () => {
    for (const line of sampleTimeline.lines) {
      const span = line.words.at(-1)!.endMs - line.words[0].startMs;
      expect(span, `line ${line.id}`).toBeGreaterThanOrEqual(2500);
      expect(span, `line ${line.id}`).toBeLessThanOrEqual(4000);
      expect(line.words.some((w) => w.keyword), `line ${line.id}`).toBe(true);
    }
  });

  it("keeps words ordered, absolute and inside their line, lines contiguous", () => {
    let prevEnd = 0;
    for (const line of sampleTimeline.lines) {
      expect(line.startMs).toBe(prevEnd);
      for (const [i, w] of line.words.entries()) {
        expect(w.endMs).toBeGreaterThan(w.startMs);
        if (i > 0) expect(w.startMs).toBeGreaterThan(line.words[i - 1].endMs);
        expect(w.startMs).toBeGreaterThanOrEqual(line.startMs);
        expect(w.endMs).toBeLessThanOrEqual(line.startMs + line.durMs);
      }
      prevEnd = line.startMs + line.durMs;
    }
    expect(sampleTimeline.durationMs).toBe(prevEnd + sampleTimeline.tailMs);
  });
});
