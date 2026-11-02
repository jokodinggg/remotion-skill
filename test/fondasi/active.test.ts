import { describe, expect, it } from "vitest";
import { activeChunk } from "../../src/fondasi/caption/active";
import { mkLine, mkTimeline, w } from "./helpers";

const timeline = mkTimeline(
  [
    mkLine("01", 1000, 1000, [w("halo", 1200, 1500), w("dunia", 1600, 1900)]),
    mkLine("02", 3000, 500, [w("oke", 3100, 3400)]),
  ],
  5000,
);

describe("activeChunk", () => {
  it("returns the line and chunk covering ms", () => {
    const a = activeChunk(timeline, 1500);
    expect(a?.line.id).toBe("01");
    expect(a?.chunk.words.map((x) => x.text)).toEqual(["halo", "dunia"]);
  });

  it("is end-exclusive on the line", () => {
    expect(activeChunk(timeline, 2000)).toBeNull();
    expect(activeChunk(timeline, 3499)?.line.id).toBe("02");
    expect(activeChunk(timeline, 3500)).toBeNull();
  });

  it("returns null before the first line", () => {
    expect(activeChunk(timeline, 500)).toBeNull();
  });
});
