import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";
import { getWhisperExecutablePath } from "@remotion/install-whisper-cpp/dist/install-whisper-cpp";
import type { HeardWord } from "../../src/fondasi/schema";
import { toWav16k } from "./ffmpeg";

export const WHISPER_DIR = `${homedir()}/Library/Caches/jokoding-whisper`;
export const WHISPER_VERSION = "1.7.4";
export const WHISPER_MODEL = "large-v3-turbo";

function cppExecutable(): string {
  return getWhisperExecutablePath(WHISPER_DIR, WHISPER_VERSION);
}

function cppModelFile(): string {
  return join(WHISPER_DIR, `ggml-${WHISPER_MODEL}.bin`);
}

/** True when the whisper.cpp binary and the model are both installed. */
function cppReady(): boolean {
  return existsSync(cppExecutable()) && existsSync(cppModelFile());
}

function hasCmake(): boolean {
  try {
    execFileSync("cmake", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function downloadWebGpuModel(): Promise<void> {
  const { downloadWhisperModel: downloadWebGpu } = await import("@remotion/whisper-webgpu");
  await downloadWebGpu({ model: WHISPER_MODEL });
}

/**
 * Prepares transcription. Prefers whisper.cpp; when cmake is missing or the build
 * fails, downloads the whisper-webgpu model instead (see ADR 0005).
 */
export async function ensureWhisper(): Promise<void> {
  let cppError: string | null = null;
  if (!hasCmake() && !existsSync(cppExecutable())) {
    console.log("cmake tidak ditemukan — memakai whisper-webgpu. Untuk whisper.cpp: brew install cmake");
    cppError = "cmake tidak ditemukan";
  } else {
    try {
      await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION, printOutput: true });
      await downloadWhisperModel({ model: WHISPER_MODEL, folder: WHISPER_DIR, printOutput: true });
    } catch (e) {
      cppError = e instanceof Error ? e.message : String(e);
      console.log(`Build whisper.cpp gagal (${cppError}) — memakai whisper-webgpu.`);
    }
  }
  if (cppError !== null) {
    // Only our own cache dir, and only a clone without a working executable.
    if (existsSync(WHISPER_DIR) && !existsSync(cppExecutable())) {
      await rm(WHISPER_DIR, { recursive: true, force: true });
    }
    await downloadWebGpuModel();
  }
}

async function transcribeWithCpp(file: string): Promise<HeardWord[]> {
  const dir = await mkdtemp(join(tmpdir(), "jokoding-whisper-"));
  try {
    const wav = join(dir, "input.wav");
    await toWav16k(file, wav);
    const output = await transcribe({
      inputPath: wav,
      whisperPath: WHISPER_DIR,
      whisperCppVersion: WHISPER_VERSION,
      model: WHISPER_MODEL,
      modelFolder: WHISPER_DIR,
      tokenLevelTimestamps: true,
      language: "id",
      splitOnWord: true,
    });
    const { captions } = toCaptions({ whisperCppOutput: output });
    return captions.map((c) => ({ text: c.text, startMs: c.startMs, endMs: c.endMs }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Decodes any audio file to a mono f32 waveform at the whisper-webgpu sample rate. */
async function decodeMonoF32(file: string, sampleRate: number): Promise<Float32Array> {
  const { ALL_FORMATS, Conversion, FilePathSource, Input, NullTarget, Output, WavOutputFormat } =
    await import("mediabunny");
  const chunks: { start: number; samples: Float32Array }[] = [];
  const input = new Input({ formats: ALL_FORMATS, source: new FilePathSource(file) });
  const track = await input.getPrimaryAudioTrack();
  if (!track) throw new Error(`Tidak ada audio di ${file}`);
  const conversion = await Conversion.init({
    input,
    output: new Output({ format: new WavOutputFormat(), target: new NullTarget() }),
    video: { discard: true },
    audio: (t) =>
      t.id !== track.id
        ? { discard: true }
        : {
            codec: "pcm-f32",
            forceTranscode: true,
            numberOfChannels: 1,
            sampleFormat: "f32",
            sampleRate,
            process: (s) => {
              const samples = new Float32Array(s.allocationSize({ format: "f32", planeIndex: 0 }) / 4);
              s.copyTo(samples, { format: "f32", planeIndex: 0 });
              chunks.push({ start: Math.round(s.timestamp * sampleRate), samples });
              return s;
            },
          },
  });
  await conversion.execute();
  const length = chunks.reduce((m, c) => Math.max(m, c.start + c.samples.length), 0);
  const out = new Float32Array(length);
  for (const c of chunks) {
    const start = Math.max(0, c.start);
    out.set(c.samples.subarray(0, Math.min(c.samples.length, length - start)), start);
  }
  return out;
}

async function transcribeWithWebGpu(file: string): Promise<HeardWord[]> {
  const { registerMediabunnyServer } = await import("@mediabunny/server");
  const { canUseWhisperWebGpu, transcribe: transcribeWebGpu, WHISPER_WEBGPU_SAMPLE_RATE } =
    await import("@remotion/whisper-webgpu");
  registerMediabunnyServer();
  const support = await canUseWhisperWebGpu();
  if (!support.supported) {
    throw new Error(`whisper-webgpu tidak tersedia: ${JSON.stringify(support)}`);
  }
  const waveform = await decodeMonoF32(file, WHISPER_WEBGPU_SAMPLE_RATE);
  const result = await transcribeWebGpu({
    channelWaveform: waveform,
    model: WHISPER_MODEL,
    language: "indonesian",
  });
  return result.words.map((w) => ({
    text: w.text,
    startMs: Math.round(w.startInSeconds * 1000),
    endMs: Math.round(w.endInSeconds * 1000),
  }));
}

/**
 * Transcribes an audio file to word-level timestamps (Indonesian). Uses whisper.cpp
 * when installed, otherwise whisper-webgpu.
 */
export async function transcribeAudio(file: string): Promise<HeardWord[]> {
  const words = cppReady() ? await transcribeWithCpp(file) : await transcribeWithWebGpu(file);
  return words
    .map((w) => ({ ...w, text: w.text.trim() }))
    .filter((w) => w.text !== "");
}
