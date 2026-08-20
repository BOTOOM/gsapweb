import * as THREE from "three";

export type ParticleMotion = "wind" | "float";

export interface ParticleField {
  points: THREE.Points;
  update: (elapsed: number) => void;
}

interface ParticleFieldOptions {
  count: number;
  color: number;
  size: number;
  opacity: number;
  bounds: { x: number; y: number; z: number };
  center: [number, number, number];
  motion: ParticleMotion;
  speed: number;
  seed: number;
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function createParticleField(options: ParticleFieldOptions): ParticleField {
  const random = seededRandom(options.seed);
  const positions = new Float32Array(options.count * 3);
  const basePositions = new Float32Array(options.count * 3);
  const phases = new Float32Array(options.count);

  for (let index = 0; index < options.count; index += 1) {
    const offset = index * 3;
    const x = (random() - 0.5) * options.bounds.x + options.center[0];
    const y = (random() - 0.5) * options.bounds.y + options.center[1];
    const z = (random() - 0.5) * options.bounds.z + options.center[2];
    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = z;
    basePositions[offset] = x;
    basePositions[offset + 1] = y;
    basePositions[offset + 2] = z;
    phases[index] = random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: options.color,
    size: options.size,
    transparent: true,
    opacity: options.opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.name = `${options.motion}-particles`;

  const update = (elapsed: number) => {
    const positionAttribute = geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = positionAttribute.array as Float32Array;
    for (let index = 0; index < options.count; index += 1) {
      const offset = index * 3;
      const phase = phases[index];
      if (options.motion === "wind") {
        const wrappedX = ((basePositions[offset] + elapsed * options.speed + options.bounds.x / 2) % options.bounds.x + options.bounds.x) % options.bounds.x - options.bounds.x / 2 + options.center[0];
        array[offset] = wrappedX;
        array[offset + 1] = basePositions[offset + 1] + Math.sin(elapsed * 0.7 + phase) * 0.08;
        array[offset + 2] = basePositions[offset + 2] + Math.cos(elapsed * 0.45 + phase) * 0.05;
      } else {
        array[offset] = basePositions[offset] + Math.sin(elapsed * options.speed + phase) * 0.18;
        array[offset + 1] = basePositions[offset + 1] + Math.cos(elapsed * options.speed * 0.8 + phase) * 0.2;
        array[offset + 2] = basePositions[offset + 2] + Math.sin(elapsed * options.speed * 0.6 + phase) * 0.12;
      }
    }
    positionAttribute.needsUpdate = true;
  };

  return { points, update };
}
