import { effectiveTailMs } from "../../../brand/jokoding/seri";
import type { Seri } from "../brand/types";
import type { Diff, HeardWord, Pause, Script, ScriptLine, Timeline, TimedWord } from "../schema";
import { alignTokens, expandHeard } from "./align";
import { normalizeWord, stripTags, tokenize } from "./normalize";

export const MIN_MATCH = 0.85;
export const PER_LINE_GAP_MS = 450;
export const PAUSE_MIN_MS = 350;
export const LEAD_MS = 150;
/** Time the last line stays on screen after its last word (single mode). */
const LAST_LINE_HOLD_MS = 300;

export type BuildInput = {
  script: Script;
  seri: Seri;
  vo:
    | { mode: "single"; src: string; heard: HeardWord[] }
    | {
        mode: "perLine";
        files: { lineId: string; src: string; durMs: number; heard: HeardWord[] }[];
      };
};

type AlignErrorKind = "low-match" | "ambiguous-line";

export class AlignError extends Error {
  kind: AlignErrorKind;
  lineId?: string;
  ratio: number;
  diffs: Diff[];
  constructor(kind: AlignErrorKind, opts: { lineId?: string; ratio: number; diffs: Diff[] }) {
    super(alignErrorMessage(kind, opts.lineId, opts.ratio));
    this.name = "AlignError";
    this.kind = kind;
    this.lineId = opts.lineId;
    this.ratio = opts.ratio;
    this.diffs = opts.diffs;
  }
}

function alignErrorMessage(kind: AlignErrorKind, lineId: string | undefined, ratio: number): string {
  if (kind === "ambiguous-line") {
    return `Baris ${lineId} sama sekali tidak cocok dengan audio (0 kata cocok)`;
  }
  const where = lineId === undefined ? "total" : `baris ${lineId}`;
  // Floor so a ratio just under the minimum never prints as the minimum itself.
  const pct = (r: number) => Math.floor(r * 100);
  return `Kecocokan ${where} hanya ${pct(ratio)}% (minimal ${pct(MIN_MATCH)}%)`;
}

/** One line's alignment result, with times in the heard audio's own clock. */
type LineAlignment = {
  words: TimedWord[];
  diffs: Diff[];
  matched: number;
  expected: number;
};

type CaptionWordAcc = {
  display: string;
  keyword: boolean;
  /** Index of the first alignment pair that touches this word; orders words and diffs. */
  pos: number;
  startMs: number;
  endMs: number;
  heard: string[];
  changed: boolean;
};

type InsertedAcc = {
  line: number;
  pos: number;
  lastPos: number;
  origin: number;
  text: string;
  startMs: number;
  endMs: number;
};

/**
 * Aligns heard words against the expected units of `lines` in one pass.
 * Inserted heard units attach to the line of the nearest preceding expected unit.
 */
function alignLines(lines: ScriptLine[], heard: HeardWord[]): LineAlignment[] {
  const words: CaptionWordAcc[][] = [];
  const units: { line: number; word: number; text: string }[] = [];
  lines.forEach((line, li) => {
    const keywords = new Set(line.keywords.map(normalizeWord));
    const tokens = tokenize(line.caption ?? stripTags(line.spoken));
    words.push(
      tokens.map((t, wi) => {
        for (const text of t.spoken) units.push({ line: li, word: wi, text });
        return {
          display: t.display,
          keyword: keywords.has(normalizeWord(t.display)),
          pos: -1,
          startMs: Infinity,
          endMs: -Infinity,
          heard: [],
          changed: false,
        };
      }),
    );
  });

  const heardUnits = expandHeard(heard);
  // Index of the original heard word each expanded unit came from.
  const origin = heard.flatMap((w, i) => expandHeard([w]).map(() => i));
  const pairs = alignTokens(
    units.map((u) => u.text),
    heard,
  );

  const matched = lines.map(() => 0);
  const inserted: InsertedAcc[] = [];
  let currentLine = 0;
  pairs.forEach((p, pos) => {
    if (p.e !== null) {
      const u = units[p.e];
      currentLine = u.line;
      const w = words[u.line][u.word];
      if (w.pos < 0) w.pos = pos;
      if (p.kind === "match") matched[u.line]++;
      if (p.h !== null) {
        const h = heardUnits[p.h];
        w.startMs = Math.min(w.startMs, h.startMs);
        w.endMs = Math.max(w.endMs, h.endMs);
        w.heard.push(h.text);
        if (p.kind === "changed") w.changed = true;
      }
      return;
    }
    if (p.h === null) return;
    const h = heardUnits[p.h];
    const prev = inserted.at(-1);
    if (prev && prev.lastPos === pos - 1 && prev.origin === origin[p.h]) {
      prev.lastPos = pos;
      prev.text = heard[origin[p.h]].text.trim();
      prev.endMs = h.endMs;
      return;
    }
    inserted.push({
      line: currentLine,
      pos,
      lastPos: pos,
      origin: origin[p.h],
      text: h.text,
      startMs: h.startMs,
      endMs: h.endMs,
    });
  });

  return lines.map((line, li) => {
    const entries: { pos: number; word?: TimedWord; diff?: Diff }[] = [];
    for (const w of words[li]) {
      if (w.pos < 0) continue; // no spoken units (punctuation only)
      if (w.heard.length === 0) {
        entries.push({ pos: w.pos, diff: { line: line.id, kind: "missing", expected: w.display } });
        continue;
      }
      entries.push({
        pos: w.pos,
        word: {
          text: w.display,
          startMs: w.startMs,
          endMs: w.endMs,
          keyword: w.keyword,
          inserted: false,
        },
        diff: w.changed
          ? { line: line.id, kind: "changed", expected: w.display, heard: w.heard.join(" ") }
          : undefined,
      });
    }
    for (const ins of inserted.filter((x) => x.line === li)) {
      entries.push({
        pos: ins.pos,
        word: { text: ins.text, startMs: ins.startMs, endMs: ins.endMs, keyword: false, inserted: true },
        diff: { line: line.id, kind: "inserted", heard: ins.text },
      });
    }
    entries.sort((a, b) => a.pos - b.pos);
    return {
      words: entries.flatMap((e) => (e.word ? [e.word] : [])),
      diffs: entries.flatMap((e) => (e.diff ? [e.diff] : [])),
      matched: matched[li],
      expected: units.filter((u) => u.line === li).length,
    };
  });
}

