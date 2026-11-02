import { describe, expect, it } from "vitest";
import { atKeyword, atWord, talkAmount } from "../../src/fondasi/motion/timing";
import { mkLine, mkTimeline, w } from "./helpers";

const t = mkTimeline(
  [mkLine("01", 500, 3000, [w("Deadline", 1000, 1400, true), w("besok,", 1500, 2000), w("0%", 2100, 2500, true)])],
  6000,
);

describe("timing", () => {
  it("atWord by text uses normalizeWord", () => expect(atWord(t, "01", "BESOK", 60)).toBe(Math.round((1500 / 1000) * 60)));
  it("atWord by index", () => expect(atWord(t, "01", 2, 60)).toBe(126));
  it("atWord throws on unknown word", () =>
    expect(() => atWord(t, "01", "nope", 60)).toThrow("Kata tidak ditemukan: nope di baris 01"));
  it("atWord throws on unknown line", () =>
    expect(() => atWord(t, "99", "x", 60)).toThrow("Baris tidak ditemukan: 99"));
  it("atKeyword picks i-th keyword", () => {
    expect(atKeyword(t, "01", 1, 60)).toBe(126);
    expect(() => atKeyword(t, "01", 2, 60)).toThrow();
  });
  it("talkAmount is 0 in a pause and >0.3 in a word", () => {
    expect(talkAmount(t, "01", 1450)).toBe(0);
    expect(talkAmount(t, "01", 1200)).toBeGreaterThan(0.3);
  });
});
