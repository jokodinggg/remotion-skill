/** Tempo rule (spec §6.7): a visible change at least every 1.5 s. */
export const MAX_BEAT_GAP_S = 1.5;

/**
 * Extra beat frames so that, together with `anchors` (frames where the
 * archetype already changes) and the line bounds, no gap exceeds `maxGap`.
 * Each long gap is split evenly. Anchors outside (start, end) are ignored.
 */
export function fillerBeats(anchors: number[], start: number, end: number, maxGap: number): number[] {
  const pts = [start, ...anchors.filter((a) => a > start && a < end), end].sort((a, b) => a - b);
  const out: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const gap = pts[i] - pts[i - 1];
    const parts = Math.ceil(gap / maxGap);
    for (let k = 1; k < parts; k++) out.push(Math.round(pts[i - 1] + (gap * k) / parts));
  }
  return out;
}
