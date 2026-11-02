const MAX_LENGTH = 60;

function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[^\p{ASCII}]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Cuts to `max` chars, preferring a dash boundary; never ends in a dash. */
function cap(s: string, max: number, minKeep: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  // Whole words are kept when the next char is a dash.
  const boundary = s[max] === "-" ? max : cut.lastIndexOf("-");
  const chosen = boundary > minKeep ? s.slice(0, boundary) : cut;
  return chosen.replace(/-+$/, "");
}

/** `<date>-<title slug>`, max 60 chars, with -2, -3 suffix when `existing` already has it. */
export function makeSlug(date: string, title: string, existing: string[]): string {
  const body = slugify(title);
  const full = body ? `${date}-${body}` : date;
  const taken = new Set(existing);
  const first = cap(full, MAX_LENGTH, date.length);
  if (!taken.has(first)) return first;
  for (let n = 2; ; n++) {
    const suffix = `-${n}`;
    const candidate = cap(full, MAX_LENGTH - suffix.length, date.length) + suffix;
    if (!taken.has(candidate)) return candidate;
  }
}
