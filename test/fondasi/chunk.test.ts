import { describe, expect, it } from "vitest";
import { chunkWords } from "../../src/fondasi/caption/chunk";
import { w } from "./helpers";

const seq = (n: number, gapAfter: Record<number, number> = {}) => {
  let t = 1000;
  return Array.from({ length: n }, (_, i) => {
    const word = w(`k${i}`, t, t + 200);
    t += 200 + (gapAfter[i] ?? 50);
    return word;
  });
};

describe("chunkWords", () => {
  it("splits 8 gapless words into 6 + 2", () => {
    expect(chunkWords(seq(8), 5000).map((c) => c.words.length)).toEqual([6, 2]);
  });
  it("splits on a 400 ms gap once 3 words are in", () => {
    expect(chunkWords(seq(5, { 2: 400 }), 5000).map((c) => c.words.length)).toEqual([3, 2]);
  });
  it("does not split a 2-word chunk on a gap", () => {
    expect(chunkWords(seq(4, { 1: 400 }), 5000).map((c) => c.words.length)).toEqual([4]);
  });
  it("sets showFrom/showUntil", () => {
    const c = chunkWords(seq(8), 5000);
    expect(c[0].showFromMs).toBe(850);
    expect(c[0].showUntilMs).toBe(c[1].showFromMs);
    expect(c[1].showUntilMs).toBe(5000);
  });
  it("clamps showFrom to the line start", () => {
    expect(chunkWords(seq(2), 5000, 900)[0].showFromMs).toBe(900);
  });
  it("returns [] for no words", () => {
    expect(chunkWords([], 100)).toEqual([]);
  });
});
