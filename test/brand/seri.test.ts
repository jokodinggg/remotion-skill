import { describe, expect, it } from "vitest";
import { JOKODING } from "../../brand/jokoding/brand";
import { effectiveTailMs, getSeri } from "../../brand/jokoding/seri";

describe("seri", () => {
  it("has duration ranges", () => {
    expect(getSeri("joki-cepat").durationRange).toEqual([15, 30]);
    expect(getSeri("kalau-ai").durationRange).toEqual([30, 60]);
  });

  it("throws on unknown seri", () => {
    expect(() => getSeri("x")).toThrow(/Seri tidak dikenal: x/);
  });

  it("computes effective tail", () => {
    const joki = getSeri("joki-cepat");
    const ai = getSeri("kalau-ai");
    expect(effectiveTailMs(joki, { cta: undefined })).toBe(2500);
    expect(effectiveTailMs(ai, { cta: undefined })).toBe(800);
    expect(effectiveTailMs(ai, { cta: true })).toBe(2500);
  });
});

describe("JOKODING", () => {
  it("has the brand palette", () => {
    expect(JOKODING.palette.thunder).toBe("#322F30");
  });

  it("has the caption style", () => {
    expect(JOKODING.caption).toEqual({
      bg: "#322F30",
      bgOpacity: 0.94,
      text: "#FFD400",
      brandWord: "#7BDB2E",
      keyword: "#B9FF7A",
      fontSize: 46,
      fontWeight: "600",
      inactiveOpacity: 0.45,
    });
  });
});