function shiftWords(words: TimedWord[], deltaMs: number): TimedWord[] {
  return words.map((w) => ({
    ...w,
    startMs: Math.round(w.startMs + deltaMs),
    endMs: Math.round(w.endMs + deltaMs),
  }));
}

function findPauses(words: TimedWord[]): Pause[] {
  const pauses: Pause[] = [];
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].startMs - words[i - 1].endMs;
    if (gap >= PAUSE_MIN_MS) pauses.push({ atMs: words[i - 1].endMs, durMs: gap });
  }
  return pauses;
}

/** Throws AlignError("low-match") when the total, then any line, falls below MIN_MATCH. */
function checkMatch(lines: ScriptLine[], aligned: LineAlignment[]): void {
  const diffs = aligned.flatMap((a) => a.diffs);
  const sum = (f: (a: LineAlignment) => number) => aligned.reduce((s, a) => s + f(a), 0);
  const total = sum((a) => a.matched) / sum((a) => a.expected);
  if (total < MIN_MATCH) throw new AlignError("low-match", { ratio: total, diffs });
  aligned.forEach((a, i) => {
    const ratio = a.matched / a.expected;
    if (ratio < MIN_MATCH) {
      throw new AlignError("low-match", { lineId: lines[i].id, ratio, diffs });
    }
  });
}

type LineTiming = { startMs: number; durMs: number; words: TimedWord[] };

function timeSingle(aligned: LineAlignment[]): { voOffsetMs: number; lines: LineTiming[] } {
  const firstWordStart = Math.min(...aligned.flatMap((a) => a.words.map((w) => w.startMs)));
  const voOffsetMs = Math.round(Math.max(0, firstWordStart - LEAD_MS));
  const shifted = aligned.map((a) => shiftWords(a.words, -voOffsetMs));
  const starts = shifted.map((words, i) =>
    i === 0 ? 0 : Math.round((shifted[i - 1].at(-1)!.endMs + words[0].startMs) / 2),
  );
  const lines = shifted.map((words, i) => {
    const end = i < shifted.length - 1 ? starts[i + 1] : words.at(-1)!.endMs + LAST_LINE_HOLD_MS;
    return { startMs: starts[i], durMs: end - starts[i], words };
  });
  return { voOffsetMs, lines };
}

export function buildTimeline(input: BuildInput): Timeline {
  const { script, seri, vo } = input;
  let aligned: LineAlignment[];
  let lines: LineTiming[];
  let voOffsetMs = 0;
  let voSource: Timeline["vo"];

  if (vo.mode === "single") {
    aligned = alignLines(script.lines, vo.heard);
    const diffs = aligned.flatMap((a) => a.diffs);
    aligned.forEach((a, i) => {
      if (a.matched === 0) {
        throw new AlignError("ambiguous-line", { lineId: script.lines[i].id, ratio: 0, diffs });
      }
    });
    checkMatch(script.lines, aligned);
    const timed = timeSingle(aligned);
    voOffsetMs = timed.voOffsetMs;
    lines = timed.lines;
    voSource = { mode: "single", src: vo.src };
  } else {
    const files = script.lines.map((line) => {
      const file = vo.files.find((f) => f.lineId === line.id);
      if (!file) throw new Error(`File VO untuk baris ${line.id} tidak ada`);
      return file;
    });
    aligned = script.lines.map((line, i) => alignLines([line], files[i].heard)[0]);
    checkMatch(script.lines, aligned);
    let startMs = 0;
    lines = files.map((file, i) => {
      const isLast = i === files.length - 1;
      const timing = {
        startMs,
        durMs: Math.round(file.durMs + (isLast ? 0 : PER_LINE_GAP_MS)),
        words: shiftWords(aligned[i].words, startMs),
      };
      startMs += timing.durMs;
      return timing;
    });
    voSource = {
      mode: "perLine",
      files: files.map((f, i) => ({ lineId: f.lineId, src: f.src, startMs: lines[i].startMs })),
    };
  }

  const tailMs = effectiveTailMs(seri, script);
  const last = lines[lines.length - 1];
  return {
    slug: script.slug,
    seri: script.seri,
    title: script.title,
    cta: script.cta ?? seri.cta,
    fps: 60,
    durationMs: last.startMs + last.durMs + tailMs,
    tailMs,
    voOffsetMs,
    vo: voSource,
    lines: script.lines.map((line, i) => ({
      id: line.id,
      speaker: line.speaker,
      tag: line.tag,
      startMs: lines[i].startMs,
      durMs: lines[i].durMs,
      words: lines[i].words,
      pauses: findPauses(lines[i].words),
    })),
    music: null,
    diffs: aligned.flatMap((a) => a.diffs),
  };
}
