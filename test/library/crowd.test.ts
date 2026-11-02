import { describe, expect, it } from "vitest";
import { crowdLayout, crowdPersonWidth, personSize } from "../../src/library/characters/variants";

const AREA = { w: 1000, h: 640 };

describe("crowdLayout", () => {
  it("is deterministic for the same seed", () => {
    expect(crowdLayout(12, 7, AREA)).toEqual(crowdLayout(12, 7, AREA));
  });

  it("changes with a different seed", () => {
    expect(crowdLayout(12, 8, AREA)).not.toEqual(crowdLayout(12, 7, AREA));
  });

  it("returns one item per person with scale in 0.7..1.0", () => {
    const items = crowdLayout(12, 7, AREA);
    expect(items).toHaveLength(12);
    for (const it of items) {
      expect(it.scale).toBeGreaterThanOrEqual(0.7);
      expect(it.scale).toBeLessThanOrEqual(1);
    }
  });

  it.each([
    [12, 7, AREA],
    [1, 3, { w: 300, h: 300 }],
    [5, 11, { w: 1080, h: 400 }],
    [30, 2, { w: 1080, h: 900 }],
    [8, 5, { w: 400, h: 1000 }],
  ])("keeps every scaled box of %i people (seed %i) inside the area", (count, seed, area) => {
    const base = crowdPersonWidth(count, area);
    for (const it of crowdLayout(count, seed, area)) {
      const { w, h } = personSize("duduk", base * it.scale);
      expect(it.x).toBeGreaterThanOrEqual(0);
      expect(it.y).toBeGreaterThanOrEqual(0);
      expect(it.x + w).toBeLessThanOrEqual(area.w + 1e-6);
      expect(it.y + h).toBeLessThanOrEqual(area.h + 1e-6);
    }
  });
});
