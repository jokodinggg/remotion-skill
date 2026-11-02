import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { JOKODING } from "../brand/jokoding/brand";
import { getSeri } from "../brand/jokoding/seri";
import { ScriptSchema } from "../src/fondasi/schema";
import { checkCaption } from "../src/fondasi/timeline/normalize";
import { renderNaskah } from "./lib/naskah";

/** Validates videos/<slug>/script.json and writes videos/<slug>/naskah.md. */
export function runNaskah(slug: string, root: string): string {
  const dir = join(root, "videos", slug);
  const script = ScriptSchema.parse(JSON.parse(readFileSync(join(dir, "script.json"), "utf8")));
  const seri = getSeri(script.seri);
  const voiceKey = script.voice ?? seri.voice;
  if (!(voiceKey in JOKODING.voices)) throw new Error(`Voice tidak dikenal: ${voiceKey}`);
  if (script.lines.length === 0) throw new Error("Script tidak punya baris");
  for (const line of script.lines) checkCaption(line);
  const out = join(dir, "naskah.md");
  writeFileSync(out, renderNaskah(script, seri, JOKODING));
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Pemakaian: npx tsx scripts/naskah.ts <slug>");
    process.exit(1);
  }
  try {
    console.log(runNaskah(slug, process.cwd()));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
