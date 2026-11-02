import { describe, expect, it } from "vitest";
import { getSeri } from "../../brand/jokoding/seri";
import { ScriptSchema, TimelineSchema, type HeardWord } from "../../src/fondasi/schema";
import { stripTags } from "../../src/fondasi/timeline/normalize";
import {
  AlignError,
  buildTimeline,
  LEAD_MS,
  MIN_MATCH,
  PAUSE_MIN_MS,
  PER_LINE_GAP_MS,
} from "../../src/fondasi/timeline/build";
import fixture from "../fixtures/scripts/deadline.json";

const script = ScriptSchema.parse(fixture);
const seri = getSeri(script.seri);

const WORD_MS = 300;
const WORD_GAP_MS = 100;
const LINE_GAP_MS = 600;

/** The spoken words of each line, as whisper would hear them. */
const spokenWords = (): string[][] =>
  script.lines.map((l) => stripTags(l.spoken).split(/\s+/).filter(Boolean));

/** Lays words out back to back: 300 ms each, 100 ms apart inside a line, 600 ms between lines. */
function layout(lines: string[][], startMs: number): HeardWord[][] {
  let t = startMs;
  return lines.map((words, i) => {
    if (i > 0) t += LINE_GAP_MS - WORD_GAP_MS;
    return words.map((text) => {
      const w = { text, startMs: t, endMs: t + WORD_MS };
      t += WORD_MS + WORD_GAP_MS;
      return w;
    });
  });
}

const single = (heard: HeardWord[]) =>
  buildTimeline({ script, seri, vo: { mode: "single", src: "vo/vo.mp3", heard } });

function catchAlign(fn: () => unknown): AlignError {
  try {
    fn();
  } catch (e) {
    if (e instanceof AlignError) return e;
    throw e;
  }
  throw new Error("expected AlignError");
}

describe("constants", () => {
  it("match the plan", () => {
    expect([MIN_MATCH, PER_LINE_GAP_MS, PAUSE_MIN_MS, LEAD_MS]).toEqual([0.85, 450, 350, 150]);
  });
});

