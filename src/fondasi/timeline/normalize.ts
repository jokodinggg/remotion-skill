import type { ScriptLine } from "../schema";

const ONES = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
const EDGE_PUNCT = /^[?!.,:;"'()…“”‘’–—-]+|[?!.,:;"'()…“”‘’–—-]+$/g;

export type DisplayToken = { display: string; spoken: string[] };

/** Removes `[tag]` markers and collapses whitespace. */
export function stripTags(s: string): string {
  return s.replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
}

function below1000(n: number): string[] {
  const out: string[] = [];
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h === 1) out.push("seratus");
  else if (h > 1) out.push(ONES[h], "ratus");
  if (r === 0) return out;
  if (r < 10) out.push(ONES[r]);
  else if (r === 10) out.push("sepuluh");
  else if (r === 11) out.push("sebelas");
  else if (r < 20) out.push(ONES[r - 10], "belas");
  else {
    out.push(ONES[Math.floor(r / 10)], "puluh");
    if (r % 10) out.push(ONES[r % 10]);
  }
  return out;
}

/** Spells an integer 0..999 999 999 in Indonesian. */
export function spellNumber(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999_999_999) {
    throw new RangeError(`spellNumber: ${n} di luar jangkauan 0..999999999`);
  }
  if (n === 0) return "nol";
  const juta = Math.floor(n / 1_000_000);
  const ribu = Math.floor((n % 1_000_000) / 1000);
  const sisa = n % 1000;
  const out: string[] = [];
  if (juta) out.push(...below1000(juta), "juta");
  if (ribu) out.push(...(ribu === 1 ? ["seribu"] : [...below1000(ribu), "ribu"]));
  if (sisa) out.push(...below1000(sisa));
  return out.join(" ");
}

/** Lowercases and keeps only a-z0-9. */
export function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function stripEdges(t: string): string {
  return t.replace(EDGE_PUNCT, "");
}

function spokenWords(raw: string): string[] {
  let core = stripEdges(raw);
  const percent = core.endsWith("%");
  if (percent) core = stripEdges(core.slice(0, -1));
  const out: string[] = [];
  if (/^\d{1,3}(\.\d{3})+$/.test(core)) {
    out.push(...spellNumber(Number(core.replace(/\./g, ""))).split(" "));
  } else if (/^\d+,\d+$/.test(core)) {
    const [int, frac] = core.split(",");
    out.push(...spellNumber(Number(int)).split(" "), "koma", ...[...frac].map((d) => ONES[Number(d)]));
  } else if (/^\d+$/.test(core)) {
    out.push(...spellNumber(Number(core)).split(" "));
  } else {
    const w = normalizeWord(core);
    if (w) out.push(w);
  }
  if (percent) out.push("persen");
  return out;
}

/** Splits on whitespace; `display` keeps the original token, `spoken` is the normalized speech form. */
export function tokenize(displayText: string): DisplayToken[] {
  return displayText
    .split(/\s+/)
    .filter(Boolean)
    .map((display) => ({ display, spoken: spokenWords(display) }));
}

export class UnspeakableTokenError extends Error {
  token: string;
  lineId: string;
  constructor(lineId: string, token: string) {
    super(`Baris ${lineId}: token "${token}" tidak bisa dieja; tulis sesuai ucapan`);
    this.name = "UnspeakableTokenError";
    this.token = token;
    this.lineId = lineId;
  }
}

function isUnspeakable(token: DisplayToken): boolean {
  const core = normalizeWord(stripEdges(token.display));
  return (
    token.display.includes("/") ||
    (/[a-z]/.test(core) && /\d/.test(core)) ||
    token.spoken.some((w) => /\d/.test(w))
  );
}

/** Like tokenize, but a number the speller cannot handle becomes an UnspeakableTokenError. */
function tokenizeForLine(lineId: string, text: string): DisplayToken[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((display) => {
      try {
        return tokenize(display)[0];
      } catch (e) {
        if (e instanceof RangeError) throw new UnspeakableTokenError(lineId, display);
        throw e;
      }
    });
}

/**
 * Throws when the caption (or spoken text if no caption) holds a token the speller cannot
 * pronounce, or when the caption's spoken form differs from the spoken text.
 */
export function checkCaption(line: ScriptLine): void {
  const spokenTokens = tokenizeForLine(line.id, stripTags(line.spoken));
  const captionTokens =
    line.caption === undefined ? undefined : tokenizeForLine(line.id, line.caption);
  for (const t of [...spokenTokens, ...(captionTokens ?? [])]) {
    if (isUnspeakable(t)) throw new UnspeakableTokenError(line.id, t.display);
  }
  if (captionTokens) {
    const flat = (ts: DisplayToken[]) => ts.flatMap((t) => t.spoken).join(" ");
    if (flat(captionTokens) !== flat(spokenTokens)) {
      throw new Error(`Caption baris ${line.id} tidak cocok dengan spoken`);
    }
  }
}
