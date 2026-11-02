import type { Pause, TimedWord, Timeline, TimelineLine } from "../fondasi/schema";

/**
 * Static sample timeline for ArchetypeGallery: one Baris VO per archetype,
 * laid out the way buildTimeline does for a single VO file (first line starts
 * at 0, later lines start halfway through the gap, the last line holds 300 ms).
 * Word times are absolute ms. The copy is written so each archetype's main
 * beats land before its line midpoint, which is the frame the gallery freezes.
 */

/** [text, durMs, keyword?, pauseAfterMs?] */
type W = [string, number, boolean?, number?];
type Spec = { id: string; speaker: string; tag: string; words: W[] };

const LEAD_MS = 150;
const WORD_GAP_MS = 60;
const LINE_GAP_MS = 500;
const LAST_LINE_HOLD_MS = 300;
const PAUSE_MIN_MS = 350;
const TAIL_MS = 3000;

const SPECS: Spec[] = [
  {
    id: "01",
    speaker: "narator",
    tag: "panicked",
    words: [["Skripsi", 380], ["mentok,", 420, false, 250], ["deadline", 450, true], ["tinggal", 360], ["3", 300, true], ["hari?", 480]],
  },
  {
    id: "02",
    speaker: "narator",
    tag: "panicked",
    words: [["Revisi", 420], ["numpuk,", 450, true, 200], ["dosen", 380], ["minta", 340], ["besok", 420, true], ["pagi.", 420]],
  },
  {
    id: "03",
    speaker: "narator",
    tag: "curious",
    words: [
      ["Begadang", 450, true],
      ["sendirian,", 500, false, 150],
      ["atau", 260],
      ["konsultasi", 560, true],
      ["bareng", 340],
      ["mentor", 420],
      ["jokoding?", 560],
    ],
  },
  {
    id: "04",
    speaker: "narator",
    tag: "excited",
    words: [["Hasilnya,", 520, false, 200], ["92%", 1100, true], ["tugas", 340], ["kelar", 360], ["sebelum", 400], ["deadline!", 520, true]],
  },
  {
    id: "05",
    speaker: "narator",
    tag: "happy",
    words: [
      ["Chat", 300, true],
      ["admin,", 380],
      ["diskusi,", 480, true],
      ["beres.", 420, true, 300],
      ["Gampang", 400],
      ["banget", 380],
      ["kan?", 380],
    ],
  },
  {
    id: "06",
    speaker: "joks",
    tag: "excited",
    words: [
      ["Tenang,", 480, false, 200],
      ["mentor", 380],
      ["jokoding", 520, true],
      ["bantu", 340],
      ["sampai", 360],
      ["kamu", 280],
      ["paham!", 520, true],
    ],
  },
  {
    id: "07",
    speaker: "narator",
    tag: "curious",
    words: [
      ["Perintah,", 450, true],
      ["agent,", 400, true],
      ["tools,", 400, true],
      ["hasil.", 450, true, 300],
      ["Itu", 220],
      ["alur", 300],
      ["AI", 260],
      ["agent.", 420],
    ],
  },
];

function timeWords(spec: Spec, fromMs: number): TimedWord[] {
  let t = fromMs;
  return spec.words.map(([text, dur, keyword = false, pauseAfter = 0]) => {
    const word: TimedWord = { text, startMs: t, endMs: t + dur, keyword, inserted: false };
    t += dur + WORD_GAP_MS + pauseAfter;
    return word;
  });
}

function pausesOf(words: TimedWord[]): Pause[] {
  const out: Pause[] = [];
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].startMs - words[i - 1].endMs;
    if (gap >= PAUSE_MIN_MS) out.push({ atMs: words[i - 1].endMs, durMs: gap });
  }
  return out;
}

function build(): Timeline {
  const timed: TimedWord[][] = [];
  let cursor = LEAD_MS;
  for (const spec of SPECS) {
    const words = timeWords(spec, cursor);
    timed.push(words);
    cursor = words[words.length - 1].endMs + LINE_GAP_MS;
  }
  const starts = timed.map((words, i) =>
    i === 0 ? 0 : Math.round((timed[i - 1][timed[i - 1].length - 1].endMs + words[0].startMs) / 2),
  );
  const lines: TimelineLine[] = SPECS.map((spec, i) => {
    const words = timed[i];
    const end = i < SPECS.length - 1 ? starts[i + 1] : words[words.length - 1].endMs + LAST_LINE_HOLD_MS;
    return { id: spec.id, speaker: spec.speaker, tag: spec.tag, startMs: starts[i], durMs: end - starts[i], words, pauses: pausesOf(words) };
  });
  const last = lines[lines.length - 1];
  return {
    slug: "arketipe-contoh",
    seri: "joki-cepat",
    title: "Contoh arketipe",
    cta: true,
    fps: 60,
    durationMs: last.startMs + last.durMs + TAIL_MS,
    tailMs: TAIL_MS,
    voOffsetMs: 0,
    vo: { mode: "single", src: "vo.mp3" },
    lines,
    music: null,
    diffs: [],
  };
}

export const sampleTimeline: Timeline = build();

/** Archetype rendered for each sample line (gallery order). */
export const SAMPLE_LINE = {
  hook: "01",
  masalah: "02",
  perbandingan: "03",
  angka: "04",
  langkah: "05",
  joksSolusi: "06",
  diagram: "07",
} as const;
