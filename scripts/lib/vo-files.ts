import { extname } from "node:path";

export const AUDIO_EXTS = [".mp3", ".wav", ".m4a"];

export class VoFormatError extends Error {
  expected: string[];
  constructor(message: string, expected: string[]) {
    super(message);
    this.name = "VoFormatError";
    this.expected = expected;
  }
}

export type VoFormat =
  | { mode: "single"; file: string }
  | { mode: "perLine"; files: Record<string, string> };

/**
 * Decides whether vo/ holds one whole file (`vo.*`) or one file per line (`NN.*`).
 * `files` are bare names inside vo/; hidden and non-audio files are ignored.
 */
export function detectVoFormat(files: string[], lineIds: string[]): VoFormat {
  const all = ["vo/vo.mp3", ...lineIds.map((id) => `vo/${id}.mp3`)];
  const slots = new Map<string, string[]>();
  for (const file of files) {
    if (file.startsWith(".")) continue;
    const ext = extname(file).toLowerCase();
    if (!AUDIO_EXTS.includes(ext)) continue;
    const name = file.slice(0, -ext.length);
    if (name !== "vo" && !lineIds.includes(name)) {
      throw new VoFormatError(`File audio tidak dikenal di vo/: ${file}`, all);
    }
    slots.set(name, [...(slots.get(name) ?? []), file]);
  }

  for (const [name, found] of slots) {
    if (found.length > 1) {
      throw new VoFormatError(
        `Ada lebih dari satu file untuk "${name}" di vo/: ${found.join(", ")}. Sisakan satu.`,
        all,
      );
    }
  }

  const single = slots.get("vo")?.[0];
  const perLine = lineIds.filter((id) => slots.has(id));
  if (single && perLine.length > 0) {
    throw new VoFormatError(
      "Format audio campuran: vo/vo.* dan file per baris. Pilih salah satu.",
      all,
    );
  }
  if (single) return { mode: "single", file: single };
  if (perLine.length === 0) {
    throw new VoFormatError("Audio tidak ditemukan di vo/.", all);
  }
  const missing = lineIds.filter((id) => !slots.has(id));
  if (missing.length > 0) {
    throw new VoFormatError(
      `File per baris belum lengkap, kurang baris ${missing.join(", ")}.`,
      missing.map((id) => `vo/${id}.mp3`),
    );
  }
  return {
    mode: "perLine",
    files: Object.fromEntries(lineIds.map((id) => [id, slots.get(id)![0]])),
  };
}
