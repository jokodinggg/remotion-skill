import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runSyncAssets } from "../../scripts/sync-assets";

describe("runSyncAssets", () => {
  it("copies logo and joks recursively, overwriting, into a fresh public/", () => {
    const root = mkdtempSync(join(tmpdir(), "sync-"));
    const assets = join(root, "brand", "jokoding", "assets");
    mkdirSync(join(assets, "logo"), { recursive: true });
    mkdirSync(join(assets, "joks", "poses"), { recursive: true });
    writeFileSync(join(assets, "logo", "logo.svg"), "v1");
    writeFileSync(join(assets, "joks", "poses", "wave.png"), "png");
    writeFileSync(join(assets, "manual.pdf"), "not copied");

    runSyncAssets(root);
    writeFileSync(join(assets, "logo", "logo.svg"), "v2");
    runSyncAssets(root);

    const out = join(root, "public", "brand", "jokoding");
    expect(readFileSync(join(out, "logo", "logo.svg"), "utf8")).toBe("v2");
    expect(readFileSync(join(out, "joks", "poses", "wave.png"), "utf8")).toBe("png");
    expect(() => readFileSync(join(out, "manual.pdf"))).toThrow();
  });
});
