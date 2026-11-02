import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import deadline from "../fixtures/scripts/deadline.json";
import { TimelineSchema, type HeardWord } from "../../src/fondasi/schema";
import { stripTags } from "../../src/fondasi/timeline/normalize";
import { AlignError } from "../../src/fondasi/timeline/build";
import { VoFormatError } from "../../scripts/lib/vo-files";
import { runPrepare } from "../../scripts/prepare";

const FFMPEG = "/opt/homebrew/bin/ffmpeg";
const SLUG = "0000-contoh";
const FIXTURE = join(__dirname, "..", "fixtures", "scripts", "deadline.json");

let audio: string; // folder of generated source audio

/**
 * A quiet 220 Hz tone. Not anullsrc: loudnorm on pure digital silence yields
 * non-finite samples and libmp3lame then aborts (psymodel.c assertion), flakily.
 */
function silent(out: string, seconds: number, layout: "mono" | "stereo" = "mono"): void {
  execFileSync(FFMPEG, [
    "-y", "-loglevel", "error",
    "-f", "lavfi", "-i", "sine=frequency=220:sample_rate=44100",
    "-af", "volume=0.05",
    "-ac", layout === "mono" ? "1" : "2",
    "-t", String(seconds),
    out,
  ]);
}

beforeAll(() => {
  audio = mkdtempSync(join(tmpdir(), "prepare-audio-"));
  for (const id of ["01", "02", "03"]) silent(join(audio, `${id}.wav`), 3);
  silent(join(audio, "02-alt.wav"), 2.5);
  silent(join(audio, "vo.m4a"), 9, "stereo");
  silent(join(audio, "music.wav"), 2);
  silent(join(audio, "lib.mp3"), 15);
});

function makeRoot(voFiles: string[]): string {
  const root = mkdtempSync(join(tmpdir(), "prepare-"));
  const dir = join(root, "videos", SLUG);
  mkdirSync(join(dir, "vo"), { recursive: true });
  copyFileSync(FIXTURE, join(dir, "script.json"));
  for (const f of voFiles) copyFileSync(join(audio, f), join(dir, "vo", f));
  return root;
}

const lineWords = deadline.lines.map((l) => stripTags(l.spoken).split(" "));

function timed(words: string[], fromMs: number): HeardWord[] {
  return words.map((text, i) => ({ text, startMs: fromMs + i * 300, endMs: fromMs + i * 300 + 250 }));
}

/** Stub whisper: "NN.*" hears line NN, "vo.*" hears every line in order. */
function stubTranscribe(heard?: (file: string) => HeardWord[]) {
  const calls: string[] = [];
  const transcribe = async (file: string): Promise<HeardWord[]> => {
    calls.push(basename(file));
    if (heard) return heard(file);
    const name = basename(file, extname(file));
    if (name === "vo") return lineWords.flatMap((w, i) => timed(w, 400 + i * 3000));
    return timed(lineWords[Number(name) - 1], 100);
  };
  return { calls, transcribe };
}

function readTimeline(root: string) {
  return TimelineSchema.parse(
    JSON.parse(readFileSync(join(root, "videos", SLUG, "timeline.json"), "utf8")),
  );
}

describe("runPrepare (per-line VO)", () => {
  it("writes a valid timeline, normalized audio, skeleton and registry", async () => {
    const root = makeRoot(["01.wav", "02.wav", "03.wav"]);
    const stub = stubTranscribe();
    const report = await runPrepare(SLUG, root, { transcribe: stub.transcribe });

    const timeline = readTimeline(root);
    expect(timeline.vo).toMatchObject({ mode: "perLine" });
    if (timeline.vo.mode !== "perLine") throw new Error("unreachable");
    expect(timeline.vo.files.map((f) => f.src)).toEqual([
      `videos/${SLUG}/vo/01.mp3`,
      `videos/${SLUG}/vo/02.mp3`,
      `videos/${SLUG}/vo/03.mp3`,
    ]);
    for (const f of timeline.vo.files) expect(existsSync(join(root, "public", f.src))).toBe(true);
    // 3 x 3000 ms + 2 x 450 ms gap + 2500 ms tail
    expect(timeline.durationMs).toBe(12400);
    expect(timeline.music).toBeNull();

    expect(report.slug).toBe(SLUG);
    expect(report.seriRange).toEqual([15, 30]);
    expect(report.durationMs).toBe(12400);
    expect(report.music).toBeNull();
    expect(report.diffs).toEqual([]);
    expect(report.warnings).toEqual([
      `Tanpa musik: library kosong untuk mood tense-to-upbeat. Prompt: ${deadline.music.prompt}`,
      "Durasi 12.4s di luar rentang Seri 15–30s",
    ]);

    expect(stub.calls).toHaveLength(3);
    const scenes = readFileSync(join(root, "videos", SLUG, "Scenes.tsx"), "utf8");
    expect(scenes).toContain('export const background = "light";');
    expect(scenes).toContain("export const Scenes: React.FC = () => null;");
    const registry = readFileSync(join(root, "src", "videos.generated.ts"), "utf8");
    expect(registry).toContain(`import timeline_0 from "../videos/${SLUG}/timeline.json"`);
  });

  it("reuses the transcript cache and re-transcribes only replaced audio", async () => {
    const root = makeRoot(["01.wav", "02.wav", "03.wav"]);
    const cacheFile = join(root, "videos", SLUG, "transcript.json");

    const first = stubTranscribe();
    await runPrepare(SLUG, root, { transcribe: first.transcribe });
    expect(first.calls).toHaveLength(3);

    // A stale entry for a file that no longer exists is dropped.
    const cache = JSON.parse(readFileSync(cacheFile, "utf8"));
    cache["99.wav"] = { hash: "x", words: [] };
    writeFileSync(cacheFile, JSON.stringify(cache));

    const second = stubTranscribe();
    await runPrepare(SLUG, root, { transcribe: second.transcribe });
    expect(second.calls).toHaveLength(0);
    expect(Object.keys(JSON.parse(readFileSync(cacheFile, "utf8"))).sort()).toEqual([
      "01.wav",
      "02.wav",
      "03.wav",
    ]);

    // Owner replaces 02.wav with different audio under the same name.
    copyFileSync(join(audio, "02-alt.wav"), join(root, "videos", SLUG, "vo", "02.wav"));
    const third = stubTranscribe();
    await runPrepare(SLUG, root, { transcribe: third.transcribe });
    expect(third.calls).toEqual(["02.wav"]);
    // 3000 + 2500 + 3000 ms + 2 x 450 ms gap + 2500 ms tail
    expect(readTimeline(root).durationMs).toBe(11900);
  });

  it("keeps an existing Scenes.tsx", async () => {
    const root = makeRoot(["01.wav", "02.wav", "03.wav"]);
    const scenesFile = join(root, "videos", SLUG, "Scenes.tsx");
    writeFileSync(scenesFile, "// owner scenes\n");
    await runPrepare(SLUG, root, { transcribe: stubTranscribe().transcribe });
    expect(readFileSync(scenesFile, "utf8")).toBe("// owner scenes\n");
  });
});

