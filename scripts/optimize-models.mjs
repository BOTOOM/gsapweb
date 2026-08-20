import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS, EXTMeshoptCompression, EXTTextureWebP } from "@gltf-transform/extensions";
import { dedup, flatten, join as joinPrimitives, meshopt, prune, simplify, textureCompress } from "@gltf-transform/functions";
import sharp from "sharp";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";

const root = resolve(process.cwd());
const sourceDirectory = join(root, "models");
const outputDirectory = join(root, "public", "assets", "models");

const assets = [
  { source: "dae_diorama_retake_-_picturesque_holiday_home.glb", output: "house.glb", ratio: 1, error: 0.001, textureSize: 1024, join: true },
  { source: "osprey__flying_raptor_rigged_bird.glb", output: "osprey.glb", ratio: 0.16, error: 0.006, textureSize: 1024, join: true },
  { source: "a_macaw_flying_3d_model_free.glb", output: "macaw.glb", ratio: 0.42, error: 0.005, textureSize: 1024, join: true },
  { source: "cute+cats+3d+model.glb", output: "cats.glb", ratio: 0.42, error: 0.005, textureSize: 1024, join: false },
  { source: "ramen.glb", output: "ramen.glb", ratio: 1, error: 0.001, textureSize: 512, join: false },
  { source: "cofre.glb", output: "chest.glb", ratio: 0.42, error: 0.005, textureSize: 1024, join: false },
];

function createIo() {
  return new NodeIO()
    .registerExtensions([...KHRONOS_EXTENSIONS, EXTMeshoptCompression, EXTTextureWebP])
    .registerDependencies({
      "meshopt.encoder": MeshoptEncoder,
      "meshopt.decoder": MeshoptDecoder,
    });
}

await mkdir(outputDirectory, { recursive: true });
await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;

for (const asset of assets) {
  const sourcePath = join(sourceDirectory, asset.source);
  const outputPath = join(outputDirectory, asset.output);
  const io = createIo();
  const document = await io.read(sourcePath);
  const transforms = [dedup(), prune(), flatten()];
  if (asset.join) transforms.push(joinPrimitives({ keepNamed: false }));
  if (asset.ratio < 1) {
    transforms.push(simplify({
      simplifier: MeshoptSimplifier,
      ratio: asset.ratio,
      error: asset.error,
      lockBorder: true,
    }));
  }
  transforms.push(
    textureCompress({
      encoder: sharp,
      targetFormat: "webp",
      resize: [asset.textureSize, asset.textureSize],
      quality: 82,
      effort: 5,
      chromaSubsampling: "4:4:4",
      slots: /^(?!normalTexture$|metallicRoughnessTexture$|occlusionTexture$).*/,
    }),
    meshopt({ encoder: MeshoptEncoder, level: "high" }),
  );

  await document.transform(...transforms);
  await io.write(outputPath, document);
  console.log(`Optimized ${asset.source} -> ${asset.output}`);
}
