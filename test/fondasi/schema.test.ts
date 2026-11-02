import { describe, expect, it } from "vitest";
import { ScriptSchema } from "../../src/fondasi/schema";

const example = {
  slug: "2026-11-05-deadline",
  seri: "joki-cepat",
  voice: null,
  title: "Deadline besok, progres 0%?",
  music: {
    mood: "tense-to-upbeat",
    bpm: 110,
    prompt: "tense minimal electronic ... instrumental, no vocals",
  },
  lines: [
    {
      id: "01",
      speaker: "narator",
      tag: "panicked",
      spoken: "Deadline besok... progres masih nol persen?",
      caption: "deadline besok, progres masih 0%?",
      keywords: ["deadline", "0%"],
      visual: "Mahasiswa panik di meja belajar malam, jam 23:52, kartu progres 0%.",
    },
  ],
};

const errorText = (input: unknown) => {
  const r = ScriptSchema.safeParse(input);
  if (r.success) throw new Error("expected failure");
  return r.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("\n");
};

describe("ScriptSchema", () => {
  it("accepts the spec example", () => {
    expect(ScriptSchema.parse(example).slug).toBe("2026-11-05-deadline");
  });

  it("rejects a bad line id with the field path", () => {
    const bad = { ...example, lines: [{ ...example.lines[0], id: "1" }] };
    expect(errorText(bad)).toContain("lines.0.id");
  });

  it("rejects empty lines with the field path", () => {
    expect(errorText({ ...example, lines: [] })).toContain("lines");
  });

  it("rejects a missing spoken with the field path", () => {
    const rest: Partial<typeof example.lines[0]> = { ...example.lines[0] }; delete rest.spoken;
    expect(errorText({ ...example, lines: [rest] })).toContain("lines.0.spoken");
  });
});
