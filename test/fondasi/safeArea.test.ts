import { describe, expect, it } from "vitest";
import { JOKODING } from "../../brand/jokoding/brand";
import { SAFE, isInForbiddenZone, safeBox } from "../../src/fondasi/layout/safeArea";

describe("safeArea", () => {
  it("flags the top zone", () => {
    expect(isInForbiddenZone({ x: 100, y: 100, w: 200, h: 100 }, JOKODING)).toBe(true);
  });
  it("accepts a rect inside the safe box", () => {
    expect(isInForbiddenZone({ x: 200, y: 600, w: 400, h: 400 }, JOKODING)).toBe(false);
  });
  it("flags the right rail", () => {
    expect(isInForbiddenZone({ x: 900, y: 1000, w: 120, h: 100 }, JOKODING)).toBe(true);
  });
  it("flags the bottom zone", () => {
    expect(isInForbiddenZone({ x: 200, y: 1600, w: 100, h: 50 }, JOKODING)).toBe(true);
  });
  it("exposes the composition box and frame size", () => {
    expect(SAFE).toEqual({ width: 1080, height: 1920 });
    expect(safeBox(JOKODING)).toEqual({ x: 120, y: 300, w: 840, h: 1050 });
  });
});
