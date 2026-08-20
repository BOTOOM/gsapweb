import { readFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

const root = resolve(process.cwd());
const directories = [join(root, "models"), join(root, "public", "assets", "models")];

function parseGlb(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x46546c67) {
    throw new Error("Not a GLB file");
  }

  let offset = 12;
  let json;
  let binaryLength = 0;
  while (offset + 8 <= bytes.byteLength) {
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    const chunk = bytes.subarray(offset + 8, offset + 8 + length);
    offset += 8 + length;
    if (type === 0x4e4f534a) {
      json = JSON.parse(new TextDecoder().decode(chunk).trim());
    }
    if (type === 0x004e4942) binaryLength = chunk.byteLength;
  }
  if (!json) throw new Error("GLB JSON chunk missing");
  return { json, binaryLength };
}

function inspect(json, sizeBytes) {
  const accessors = json.accessors ?? [];
  const primitives = (json.meshes ?? []).flatMap((mesh) => mesh.primitives ?? []);
  let triangles = 0;
  let vertices = 0;
  for (const primitive of primitives) {
    const positionIndex = primitive.attributes?.POSITION;
    const positionCount = positionIndex == null ? 0 : accessors[positionIndex]?.count ?? 0;
    vertices += positionCount;
    if ((primitive.mode ?? 4) === 4) {
      const indexCount = primitive.indices == null
        ? positionCount
        : accessors[primitive.indices]?.count ?? 0;
      triangles += Math.floor(indexCount / 3);
    }
  }

  const bufferViews = json.bufferViews ?? [];
  const imageBytes = (json.images ?? []).map((image) => {
    const view = image.bufferView == null ? null : bufferViews[image.bufferView];
    return view?.byteLength ?? 0;
  });

  return {
    file: basename(json.asset?.extras?.title ? json.asset.extras.title : "model.glb"),
    sizeMb: Number((sizeBytes / 1048576).toFixed(2)),
    generator: json.asset?.generator ?? "unknown",
    extensions: json.extensionsUsed ?? [],
    nodes: json.nodes?.length ?? 0,
    meshes: json.meshes?.length ?? 0,
    primitives: primitives.length,
    vertices,
    triangles,
    materials: json.materials?.length ?? 0,
    textures: json.textures?.length ?? 0,
    images: json.images?.length ?? 0,
    embeddedTextureMb: Number((imageBytes.reduce((sum, value) => sum + value, 0) / 1048576).toFixed(2)),
    animations: (json.animations ?? []).map((animation) => animation.name || "unnamed"),
    skins: json.skins?.length ?? 0,
  };
}

async function inspectDirectory(directory) {
  let entries;
  try {
    entries = await (await import("node:fs/promises")).readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const results = [];
  for (const entry of entries.filter((candidate) => candidate.isFile() && candidate.name.endsWith(".glb")).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    const bytes = await readFile(path);
    const { json } = parseGlb(bytes);
    const report = inspect(json, bytes.byteLength);
    report.file = entry.name;
    report.path = path.replace(`${root}/`, "");
    results.push(report);
  }
  return results;
}

const reports = [];
for (const directory of directories) reports.push(...await inspectDirectory(directory));
if (reports.length === 0) {
  console.error("No GLB files found in models/ or public/assets/models/");
  process.exitCode = 1;
} else {
  console.table(reports.map(({ path, file, sizeMb, primitives, triangles, materials, textures, animations }) => ({ path, file, sizeMb, primitives, triangles, materials, textures, animations: animations.join(", ") || "none" })));
  console.log(JSON.stringify(reports, null, 2));
}
