import { describe, expect, it } from "vitest";
import { getRenderQuality } from "./quality";

describe("render quality", () => {
  it("reduces motion and keeps a bounded pixel ratio", () => {
    const quality = getRenderQuality(true);
    expect(quality.proceduralMotion).toBe(false);
    expect(quality.pixelRatio).toBeLessThanOrEqual(1.8);
  });
});
