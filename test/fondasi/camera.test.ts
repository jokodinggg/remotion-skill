import { describe, expect, it } from "vitest";
import { camAt, type CamKey } from "../../src/fondasi/motion/Camera";
import { SPRINGS } from "../../src/fondasi/motion/springs";

const keys: CamKey[] = [
  { frame: 10, scale: 1, x: 0, y: 0 },
  { frame: 70, scale: 2, x: 100, y: -50 },
];

describe("camAt", () => {
  it("returns the first key before the range", () => {
    expect(camAt(keys, 0)).toEqual({ scale: 1, x: 0, y: 0 });
  });
  it("returns the last key after the range", () => {
    expect(camAt(keys, 500)).toEqual({ scale: 2, x: 100, y: -50 });
  });
  it("eases out: midpoint is past the linear half", () => {
    const mid = camAt(keys, 40);
    expect(mid.scale).toBeGreaterThan(1.5);
    expect(mid.scale).toBeLessThan(2);
  });
  it("returns identity for no keys", () => {
    expect(camAt([], 5)).toEqual({ scale: 1, x: 0, y: 0 });
  });
  it("sorts keys defensively", () => {
    expect(camAt([...keys].reverse(), 0)).toEqual({ scale: 1, x: 0, y: 0 });
  });
});

describe("SPRINGS", () => {
  it("matches the plan", () => {
    expect(SPRINGS).toEqual({
      snappy: { damping: 16, stiffness: 180 },
      soft: { damping: 20, stiffness: 90 },
      bouncy: { damping: 10, stiffness: 140, mass: 0.9 },
    });
  });
});
