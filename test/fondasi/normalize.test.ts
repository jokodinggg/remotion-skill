import { describe, expect, it } from "vitest";
import type { ScriptLine } from "../../src/fondasi/schema";
import {
  UnspeakableTokenError,
  checkCaption,
  normalizeWord,
  spellNumber,
  stripTags,
  tokenize,
} from "../../src/fondasi/timeline/normalize";

const line = (spoken: string, caption?: string, id = "01"): ScriptLine => ({
  id,
  speaker: "narator",
  tag: "calm",
  spoken,
  caption,
  keywords: [],
  visual: "x",
});

describe("spellNumber", () => {
  it.each([
    [0, "nol"],
    [11, "sebelas"],
    [12, "dua belas"],
    [21, "dua puluh satu"],
    [100, "seratus"],
    [115, "seratus lima belas"],
    [1000, "seribu"],
    [2024, "dua ribu dua puluh empat"],
    [1500000, "satu juta lima ratus ribu"],
    [999999999, "sembilan ratus sembilan puluh sembilan juta sembilan ratus sembilan puluh sembilan ribu sembilan ratus sembilan puluh sembilan"],
  ])("%i", (n, s) => expect(spellNumber(n)).toBe(s));

  it("rejects out of range", () => {
    expect(() => spellNumber(1_000_000_000)).toThrow(RangeError);
    expect(() => spellNumber(-1)).toThrow(RangeError);
    expect(() => spellNumber(1.5)).toThrow(RangeError);
  });
});

describe("tokenize", () => {
  it("handles percent and punctuation", () => {
    expect(tokenize("progres 0%?")).toEqual([
      { display: "progres", spoken: ["progres"] },
      { display: "0%?", spoken: ["nol", "persen"] },
    ]);
  });
  it("decimal comma", () => {
    expect(tokenize("2,5 detik")[0].spoken).toEqual(["dua", "koma", "lima"]);
  });
  it("thousands dot", () => {
    expect(tokenize("1.500")[0].spoken).toEqual(["seribu", "lima", "ratus"]);
  });
  it("strips edge punctuation", () => {
    expect(tokenize('"Halo,"')[0]).toEqual({ display: '"Halo,"', spoken: ["halo"] });
  });
  it("strips curly quotes and dashes", () => {
    expect(tokenize("“50”")[0].spoken).toEqual(["lima", "puluh"]);
    expect(tokenize("-5")[0].spoken).toEqual(["lima"]);
  });
  it("percent forms", () => {
    expect(tokenize("50%")[0].spoken).toEqual(["lima", "puluh", "persen"]);
    expect(tokenize("2,5%")[0].spoken).toEqual(["dua", "koma", "lima", "persen"]);
  });
  it("removes hyphens", () => {
    expect(tokenize("self-driving")[0].spoken).toEqual(["selfdriving"]);
  });
});

describe("stripTags / normalizeWord", () => {
  it("strips tags", () => {
    expect(stripTags("[panicked] Deadline besok... [sighs] ya")).toBe("Deadline besok... ya");
  });
  it("normalizes", () => {
    expect(normalizeWord("Halo!")).toBe("halo");
  });
});

describe("checkCaption", () => {
  it("accepts matching caption", () => {
    expect(() => checkCaption(line("progres masih nol persen?", "progres masih 0%?"))).not.toThrow();
  });
  it("accepts line without caption", () => {
    expect(() => checkCaption(line("[calm] Tenang dulu."))).not.toThrow();
  });
  it.each(["GPT-5", "24/7"])("throws unspeakable %s", (tok) => {
    try {
      checkCaption(line("pakai gipiti lima", `pakai ${tok}`, "07"));
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(UnspeakableTokenError);
      expect((e as UnspeakableTokenError).token).toBe(tok);
      expect((e as UnspeakableTokenError).lineId).toBe("07");
      expect((e as Error).message).toContain("Baris 07");
      expect((e as Error).message).toContain(`"${tok}"`);
    }
  });
  it.each(["1.5", "5-10"])("flags leftover digits %s", (tok) => {
    for (const l of [line("x", `ada ${tok}`, "04"), line(`ada ${tok}`, undefined, "04")]) {
      try {
        checkCaption(l);
        expect.unreachable();
      } catch (e) {
        expect(e).toBeInstanceOf(UnspeakableTokenError);
        expect((e as UnspeakableTokenError).token).toBe(tok);
        expect((e as Error).message).toContain("Baris 04");
      }
    }
  });
  it("flags unspeakable spoken token even when caption is present", () => {
    try {
      checkCaption(line("ada 1.5 detik", "ada satu koma lima detik", "12"));
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(UnspeakableTokenError);
      expect((e as UnspeakableTokenError).token).toBe("1.5");
      expect((e as UnspeakableTokenError).lineId).toBe("12");
    }
  });
  it("accepts curly-quoted number and percents", () => {
    expect(() => checkCaption(line("“lima puluh” persen", "“50” persen"))).not.toThrow();
    expect(() => checkCaption(line("lima puluh persen", "50%"))).not.toThrow();
  });
  it("wraps out-of-range numbers", () => {
    try {
      checkCaption(line("x", "ada 1000000000", "09"));
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(UnspeakableTokenError);
      expect((e as UnspeakableTokenError).token).toBe("1000000000");
      expect((e as UnspeakableTokenError).lineId).toBe("09");
    }
  });
  it("checks spoken when no caption", () => {
    expect(() => checkCaption(line("pakai v3"))).toThrow(UnspeakableTokenError);
  });
  it("throws mismatch", () => {
    expect(() => checkCaption(line("progres masih nol persen?", "progres sudah 0%"))).toThrow(
      "Caption baris 01 tidak cocok dengan spoken",
    );
  });
});
