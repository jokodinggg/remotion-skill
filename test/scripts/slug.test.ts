import { describe, expect, it } from "vitest";
import { makeSlug } from "../../scripts/lib/slug";

describe("makeSlug", () => {
  it("strips punctuation and trims dashes", () => {
    expect(makeSlug("2026-11-05", "Deadline Besok, Progres 0%?!", [])).toBe(
      "2026-11-05-deadline-besok-progres-0",
    );
  });

  it("drops emoji", () => {
    expect(makeSlug("2026-11-05", "Kenapa Hermes Agent Viral? 🤖", [])).toBe(
      "2026-11-05-kenapa-hermes-agent-viral",
    );
  });

  it("strips diacritics", () => {
    expect(makeSlug("2026-11-05", "Café Résumé Ñandú", [])).toBe("2026-11-05-cafe-resume-nandu");
  });

  it("adds -2, -3 on collision", () => {
    const base = "2026-11-05-kenapa-hermes-agent-viral";
    const t = "Kenapa Hermes Agent Viral? 🤖";
    expect(makeSlug("2026-11-05", t, [base])).toBe(`${base}-2`);
    expect(makeSlug("2026-11-05", t, [base, `${base}-2`])).toBe(`${base}-3`);
  });

  it("caps at 60 chars on a dash boundary, never trailing dash", () => {
    const title = "satu dua tiga empat lima enam tujuh delapan sembilan sepuluh sebelas";
    const slug = makeSlug("2026-11-05", title, []);
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
    expect(slug).toBe("2026-11-05-satu-dua-tiga-empat-lima-enam-tujuh-delapan");
  });

  it("keeps the cap with a collision suffix", () => {
    const title = "satu dua tiga empat lima enam tujuh delapan sembilan sepuluh sebelas";
    const first = makeSlug("2026-11-05", title, []);
    const second = makeSlug("2026-11-05", title, [first]);
    expect(second).not.toBe(first);
    expect(second.length).toBeLessThanOrEqual(60);
    expect(second.endsWith("-2")).toBe(true);
  });

  it("hard-cuts a single very long word", () => {
    const slug = makeSlug("2026-11-05", "a".repeat(100), []);
    expect(slug.length).toBe(60);
  });
});
