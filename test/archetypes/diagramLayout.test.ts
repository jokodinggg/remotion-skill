import { describe, expect, it } from "vitest";
import { diagramLayout } from "../../src/archetypes/diagramLayout";

const BOX = { x: 120, y: 300, w: 840, h: 850 };
const inside = (r: { x: number; y: number; w: number; h: number }) =>
  r.x >= BOX.x && r.y >= BOX.y && r.x + r.w <= BOX.x + BOX.w && r.y + r.h <= BOX.y + BOX.h;

describe("diagramLayout", () => {
  it("puts a chain on successive rows, zigzagging, inside the box", () => {
    const nodes = ["a", "b", "c", "d"].map((id) => ({ id }));
    const edges: [string, string][] = [["a", "b"], ["b", "c"], ["c", "d"]];
    const l = diagramLayout(nodes, edges, BOX);
    const ys = nodes.map((n) => l[n.id].y);
    expect([...ys].sort((p, q) => p - q)).toEqual(ys);
    expect(new Set(ys).size).toBe(4);
    expect(l.a.x).not.toBe(l.b.x);
    for (const n of nodes) expect(inside(l[n.id]), n.id).toBe(true);
  });

  it("places siblings side by side on one row", () => {
    const nodes = ["a", "b", "c"].map((id) => ({ id }));
    const l = diagramLayout(nodes, [["a", "b"], ["a", "c"]], BOX);
    expect(l.b.y).toBe(l.c.y);
    expect(l.b.x + l.b.w).toBeLessThanOrEqual(l.c.x);
    expect(l.a.y).toBeLessThan(l.b.y);
    for (const n of nodes) expect(inside(l[n.id]), n.id).toBe(true);
  });

  it("survives a cycle without looping forever", () => {
    const l = diagramLayout([{ id: "a" }, { id: "b" }], [["a", "b"], ["b", "a"]], BOX);
    expect(Object.keys(l)).toEqual(["a", "b"]);
  });
});
