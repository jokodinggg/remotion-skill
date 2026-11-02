import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { extname, join, parse } from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { getSeri } from "../brand/jokoding/seri";
import {
  HeardWordSchema,
  ScriptSchema,
  TimelineSchema,
  type Diff,
  type HeardWord,
  type Script,
  type Timeline,
} from "../src/fondasi/schema";
import { AlignError, buildTimeline, type BuildInput } from "../src/fondasi/timeline/build";
import { loudnorm, probeDurationMs, toMp3 } from "./lib/ffmpeg";
import { fileHash } from "./lib/hash";
import { pickMusic, type MusicMeta } from "./lib/music";
import { writeRegistry } from "./lib/registry";
import { AUDIO_EXTS, VoFormatError, detectVoFormat } from "./lib/vo-files";
import { ensureWhisper, transcribeAudio } from "./lib/whisper";

export type PrepareReport = {
  slug: string;
  durationMs: number;
  seriRange: [number, number];
  warnings: string[];
  diffs: Diff[];
  /** Where the music came from (path relative to root), or null when there is none. */
  music: string | null;
};

type Deps = { transcribe?: typeof transcribeAudio };

const TranscriptSchema = z.record(
  z.string(),
  z.object({ hash: z.string(), words: z.array(HeardWordSchema) }),
);
type Transcript = z.infer<typeof TranscriptSchema>;

const SCENES_SKELETON = [
  'import type React from "react";',
  "",
  'export const background = "light";',
  "export const Scenes: React.FC = () => null;",
  "",
].join("\n");

