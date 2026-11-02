import { describe, expect, it } from "vitest";
import { defaultExpression } from "../../src/fondasi/expression";

describe("defaultExpression", () => {
  it("maps excited", () => expect(defaultExpression("excited").joks).toBe("senang"));
  it("maps panicked", () => expect(defaultExpression("panicked")).toEqual({ joks: "kaget", person: "panik" }));
  it("maps unknown to netral", () => expect(defaultExpression("unknown")).toEqual({ joks: "netral", person: "netral" }));
});
