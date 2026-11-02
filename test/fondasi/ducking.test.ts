import { describe, expect, it } from "vitest";
import { dbToGain, musicVolumeAt } from "../../src/fondasi/audio/ducking";
import { mkLine, w } from "./helpers";

const lines = [mkLine("01", 1000, 3000, [w("a", 2000, 2300), w("b", 2400, 3000)]), mkLine("02", 9000, 0, [])];

describe("musicVolumeAt", () => {
  it("dbToGain(-14) ~ 0.1995", () => expect(dbToGain(-14)).toBeCloseTo(0.1995, 3));
  it("is base far from speech", () => expect(musicVolumeAt(10000, lines)).toBeCloseTo(dbToGain(-14), 10));
  it("ducks inside speech", () => expect(musicVolumeAt(2500, lines)).toBeCloseTo(dbToGain(-24), 10));
  it("60 ms before speech is halfway down the attack", () =>
    expect(musicVolumeAt(1940, lines)).toBeCloseTo(dbToGain(-19), 10));
  it("200 ms after speech is halfway up the release", () =>
    expect(musicVolumeAt(3200, lines)).toBeCloseTo(dbToGain(-19), 10));
  it("ignores lines without words", () => expect(musicVolumeAt(9000, lines)).toBeCloseTo(dbToGain(-14), 10));
  it("uses the lowest gain where ramps overlap", () => {
    const two = [mkLine("01", 0, 1, [w("a", 1000, 2000)]), mkLine("02", 0, 1, [w("b", 2100, 3000)])];
    expect(musicVolumeAt(2050, two)).toBeCloseTo(dbToGain(-22.75), 10); // release of a (-22.75) beats attack of b (-19.83)
  });
});
