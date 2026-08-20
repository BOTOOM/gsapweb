import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { validateBytes } from "gltf-validator";

const root = resolve(process.cwd());
const directory = join(root, "public", "assets", "models");
const expected = ["house.glb", "osprey.glb", "macaw.glb", "cats.glb", "ramen.glb", "chest.glb"];
const maxFileBytes = 100 * 1024 * 1024;
const maxTotalBytes = 60 * 1024 * 1024;
const entries = await readdir(directory).catch(() => []);
const failures = [];
let totalBytes = 0;

for (const filename of expected) {
  const path = join(directory, filename);
  if (!entries.includes(filename)) {
    failures.push(`${filename}: missing`);
    continue;
  }
  const bytes = await readFile(path);
  totalBytes += bytes.byteLength;
  if (bytes.byteLength >= maxFileBytes) failures.push(`${filename}: exceeds 100 MB`);
  const report = await validateBytes(new Uint8Array(bytes), {
    uri: filename,
    format: "glb",
    maxIssues: 0,
    writeTimestamp: false,
  });
  const errors = report.issues?.numErrors ?? 0;
  const warnings = report.issues?.numWarnings ?? 0;
  console.log(`${filename}: ${(bytes.byteLength / 1048576).toFixed(2)} MB, ${errors} errors, ${warnings} warnings`);
  if (errors > 0) {
    const details = (report.issues?.messages ?? []).filter((issue) => issue.severity === 0).map((issue) => issue.message).join("; ");
    failures.push(`${filename}: ${details || `${errors} validation errors`}`);
  }
}

console.log(`Total optimized asset size: ${(totalBytes / 1048576).toFixed(2)} MB`);
if (totalBytes > maxTotalBytes) failures.push(`total assets exceed ${(maxTotalBytes / 1048576).toFixed(0)} MB`);

if (failures.length > 0) {
  console.error("Asset validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("All optimized GLB assets are present and valid.");
}
