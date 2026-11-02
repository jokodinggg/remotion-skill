import type { BrandKit, Seri } from "../../src/fondasi/brand/types";
import type { Script } from "../../src/fondasi/schema";
import { stripTags } from "../../src/fondasi/timeline/normalize";

const WORD_MS = 380;
const LINE_GAP_MS = 450;

function wordCount(s: string): number {
  const t = stripTags(s);
  return t ? t.split(" ").length : 0;
}

export function estimateDurationMs(script: Script): number {
  const words = script.lines.reduce((sum, l) => sum + wordCount(l.spoken), 0);
  return words * WORD_MS + Math.max(0, script.lines.length - 1) * LINE_GAP_MS;
}

export function renderNaskah(script: Script, seri: Seri, brand: BrandKit): string {
  const voiceKey = script.voice ?? seri.voice;
  const voice = brand.voices[voiceKey];
  if (!voice) throw new Error(`Voice tidak dikenal: ${voiceKey}`);

  const body = script.lines
    .map((l) => (/^\s*\[/.test(l.spoken) ? l.spoken : `[${l.tag}] ${l.spoken}`))
    .join("\n\n");
  const seconds = Math.round(estimateDurationMs(script) / 1000);
  const [min, max] = seri.durationRange;
  const lastId = script.lines[script.lines.length - 1].id;
  const slug = script.slug;

  return `# Naskah: ${script.title}

<!-- tempel bagian di bawah ini ke ElevenLabs -->

${body}

---

- Voice: ${voice.name} (${voice.elevenLabsId ?? "ID belum diset di brand/jokoding/brand.ts"})
- Model: Eleven v3 (atau versi lebih baru di akunmu)
- Perkiraan durasi: ${seconds} detik (rentang Seri: ${min}–${max} detik)
- Musik (opsional, Eleven Music, instrumental): "${script.music.prompt}", durasi ${seconds + 2} detik → simpan sebagai videos/${slug}/music.mp3
- Simpan audio sebagai salah satu:
  - videos/${slug}/vo/vo.mp3 (satu file utuh, disarankan)
  - videos/${slug}/vo/01.mp3 … ${lastId}.mp3 (per baris)
`;
}
