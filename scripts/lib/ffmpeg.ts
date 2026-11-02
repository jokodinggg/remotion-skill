import { execFile } from "node:child_process";

const FFMPEG = "/opt/homebrew/bin/ffmpeg";
const FFPROBE = "/opt/homebrew/bin/ffprobe";

function run(bin: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        const tail = stderr.split("\n").slice(-15).join("\n");
        reject(new Error(`${bin} gagal: ${err.message}\n${tail}`));
        return;
      }
      resolve(stdout);
    });
  });
}

/** Converts any audio to 16 kHz mono 16-bit PCM wav (whisper.cpp input). */
export async function toWav16k(input: string, output: string): Promise<void> {
  await run(FFMPEG, ["-y", "-i", input, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", output]);
}

/** Single-pass loudness normalisation to -16 LUFS, written as mp3 192k. */
export async function loudnorm(input: string, output: string): Promise<void> {
  await run(FFMPEG, [
    "-y", "-i", input,
    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
    "-c:a", "libmp3lame", "-b:a", "192k",
    output,
  ]);
}

/** Re-encodes any audio to mp3 192k without changing loudness. */
export async function toMp3(input: string, output: string): Promise<void> {
  await run(FFMPEG, ["-y", "-i", input, "-vn", "-c:a", "libmp3lame", "-b:a", "192k", output]);
}

export async function probeDurationMs(file: string): Promise<number> {
  const out = await run(FFPROBE, [
    "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file,
  ]);
  const sec = Number.parseFloat(out.trim());
  if (!Number.isFinite(sec)) throw new Error(`Durasi tidak terbaca: ${file}`);
  return Math.round(sec * 1000);
}