describe("buildTimeline, single mode", () => {
  const timeline = single(layout(spokenWords(), 1200).flat());

  it("produces a valid timeline with fields copied from script and seri", () => {
    expect(() => TimelineSchema.parse(timeline)).not.toThrow();
    expect(timeline).toMatchObject({
      slug: "0000-contoh",
      seri: "joki-cepat",
      title: "Deadline besok, progres 0%?",
      cta: true,
      fps: 60,
      tailMs: 2500,
      music: null,
      diffs: [],
      vo: { mode: "single", src: "vo/vo.mp3" },
    });
    expect(timeline.lines.map((l) => [l.id, l.speaker, l.tag])).toEqual([
      ["01", "narator", "panicked"],
      ["02", "joks", "calm"],
      ["03", "joks", "excited"],
    ]);
  });

  it("skips leading silence: voOffsetMs = first word - LEAD_MS", () => {
    expect(timeline.voOffsetMs).toBe(1050);
    expect(timeline.lines[0].startMs).toBe(0);
    expect(timeline.lines[0].words[0].startMs).toBe(150);
  });

  it("starts each later line at the midpoint between neighbouring words", () => {
    const [l1, l2, l3] = timeline.lines;
    const mid = Math.round((l1.words.at(-1)!.endMs + l2.words[0].startMs) / 2);
    expect(l2.startMs).toBe(mid);
    expect(l2.startMs).toBe(2750);
    expect(l1.durMs).toBe(l2.startMs - l1.startMs);
    expect(l3.durMs).toBe(l3.words.at(-1)!.endMs + 300 - l3.startMs);
    expect(timeline.durationMs).toBe(l3.startMs + l3.durMs + 2500);
  });

  it("keeps the caption word 0%? as one keyword spanning nol and persen", () => {
    const l1 = timeline.lines[0];
    expect(l1.words.map((w) => w.text)).toEqual([
      "deadline",
      "besok,",
      "progres",
      "masih",
      "0%?",
    ]);
    const zero = l1.words[4];
    expect(zero).toEqual({ text: "0%?", startMs: 1750, endMs: 2450, keyword: true, inserted: false });
    expect(l1.words[0].keyword).toBe(true);
    expect(l1.words[1].keyword).toBe(false);
  });

  it("marks keywords case-insensitively on spoken text when there is no caption", () => {
    const l2 = timeline.lines[1];
    expect(l2.words.filter((w) => w.keyword).map((w) => w.text)).toEqual(["jokoding."]);
    const l3 = timeline.lines[2];
    expect(l3.words.filter((w) => w.keyword).map((w) => w.text)).toEqual(["WhatsApp,"]);
  });

  it("has no pauses when every gap is short", () => {
    expect(timeline.lines.flatMap((l) => l.pauses)).toEqual([]);
  });

  it("records a 450 ms gap inside a line as a pause", () => {
    const lines = layout(spokenWords(), 1200);
    // Push "dulu" and everything after it 350 ms later: the 100 ms gap becomes 450 ms.
    const dulu = lines[1][2];
    const heard = lines.flat().map((w) =>
      w.startMs >= dulu.startMs ? { ...w, startMs: w.startMs + 350, endMs: w.endMs + 350 } : w,
    );
    const t = single(heard);
    const konsultasi = t.lines[1].words[1];
    expect(t.lines[1].pauses).toEqual([{ atMs: konsultasi.endMs, durMs: 450 }]);
    expect(t.lines.flatMap((l) => l.pauses)).toHaveLength(1);
  });

  it("adds an extra heard word as an inserted TimedWord and diff", () => {
    const heard = layout(spokenWords(), 1200).flat();
    const last = heard.at(-1)!;
    heard.push({ text: "ya", startMs: last.endMs + 100, endMs: last.endMs + 400 });
    const t = single(heard);
    const l3 = t.lines[2];
    expect(l3.words.at(-1)).toEqual({
      text: "ya",
      startMs: last.endMs + 100 - 1050,
      endMs: last.endMs + 400 - 1050,
      keyword: false,
      inserted: true,
    });
    expect(t.diffs).toEqual([{ line: "03", kind: "inserted", heard: "ya" }]);
    expect(l3.durMs).toBe(last.endMs + 400 - 1050 + 300 - l3.startMs);
  });

  it("merges inserted units of one heard word into one TimedWord with the heard text", () => {
    const heard = layout(spokenWords(), 1200).flat();
    const last = heard.at(-1)!;
    heard.push({ text: "20", startMs: last.endMs + 100, endMs: last.endMs + 500 });
    const t = single(heard);
    const inserted = t.lines[2].words.filter((w) => w.inserted);
    expect(inserted).toEqual([
      {
        text: "20",
        startMs: last.endMs + 100 - 1050,
        endMs: last.endMs + 500 - 1050,
        keyword: false,
        inserted: true,
      },
    ]);
    expect(t.diffs).toEqual([{ line: "03", kind: "inserted", heard: "20" }]);
  });

  it("keeps the naskah text with heard timing for a changed word", () => {
    const lines = layout(spokenWords(), 1200);
    lines[2][3] = { ...lines[2][3], text: "wasap" };
    const t = single(lines.flat());
    const wa = t.lines[2].words[3];
    expect(wa).toEqual({
      text: "WhatsApp,",
      startMs: lines[2][3].startMs - 1050,
      endMs: lines[2][3].endMs - 1050,
      keyword: true,
      inserted: false,
    });
    expect(t.diffs).toEqual([
      { line: "03", kind: "changed", expected: "WhatsApp,", heard: "wasap" },
    ]);
  });

  it("drops a word nobody said and records it as missing", () => {
    const lines = layout(spokenWords(), 1200);
    lines[2].splice(1, 1); // "aja"; line 03 keeps 6/7 = 86%
    const t = single(lines.flat());
    expect(t.lines[2].words.map((w) => w.text)).toEqual([
      "Chat",
      "lewat",
      "WhatsApp,",
      "link",
      "di",
      "bio!",
    ]);
    expect(t.diffs).toEqual([{ line: "03", kind: "missing", expected: "aja" }]);
  });

  it("throws low-match for line 02 when too few of its words were heard", () => {
    const lines = layout(spokenWords(), 1200);
    // Remove "Konsultasi" and "dulu": line 02 at 3/5 = 60%, total 16/18 = 89%.
    lines[1] = lines[1].filter((w) => w.text !== "Konsultasi" && w.text !== "dulu");
    const err = catchAlign(() => single(lines.flat()));
    expect(err.kind).toBe("low-match");
    expect(err.lineId).toBe("02");
    expect(err.ratio).toBeCloseTo(0.6);
    expect(err.message).toBe("Kecocokan baris 02 hanya 60% (minimal 85%)");
    expect(err.diffs).toEqual([
      { line: "02", kind: "missing", expected: "Konsultasi" },
      { line: "02", kind: "missing", expected: "dulu" },
    ]);
  });

  it("checks the total ratio before each line", () => {
    const lines = layout(spokenWords(), 1200);
    // Remove 3 of line 02's 5 words: total 15/18 = 83% fails first.
    lines[1] = lines[1].slice(0, 2);
    const err = catchAlign(() => single(lines.flat()));
    expect(err.kind).toBe("low-match");
    expect(err.lineId).toBeUndefined();
    expect(err.ratio).toBeCloseTo(15 / 18);
    expect(err.message).toBe("Kecocokan total hanya 83% (minimal 85%)");
  });

  it("rejects line 02 when its audio is an unrelated sentence", () => {
    const lines = layout(spokenWords(), 1200);
    lines[1] = lines[1].map((w, i) => ({ ...w, text: ["kucing", "hitam", "tidur", "siang", "lagi"][i] }));
    const err = catchAlign(() => single(lines.flat()));
    // Total is 13/18 = 72%, so this also pins that ambiguous-line is checked before the ratios.
    expect(err.kind).toBe("ambiguous-line");
    expect(err.lineId).toBe("02");
    expect(err.ratio).toBe(0);
  });
});

