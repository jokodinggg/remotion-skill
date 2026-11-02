import { describe, expect, it } from "vitest";
import type { HeardWord } from "../../src/fondasi/schema";
import { alignTokens, expandHeard, similarity } from "../../src/fondasi/timeline/align";

const heard = (...texts: string[]): HeardWord[] =>
  texts.map((text, i) => ({ text, startMs: i * 300, endMs: (i + 1) * 300 }));
const kinds = (e: string[], h: HeardWord[]) => alignTokens(e, h).map((p) => p.kind);

describe("similarity", () => {
  it("is high for near spellings", () => {
    expect(similarity("deadline", "dedline")).toBeGreaterThanOrEqual(0.7);
    expect(similarity("konsultasi", "konsul")).toBeCloseTo(0.6);
  });
});

describe("alignTokens", () => {
  it("matches exact words", () => {
    expect(kinds(["deadline", "besok"], heard("deadline", "besok"))).toEqual(["match", "match"]);
  });
  it("handles a split word without crashing", () => {
    const k = kinds(["jokoding"], heard("joko", "ding"));
    expect(k).toHaveLength(2);
    expect(k.filter((x) => x === "inserted")).toHaveLength(1);
    expect(k.filter((x) => x === "match" || x === "changed")).toHaveLength(1);
  });
  it("marks a missing word", () => {
    expect(kinds(["tenang", "konsultasi", "dulu"], heard("tenang", "dulu"))).toEqual(["match", "missing", "match"]);
  });
  it("marks an inserted word", () => {
    expect(kinds(["chat", "aja"], heard("chat", "aja", "ya"))).toEqual(["match", "match", "inserted"]);
  });
  it("marks a changed word", () => {
    expect(kinds(["konsultasi"], heard("konsul"))).toEqual(["changed"]);
  });
  it("ignores casing and punctuation", () => {
    expect(kinds(["nol", "persen"], heard("Nol", "persen?"))).toEqual(["match", "match"]);
  });
  it("expands digits heard as one word into spoken units", () => {
    const h: HeardWord[] = [{ text: "0%", startMs: 0, endMs: 600 }];
    const pairs = alignTokens(["nol", "persen"], h);
    expect(pairs.map((p) => p.kind)).toEqual(["match", "match"]);
    const units = expandHeard(h);
    expect(pairs.map((p) => units[p.h as number])).toEqual([
      { text: "nol", startMs: 0, endMs: 300 },
      { text: "persen", startMs: 300, endMs: 600 },
    ]);
  });
});

describe("expandHeard", () => {
  it("splits timing evenly, drops empties, keeps plain words", () => {
    const out = expandHeard([
      { text: "halo", startMs: 0, endMs: 200 },
      { text: "...", startMs: 200, endMs: 300 },
      { text: "0%", startMs: 300, endMs: 900 },
    ]);
    expect(out).toEqual([
      { text: "halo", startMs: 0, endMs: 200 },
      { text: "nol", startMs: 300, endMs: 600 },
      { text: "persen", startMs: 600, endMs: 900 },
    ]);
  });
  it("falls back to normalized text when tokenize throws", () => {
    const out = expandHeard([{ text: "99999999999999", startMs: 0, endMs: 100 }]);
    expect(out).toHaveLength(1);
    expect(out[0].endMs).toBe(100);
  });
});
