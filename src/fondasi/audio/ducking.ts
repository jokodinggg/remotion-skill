import type { TimelineLine } from "../schema";

export type DuckingOptions = { baseDb?: number; duckDb?: number; attackMs?: number; releaseMs?: number };

export const dbToGain = (db: number): number => 10 ** (db / 20);

/** Music gain at `ms`: ducked under speech, linear-in-dB ramps around each speech span. */
export function musicVolumeAt(ms: number, lines: TimelineLine[], opts: DuckingOptions = {}): number {
  const { baseDb = -14, duckDb = -24, attackMs = 120, releaseMs = 400 } = opts;
  let db = baseDb;
  for (const line of lines) {
    if (line.words.length === 0) continue;
    const start = line.words[0].startMs;
    const end = line.words[line.words.length - 1].endMs;
    let spanDb = baseDb;
    if (ms >= start && ms <= end) spanDb = duckDb;
    else if (ms < start && ms > start - attackMs) spanDb = baseDb + ((duckDb - baseDb) * (ms - (start - attackMs))) / attackMs;
    else if (ms > end && ms < end + releaseMs) spanDb = duckDb + ((baseDb - duckDb) * (ms - end)) / releaseMs;
    db = Math.min(db, spanDb);
  }
  return dbToGain(db);
}
