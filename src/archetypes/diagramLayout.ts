import type { Rect } from "../fondasi/layout/safeArea";

export const NODE_H = 124;
const NODE_MAX_W = 440;
const COL_GAP = 40;
const ZIGZAG = 0.18; // fraction of the box width a lone node shifts off-centre

/**
 * Layered top-to-bottom layout for Diagram. Row = longest path from a source
 * (cycles are cut after n passes). Siblings share a row side by side; a lone
 * node on a row zigzags left/right so a chain reads as a flow, not a column.
 * Pure: returns a rect per node id, all inside `box`.
 */
export function diagramLayout(nodes: { id: string }[], edges: [string, string][], box: Rect): Record<string, Rect> {
  const depth: Record<string, number> = Object.fromEntries(nodes.map((n) => [n.id, 0]));
  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false;
    for (const [a, b] of edges) {
      if (!(a in depth) || !(b in depth)) continue;
      if (depth[b] < depth[a] + 1 && depth[a] + 1 < nodes.length) {
        depth[b] = depth[a] + 1;
        changed = true;
      }
    }
    if (!changed) break;
  }
  const used = [...new Set(nodes.map((n) => depth[n.id]))].sort((p, q) => p - q);
  const rows = used.map((d) => nodes.filter((n) => depth[n.id] === d));
  const rowH = box.h / rows.length;
  const out: Record<string, Rect> = {};
  rows.forEach((row, r) => {
    const w = Math.min(NODE_MAX_W, (box.w - (row.length - 1) * COL_GAP) / row.length);
    const h = Math.min(NODE_H, rowH - 24);
    const y = box.y + r * rowH + (rowH - h) / 2;
    if (row.length === 1 && rows.length > 1) {
      const cx = box.x + box.w / 2 + (r % 2 === 0 ? -1 : 1) * box.w * ZIGZAG;
      const x = Math.min(Math.max(cx - w / 2, box.x), box.x + box.w - w);
      out[row[0].id] = { x, y, w, h };
      return;
    }
    const total = row.length * w + (row.length - 1) * COL_GAP;
    row.forEach((n, i) => {
      out[n.id] = { x: box.x + (box.w - total) / 2 + i * (w + COL_GAP), y, w, h };
    });
  });
  return out;
}
