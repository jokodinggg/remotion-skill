import { describe, expect, it } from "vitest";
import { defaultExpression } from "../../src/fondasi/expression";

const ROWS: [string, string, string][] = [
  ["excited", "senang", "senang"],
  ["happy", "senang", "senang"],
  ["panicked", "kaget", "panik"],
  ["surprised", "kaget", "panik"],
  ["sighs", "sedih", "sedih"],
  ["sad", "sedih", "sedih"],
  ["curious", "bingung", "bingung"],
  ["confused", "bingung", "bingung"],
  ["angry", "marah", "panik"],
  ["frustrated", "marah", "panik"],
  ["calm", "netral", "netral"],
  ["whispers", "netral", "netral"],
];

describe("defaultExpression", () => {
  it.each(ROWS)("%s -> %s / %s", (tag, joks, person) => {
    expect(defaultExpression(tag)).toEqual({ joks, person });
  });
  it("maps unknown to netral", () => expect(defaultExpression("unknown")).toEqual({ joks: "netral", person: "netral" }));
});