describe("runPrepare (single VO)", () => {
  it("accepts stereo .m4a and normalizes it to public/videos/<slug>/vo/vo.mp3", async () => {
    const root = makeRoot(["vo.m4a"]);
    writeFileSync(join(root, "videos", SLUG, "vo", ".DS_Store"), "junk");
    const stub = stubTranscribe();
    await runPrepare(SLUG, root, { transcribe: stub.transcribe });
    const timeline = readTimeline(root);
    expect(timeline.vo).toEqual({ mode: "single", src: `videos/${SLUG}/vo/vo.mp3` });
    expect(existsSync(join(root, "public", "videos", SLUG, "vo", "vo.mp3"))).toBe(true);
    expect(timeline.voOffsetMs).toBe(250);
    expect(stub.calls).toEqual(["vo.m4a"]);
  });
});

describe("runPrepare (music)", () => {
  it("uses the owner's music file, looping when shorter than the video", async () => {
    const root = makeRoot(["01.wav", "02.wav", "03.wav"]);
    copyFileSync(join(audio, "music.wav"), join(root, "videos", SLUG, "music.wav"));
    const report = await runPrepare(SLUG, root, { transcribe: stubTranscribe().transcribe });
    const { music } = readTimeline(root);
    expect(music?.src).toBe(`videos/${SLUG}/music.mp3`);
    expect(music?.loop).toBe(true);
    expect(music?.durationMs).toBeGreaterThan(1900);
    expect(music?.durationMs).toBeLessThan(2200);
    expect(existsSync(join(root, "public", "videos", SLUG, "music.mp3"))).toBe(true);
    expect(report.music).toBe(`videos/${SLUG}/music.wav`);
    expect(report.warnings.some((w) => w.startsWith("Tanpa musik"))).toBe(false);
  });

  it("picks from the library by mood and BPM when the owner has none", async () => {
    const root = makeRoot(["01.wav", "02.wav", "03.wav"]);
    const lib = join(root, "public", "library", "music");
    mkdirSync(lib, { recursive: true });
    copyFileSync(join(audio, "lib.mp3"), join(lib, "lib.mp3"));
    const entry = {
      file: "lib.mp3", mood: "tense-to-upbeat", bpm: 112, durationMs: 15000,
      prompt: "p", source: "eleven-music", license: "owned",
    };
    writeFileSync(join(lib, "meta.json"), JSON.stringify([entry]));
    const report = await runPrepare(SLUG, root, { transcribe: stubTranscribe().transcribe });
    const { music } = readTimeline(root);
    expect(music?.src).toBe(`videos/${SLUG}/music.mp3`);
    expect(music?.loop).toBe(false);
    expect(report.music).toBe("public/library/music/lib.mp3");
  });
});

describe("runPrepare (errors)", () => {
  it("throws AlignError on a mismatched transcript but keeps the transcript cache", async () => {
    const root = makeRoot(["01.wav", "02.wav", "03.wav"]);
    const stub = stubTranscribe(() => timed(["halo", "apa", "kabar"], 0));
    await expect(runPrepare(SLUG, root, { transcribe: stub.transcribe })).rejects.toBeInstanceOf(
      AlignError,
    );
    expect(existsSync(join(root, "videos", SLUG, "timeline.json"))).toBe(false);
    expect(existsSync(join(root, "videos", SLUG, "transcript.json"))).toBe(true);
  });

  it("throws VoFormatError when vo/ is missing", async () => {
    const root = makeRoot([]);
    rmSync(join(root, "videos", SLUG, "vo"), { recursive: true });
    await expect(runPrepare(SLUG, root, { transcribe: stubTranscribe().transcribe })).rejects.toBeInstanceOf(
      VoFormatError,
    );
  });
});