describe("buildTimeline, per-line mode", () => {
  const durs = [3062, 2661, 2708];
  const files = layout(spokenWords(), 0).map((words, i) => {
    const offset = words[0].startMs - 200; // each file starts 200 ms before its first word
    return {
      lineId: script.lines[i].id,
      src: `vo/${script.lines[i].id}.mp3`,
      durMs: durs[i],
      heard: words.map((w) => ({ ...w, startMs: w.startMs - offset, endMs: w.endMs - offset })),
    };
  });
  const timeline = buildTimeline({ script, seri, vo: { mode: "perLine", files } });

  it("stacks files with a 450 ms gap", () => {
    expect(() => TimelineSchema.parse(timeline)).not.toThrow();
    expect(timeline.voOffsetMs).toBe(0);
    expect(timeline.lines.map((l) => l.startMs)).toEqual([0, 3512, 6623]);
    expect(timeline.lines.map((l) => l.durMs)).toEqual([3512, 3111, 2708]);
    expect(timeline.durationMs).toBe(6623 + 2708 + 2500);
    expect(timeline.vo).toEqual({
      mode: "perLine",
      files: [
        { lineId: "01", src: "vo/01.mp3", startMs: 0 },
        { lineId: "02", src: "vo/02.mp3", startMs: 3512 },
        { lineId: "03", src: "vo/03.mp3", startMs: 6623 },
      ],
    });
  });

  it("offsets word times by the line start", () => {
    expect(timeline.lines[0].words[0].startMs).toBe(200);
    expect(timeline.lines[1].words[0]).toMatchObject({ text: "Tenang.", startMs: 3712, endMs: 4012 });
    expect(timeline.lines[2].words[0].startMs).toBe(6823);
  });

  it("throws low-match with the line id when one file misses words", () => {
    const broken = files.map((f) =>
      f.lineId === "02" ? { ...f, heard: f.heard.filter((w) => w.text !== "dulu") } : f,
    );
    const err = catchAlign(() =>
      buildTimeline({ script, seri, vo: { mode: "perLine", files: broken } }),
    );
    expect(err.kind).toBe("low-match");
    expect(err.lineId).toBe("02");
  });
});
