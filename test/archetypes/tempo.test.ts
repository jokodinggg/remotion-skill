import { describe, expect, it } from "vitest";
import { fillerBeats } from "../../src/archetypes/tempo";

const maxGapOf = (beats: number[]) => Math.max(...beats.slice(1).map((b, i) => b - beats[i]));

describe("fillerBeats", () => {
  it("adds nothing when every gap is within maxGap", () => {
    expect(fillerBeats([0, 60, 120], 0, 200, 90)).toEqual([]);
  });

  it("fills a long gap with evenly spaced beats", () => {
    expect(fillerBeats([0, 200], 0, 200, 90)).toEqual([67, 133]);
  });

  it("covers the stretch from the last anchor to the line end", () => {
    const f = fillerBeats([0, 30], 0, 240, 90);
    const all = [0, 30, ...f, 240].sort((a, b) => a - b);
    expect(maxGapOf(all)).toBeLessThanOrEqual(90);
  });

  it("ignores anchors outside the line and sorts the rest", () => {
    const f = fillerBeats([500, 100, -40, 20], 0, 200, 90);
    const all = [0, 20, 100, ...f, 200].sort((a, b) => a - b);
    expect(maxGapOf(all)).toBeLessThanOrEqual(90);
    expect(f.every((b) => b > 0 && b < 200)).toBe(true);
  });
});
