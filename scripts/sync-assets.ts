import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const FOLDERS = ["logo", "joks"];

/** Copies brand/jokoding/assets/{logo,joks} to public/brand/jokoding/, overwriting. */
export function runSyncAssets(root: string): string[] {
  const from = join(root, "brand", "jokoding", "assets");
  const to = join(root, "public", "brand", "jokoding");
  mkdirSync(to, { recursive: true });
  const copied: string[] = [];
  for (const folder of FOLDERS) {
    const src = join(from, folder);
    if (!existsSync(src)) throw new Error(`Folder aset tidak ada: ${src}`);
    cpSync(src, join(to, folder), { recursive: true, force: true });
    copied.push(join(to, folder));
  }
  return copied;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    for (const dir of runSyncAssets(process.cwd())) console.log(dir);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
