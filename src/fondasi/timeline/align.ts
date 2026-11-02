import type { HeardWord } from "../schema";
import { normalizeWord, tokenize } from "./normalize";

export const MATCH_THRESHOLD = 0.7;

export type AlignPair = {
  e: number | null;
  h: number | null;
  kind: "match" | "changed" | "missing" | "inserted";
};

function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

export function similarity(a: string, b: string): number {
  const x = normalizeWord(a);
  const y = normalizeWord(b);
  const max = Math.max(x.length, y.length);
  if (max === 0) return 1;
  return 1 - levenshtein(x, y) / max;
}

function spokenUnits(text: string): string[] {
  try {
    const units = tokenize(text).flatMap((t) => t.spoken);
    return units.map(normalizeWord).filter((u) => u !== "");
  } catch {
    const n = normalizeWord(text);
    return n === "" ? [] : [n];
  }
}

/**
 * Expands each heard word into spoken units (digits become spelled numbers)
 * and splits its time range evenly across the units. Empty words are dropped.
 */
export function expandHeard(heard: HeardWord[]): HeardWord[] {
  return heard.flatMap((w) => {
    const units = spokenUnits(w.text);
    const step = (w.endMs - w.startMs) / (units.length || 1);
    return units.map((text, i) => ({
      text,
      startMs: Math.round(w.startMs + step * i),
      endMs: Math.round(w.startMs + step * (i + 1)),
    }));
  });
}

export function alignTokens(expected: string[], heard: HeardWord[]): AlignPair[] {
  const units = expandHeard(heard);
  const n = expected.length;
  const m = units.length;
  const sub = (i: number, j: number) =>
    similarity(expected[i], units[j].text) >= MATCH_THRESHOLD ? 2 : -1;

  const score: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) score[i][0] = -i;
  for (let j = 1; j <= m; j++) score[0][j] = -j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      score[i][j] = Math.max(
        score[i - 1][j - 1] + sub(i - 1, j - 1),
        score[i - 1][j] - 1,
        score[i][j - 1] - 1,
      );
    }
  }

  // Traceback, tie order: diagonal, then missing, then inserted.
  const out: AlignPair[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && score[i][j] === score[i - 1][j - 1] + sub(i - 1, j - 1)) {
      out.push({ e: i - 1, h: j - 1, kind: sub(i - 1, j - 1) === 2 ? "match" : "changed" });
      i--;
      j--;
    } else if (i > 0 && score[i][j] === score[i - 1][j] - 1) {
      out.push({ e: i - 1, h: null, kind: "missing" });
      i--;
    } else {
      out.push({ e: null, h: j - 1, kind: "inserted" });
      j--;
    }
  }
  return out.reverse();
}
