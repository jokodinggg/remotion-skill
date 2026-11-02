import { describe, expect, it } from "vitest";
import { qaFrames, qaPages } from "../../src/fondasi/qa/frames";
import { mkLine, mkTimeline, w } from "./helpers";

const t = mkTimeline(
  [
    mkLine("01", 500, 3000, [w("a", 800, 1200, true), w("b", 1300, 2000)]),
    mkLine("02", 4000, 2000, [w("c", 4000, 4500, true)]),
  ],
  8000,
);

describe("qaFrames", () => {
  it("is sorted, unique, in range, with CTA frame", () => {
    const f = qaFrames(t);
    expect(f).toEqual([...new Set(f)].sort((a, b) => a - b));
    expect(f).toContain(Math.round(7000 / 1000 * 60));
    expect(f).toContain(48); // 800 ms keyword and line1 start+300 coincide
    expect(f[0]).toBeGreaterThanOrEqual(0);
    expect(f[f.length - 1]).toBeLessThanOrEqual(Math.ceil(8 * 60) - 1);
  });
  it("clamps frames into range", () => {
    const short = mkTimeline([mkLine("01", 0, 100, [w("a", 0, 50)])], 500);
    const f = qaFrames(short);
    expect(f.every((x) => x >= 0 && x <= 29)).toBe(true);
  });
});

describe("qaPages", () => {
  it("pages 13 frames as 6,6,1", () =>
    expect(qaPages(Array.from({ length: 13 }, (_, i) => i)).map((p) => p.length)).toEqual([6, 6, 1]));
});
