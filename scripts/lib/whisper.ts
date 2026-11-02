import { mkdtemp, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";
import type { HeardWord } from "../../src/fondasi/schema";
import { toWav16k } from "./ffmpeg";

export const WHISPER_DIR = `${homedir()}/Library/Caches/jokoding-whisper`;
export const WHISPER_VERSION = "1.7.4";
export const WHISPER_MODEL = "large-v3-turbo";

/** Installs whisper.cpp and the model into WHISPER_DIR (no-op when present). */
export async function ensureWhisper(): Promise<void> {
  await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION, printOutput: true });
  await downloadWhisperModel({ model: WHISPER_MODEL, folder: WHISPER_DIR, printOutput: true });
}

/** Transcribes an audio file to word-level timestamps (Indonesian). */
export async function transcribeAudio(file: string): Promise<HeardWord[]> {
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
    return captions
      .map((c) => ({ text: c.text.trim(), startMs: c.startMs, endMs: c.endMs }))
      .filter((w) => w.text !== "");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
