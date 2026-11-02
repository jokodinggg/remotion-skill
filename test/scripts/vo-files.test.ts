import { describe, expect, it } from "vitest";
import { VoFormatError, detectVoFormat } from "../../scripts/lib/vo-files";

const ids = ["01", "02"];

function formatError(files: string[], lineIds = ids): VoFormatError {
  try {
    detectVoFormat(files, lineIds);
  } catch (e) {
    if (e instanceof VoFormatError) return e;
    throw e;
  }
  throw new Error("expected VoFormatError");
}

describe("detectVoFormat", () => {
  it("vo.* is a single file; hidden files are ignored", () => {
    expect(detectVoFormat(["vo.m4a", ".DS_Store"], ids)).toEqual({ mode: "single", file: "vo.m4a" });
  });

  it("NN.* for every line is per line, any accepted extension", () => {
    expect(detectVoFormat(["01.mp3", "02.wav"], ids)).toEqual({
      mode: "perLine",
      files: { "01": "01.mp3", "02": "02.wav" },
    });
  });

  it("ignores non-audio files", () => {
    expect(detectVoFormat(["vo.mp3", "notes.txt"], ids)).toEqual({ mode: "single", file: "vo.mp3" });
  });

  it("rejects vo.* alongside NN.*", () => {
    const e = formatError(["vo.mp3", "01.mp3"]);
    expect(e.expected).toEqual(["vo/vo.mp3", "vo/01.mp3", "vo/02.mp3"]);
  });

  it("rejects an incomplete per-line set, naming the missing file", () => {
    const e = formatError(["01.mp3"]);
    expect(e.expected).toContain("vo/02.mp3");
    expect(e.message).toContain("02");
  });

  it("rejects an empty folder, listing both formats", () => {
    const e = formatError([".DS_Store"]);
    expect(e.expected).toEqual(["vo/vo.mp3", "vo/01.mp3", "vo/02.mp3"]);
  });

  it("rejects an audio file with an unknown name", () => {
    const e = formatError(["vo.mp3", "intro.mp3"]);
    expect(e.message).toContain("intro.mp3");
  });

  it("rejects two files for the same slot", () => {
    const e = formatError(["vo.mp3", "vo.wav"]);
    expect(e.message).toContain("vo.mp3");
    expect(e.message).toContain("vo.wav");
  });
});
