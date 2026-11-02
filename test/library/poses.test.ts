import { describe, expect, it } from "vitest";
import { lerpPose, POSES } from "../../src/library/joks/poses";

describe("joks poses", () => {
  it("lerpPose endpoints equal the inputs", () => {
    expect(lerpPose(POSES.halo, POSES.nunjuk, 0)).toEqual(POSES.halo);
    expect(lerpPose(POSES.halo, POSES.nunjuk, 1)).toEqual(POSES.nunjuk);
  });
  it("lerpPose midpoint blends tilt", () => {
    expect(lerpPose(POSES.halo, POSES.nunjuk, 0.5).tilt).toBe(5.5);
  });
  it("keeps the final spike tilts", () => {
    expect(POSES.halo.tilt).toBe(5);
    expect(POSES.nunjuk.tilt).toBe(6);
  });
});
