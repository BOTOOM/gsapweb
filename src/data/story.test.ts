import { describe, expect, it } from "vitest";
import { ASSET_MANIFEST, assetUrl } from "./assets";
import { STORY_SCENES } from "./story";

describe("story manifest", () => {
  it("keeps the narrative in the order defined by the story", () => {
    expect(STORY_SCENES.map((scene) => scene.id)).toEqual([
      "loader",
      "arrival",
      "birds",
      "cats",
      "ramen",
      "basement",
      "mystery",
    ]);
    expect(STORY_SCENES.at(-1)?.paragraphs).toContain("Entonces escuché tres golpes desde el interior.");
  });

  it("maps every model to a normalized static asset URL", () => {
    for (const key of Object.keys(ASSET_MANIFEST) as Array<keyof typeof ASSET_MANIFEST>) {
      expect(assetUrl(key)).toMatch(new RegExp(`assets/models/${ASSET_MANIFEST[key].file}$`));
    }
  });
});
