import type { AssetKey, AssetManifestEntry } from "../experience/types";

export const ASSET_MANIFEST: Record<AssetKey, AssetManifestEntry> = {
  house: {
    key: "house",
    file: "house.glb",
    label: "la casa frente al mar",
    weight: 22,
    scene: "arrival",
  },
  osprey: {
    key: "osprey",
    file: "osprey.glb",
    label: "el águila pescadora",
    weight: 111,
    scene: "birds",
  },
  macaw: {
    key: "macaw",
    file: "macaw.glb",
    label: "el guacamayo",
    weight: 14,
    scene: "birds",
  },
  cats: {
    key: "cats",
    file: "cats.glb",
    label: "los dos gatos",
    weight: 16,
    scene: "cats",
  },
  ramen: {
    key: "ramen",
    file: "ramen.glb",
    label: "el ramen",
    weight: 1,
    scene: "ramen",
  },
  chest: {
    key: "chest",
    file: "chest.glb",
    label: "el cofre cubierto de sal",
    weight: 17,
    scene: "basement",
  },
};

export function assetUrl(key: AssetKey): string {
  const base = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  return `${base}assets/models/${ASSET_MANIFEST[key].file}`;
}