function readTranscript(file: string): Transcript {
  if (!existsSync(file)) return {};
  try {
    const parsed = TranscriptSchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

/** Heard words per audio file, reusing cached entries whose hash still matches. */
async function transcribeAll(
  voDir: string,
  files: string[],
  cacheFile: string,
  transcribe: typeof transcribeAudio,
): Promise<Record<string, HeardWord[]>> {
  const cached = readTranscript(cacheFile);
  const next: Transcript = {};
  for (const file of files) {
    const hash = await fileHash(join(voDir, file));
    const hit = cached[file];
    next[file] = hit && hit.hash === hash ? hit : { hash, words: await transcribe(join(voDir, file)) };
  }
  writeFileSync(cacheFile, JSON.stringify(next, null, 2) + "\n");
  return Object.fromEntries(files.map((f) => [f, next[f].words]));
}

/** Copies an mp3 as is; re-encodes anything else to mp3. */
async function installMp3(input: string, output: string): Promise<void> {
  if (extname(input).toLowerCase() === ".mp3") copyFileSync(input, output);
  else await toMp3(input, output);
}

function readLibrary(root: string): MusicMeta[] {
  const file = join(root, "public", "library", "music", "meta.json");
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as MusicMeta[]) : [];
}

/** Installs music to public/videos/<slug>/music.mp3; returns its source (relative to root) or null. */
async function installMusic(root: string, script: Script, mood: string): Promise<string | null> {
  const slug = script.slug;
  const dest = join(root, "public", "videos", slug, "music.mp3");
  const ownerExt = AUDIO_EXTS.find((ext) => existsSync(join(root, "videos", slug, `music${ext}`)));
  let source: string | null = null;
  if (ownerExt) {
    source = `videos/${slug}/music${ownerExt}`;
  } else {
    const pick = pickMusic(readLibrary(root), mood, script.music.bpm);
    if (pick) source = `public/library/music/${pick.file}`;
  }
  if (source === null) {
    rmSync(dest, { force: true });
    return null;
  }
  await installMp3(join(root, source), dest);
  return source;
}

/** Transcribes the owner's VO, builds timeline.json, normalizes audio and refreshes the registry. */
export async function runPrepare(slug: string, root: string, deps: Deps = {}): Promise<PrepareReport> {
  const transcribe = deps.transcribe ?? transcribeAudio;
  const dir = join(root, "videos", slug);
  const script = ScriptSchema.parse(JSON.parse(readFileSync(join(dir, "script.json"), "utf8")));
  const seri = getSeri(script.seri);

  const voDir = join(dir, "vo");
  const lineIds = script.lines.map((l) => l.id);
  const format = detectVoFormat(existsSync(voDir) ? readdirSync(voDir) : [], lineIds);
  const files = format.mode === "single" ? [format.file] : lineIds.map((id) => format.files[id]);
  const heard = await transcribeAll(voDir, files, join(dir, "transcript.json"), transcribe);

  const publicSrc = (file: string) => `videos/${slug}/vo/${parse(file).name}.mp3`;
  let vo: BuildInput["vo"];
  if (format.mode === "single") {
    vo = { mode: "single", src: publicSrc(format.file), heard: heard[format.file] };
  } else {
    const perLine = [];
    for (const lineId of lineIds) {
      const file = format.files[lineId];
      const durMs = await probeDurationMs(join(voDir, file));
      perLine.push({ lineId, src: publicSrc(file), durMs, heard: heard[file] });
    }
    vo = { mode: "perLine", files: perLine };
  }
  const built = buildTimeline({ script, seri, vo });

  const publicVo = join(root, "public", "videos", slug, "vo");
  rmSync(publicVo, { recursive: true, force: true });
  mkdirSync(publicVo, { recursive: true });
  for (const file of files) await loudnorm(join(voDir, file), join(root, "public", publicSrc(file)));

  const warnings: string[] = [];
  const mood = script.music.mood || seri.musicMood;
  const musicSource = await installMusic(root, script, mood);
  let music: Timeline["music"] = null;
  if (musicSource === null) {
    warnings.push(`Tanpa musik: library kosong untuk mood ${mood}. Prompt: ${script.music.prompt}`);
  } else {
    const src = `videos/${slug}/music.mp3`;
    const durationMs = await probeDurationMs(join(root, "public", src));
    music = { src, loop: durationMs < built.durationMs, durationMs };
  }

  const timeline = TimelineSchema.parse({ ...built, music });
  writeFileSync(join(dir, "timeline.json"), JSON.stringify(timeline, null, 2) + "\n");

  const scenesFile = join(dir, "Scenes.tsx");
  if (!existsSync(scenesFile)) writeFileSync(scenesFile, SCENES_SKELETON);

  writeRegistry(root);

  const [min, max] = seri.durationRange;
  const seconds = timeline.durationMs / 1000;
  if (seconds < min || seconds > max) {
    warnings.push(`Durasi ${seconds.toFixed(1)}s di luar rentang Seri ${min}–${max}s`);
  }

  return {
    slug,
    durationMs: timeline.durationMs,
    seriRange: [min, max],
    warnings,
    diffs: timeline.diffs,
    music: musicSource,
  };
}

function formatDiff(d: Diff): string {
  return `  baris ${d.line}: ${d.kind} "${d.expected ?? ""}" → "${d.heard ?? ""}"`;
}

function printReport(r: PrepareReport): void {
  console.log(`timeline.json siap: videos/${r.slug}/timeline.json`);
  console.log(
    `Durasi: ${(r.durationMs / 1000).toFixed(1)} detik (rentang Seri ${r.seriRange[0]}–${r.seriRange[1]} detik)`,
  );
  console.log(`Musik: ${r.music ?? "tidak ada"}`);
  if (r.diffs.length === 0) {
    console.log("Perbedaan audio vs naskah: tidak ada");
  } else {
    console.log("Perbedaan audio vs naskah:");
    for (const d of r.diffs) console.log(formatDiff(d));
  }
  if (r.warnings.length > 0) {
    console.log("Peringatan:");
    for (const w of r.warnings) console.log(`  - ${w}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Pemakaian: npx tsx scripts/prepare.ts <slug>");
    process.exit(1);
  }
  let whisperReady = false;
  const transcribe: typeof transcribeAudio = async (file) => {
    if (!whisperReady) {
      await ensureWhisper();
      whisperReady = true;
    }
    return transcribeAudio(file);
  };
  try {
    printReport(await runPrepare(slug, process.cwd(), { transcribe }));
  } catch (e) {
    if (e instanceof AlignError) {
      console.error(e.message);
      for (const d of e.diffs) console.error(formatDiff(d));
    } else if (e instanceof VoFormatError) {
      console.error(e.message);
      console.error("File yang diharapkan (.mp3, .wav, atau .m4a; vo.* utuh ATAU NN.* per baris):");
      for (const name of e.expected) console.error(`  videos/${slug}/${name}`);
    } else if (e instanceof z.ZodError) {
      console.error(`script.json tidak valid:\n${z.prettifyError(e)}`);
    } else {
      console.error(e instanceof Error ? e.message : String(e));
    }
    process.exit(1);
  }
}
