export type MusicMeta = {
  file: string;
  mood: string;
  bpm: number;
  durationMs: number;
  prompt: string;
  source: string;
  license: string;
};

/** Same mood, closest BPM (first entry wins a tie); null when no entry has the mood. */
export function pickMusic(entries: MusicMeta[], mood: string, bpm: number): MusicMeta | null {
  let best: MusicMeta | null = null;
  for (const entry of entries) {
    if (entry.mood !== mood) continue;
    if (best === null || Math.abs(entry.bpm - bpm) < Math.abs(best.bpm - bpm)) best = entry;
  }
  return best;
}
