import { pathToFileURL } from "node:url";
import { ensureWhisper, transcribeAudio } from "./lib/whisper";

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Pemakaian: npx tsx scripts/transcribe.ts --install-only | <file>");
    process.exit(1);
  }
  try {
    await ensureWhisper();
    if (arg !== "--install-only") console.log(JSON.stringify(await transcribeAudio(arg), null, 2));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
