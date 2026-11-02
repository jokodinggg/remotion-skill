import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import deadline from "../fixtures/scripts/deadline.json";
import { JOKODING } from "../../brand/jokoding/brand";
import { getSeri } from "../../brand/jokoding/seri";
import { ScriptSchema, type Script } from "../../src/fondasi/schema";
import { UnspeakableTokenError } from "../../src/fondasi/timeline/normalize";
import { estimateDurationMs, renderNaskah } from "../../scripts/lib/naskah";
import { runNaskah } from "../../scripts/naskah";
import { runNewVideo } from "../../scripts/new-video";

const script: Script = ScriptSchema.parse(deadline);

function tmpRoot(): string {
  return mkdtempSync(join(tmpdir(), "naskah-"));
}

function writeScript(root: string, slug: string, s: unknown): void {
  mkdirSync(join(root, "videos", slug), { recursive: true });
  writeFileSync(join(root, "videos", slug, "script.json"), JSON.stringify(s));
}

describe("estimateDurationMs", () => {
  it("words x 380 + (lines-1) x 450, tags ignored", () => {
    // 6 + 5 + 7 words = 18 -> 6840 + 900
    expect(estimateDurationMs(script)).toBe(7740);
  });
});

describe("renderNaskah", () => {
  const out = renderNaskah(script, getSeri(script.seri), JOKODING);

  it("contains the key parts", () => {
    expect(out).toContain("[panicked] Deadline besok... progres masih nol persen?");
    expect(out).toContain("ID belum diset");
    expect(out).toContain("vo/01.mp3 … 03.mp3");
  });

  it("does not double a tag already present", () => {
    const s: Script = {
      ...script,
      lines: [{ ...script.lines[0], spoken: "[whispers] halo" }],
    };
    const r = renderNaskah(s, getSeri(s.seri), JOKODING);
    expect(r).toContain("[whispers] halo");
    expect(r).not.toContain("[panicked] [whispers]");
  });

  it("matches the snapshot", () => {
    expect(out).toMatchInlineSnapshot(`
      "# Naskah: Deadline besok, progres 0%?

      <!-- tempel bagian di bawah ini ke ElevenLabs -->

      [panicked] Deadline besok... progres masih nol persen?

      [calm] Tenang. Konsultasi dulu ke jokoding.

      [excited] Chat aja lewat WhatsApp, link di bio!

      ---

      - Voice: Voice utama (ID belum diset di brand/jokoding/brand.ts)
      - Model: Eleven v3 (atau versi lebih baru di akunmu)
      - Perkiraan durasi: 8 detik (rentang Seri: 15–30 detik)
      - Musik (opsional, Eleven Music, instrumental): "tense minimal electronic, ticking clock pulse, resolving into upbeat, instrumental, no vocals", durasi 10 detik → simpan sebagai videos/0000-contoh/music.mp3
      - Simpan audio sebagai salah satu:
        - videos/0000-contoh/vo/vo.mp3 (satu file utuh, disarankan)
        - videos/0000-contoh/vo/01.mp3 … 03.mp3 (per baris)
      "
    `);
  });
});

describe("runNaskah", () => {
  it("writes naskah.md for a valid script", () => {
    const root = tmpRoot();
    writeScript(root, "x", deadline);
    runNaskah("x", root);
    const md = readFileSync(join(root, "videos", "x", "naskah.md"), "utf8");
    expect(md).toContain("# Naskah: Deadline besok, progres 0%?");
  });

  it("stops on an unspeakable caption token, naming line and token", () => {
    const root = tmpRoot();
    const bad = { ...deadline, lines: [{ ...deadline.lines[0], caption: "GPT-5" }] };
    writeScript(root, "bad", bad);
    expect(() => runNaskah("bad", root)).toThrow(UnspeakableTokenError);
    expect(() => runNaskah("bad", root)).toThrow(/01.*GPT-5/);
    expect(existsSync(join(root, "videos", "bad", "naskah.md"))).toBe(false);
  });

  it("rejects an unknown voice and an unknown seri", () => {
    const root = tmpRoot();
    writeScript(root, "v", { ...deadline, voice: "hantu" });
    expect(() => runNaskah("v", root)).toThrow("Voice tidak dikenal: hantu");
    writeScript(root, "s", { ...deadline, seri: "nope" });
    expect(() => runNaskah("s", root)).toThrow("Seri tidak dikenal: nope");
  });

  it("rejects the empty skeleton", () => {
    const root = tmpRoot();
    runNewVideo("Judul", { date: "2026-11-02", root });
    expect(() => runNaskah("2026-11-02-judul", root)).toThrow();
  });
});

describe("runNewVideo", () => {
  it("creates the folder and skeleton, suffixes on collision", () => {
    const root = tmpRoot();
    const slug = runNewVideo("Uji Coba", { date: "2026-11-02", root });
    expect(slug).toBe("2026-11-02-uji-coba");
    const sk = JSON.parse(readFileSync(join(root, "videos", slug, "script.json"), "utf8"));
    expect(sk).toEqual({
      slug,
      seri: "joki-cepat",
      voice: null,
      title: "Uji Coba",
      music: { mood: "", bpm: 100, prompt: "" },
      lines: [],
    });
    expect(runNewVideo("Uji Coba", { date: "2026-11-02", root })).toBe("2026-11-02-uji-coba-2");
  });
});
