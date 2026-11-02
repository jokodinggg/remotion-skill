import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { makeSlug } from "./lib/slug";

function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Creates videos/<slug>/script.json (skeleton) and returns the slug. */
export function runNewVideo(title: string, opts: { date?: string; root: string }): string {
  const videos = join(opts.root, "videos");
  const existing = existsSync(videos) ? readdirSync(videos) : [];
  const slug = makeSlug(opts.date ?? today(), title, existing);
  const dir = join(videos, slug);
  mkdirSync(dir, { recursive: true });
  const skeleton = {
    slug,
    seri: "joki-cepat",
    voice: null,
    title,
    music: { mood: "", bpm: 100, prompt: "" },
    lines: [],
  };
  writeFileSync(join(dir, "script.json"), JSON.stringify(skeleton, null, 2) + "\n");
  return slug;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const di = args.indexOf("--date");
  let date: string | undefined;
  if (di >= 0) {
    date = args[di + 1];
    args.splice(di, 2);
  }
  const title = args[0];
  if (!title || (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    console.error('Pemakaian: npx tsx scripts/new-video.ts "<judul>" [--date YYYY-MM-DD]');
    process.exit(1);
  }
  try {
    console.log(runNewVideo(title, { date, root: process.cwd() }));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
