import * as THREE from "three";
import gsap from "gsap";
import { SCENE_VISUALS } from "../../data/story";
import type { AssetKey, AssetProgress, SceneId, WorldRuntime } from "../types";
import { AssetManager } from "./AssetManager";
import { createParticleField, type ParticleField } from "./createParticles";
import { disposeObject } from "./disposeResource";
import { getRenderQuality } from "./quality";

const ASSET_KEYS: AssetKey[] = ["house", "osprey", "macaw", "cats", "ramen", "chest"];
const MODEL_HEIGHTS: Record<AssetKey, number> = {
  house: 5.4,
  osprey: 2.25,
  macaw: 1.8,
  cats: 1.55,
  ramen: 1.05,
  chest: 1.7,
};
const MODEL_ROTATIONS: Partial<Record<AssetKey, number>> = {
  house: -Math.PI / 2,
  cats: THREE.MathUtils.degToRad(50),
};
const THEME_COLORS: Record<SceneId, number> = {
  loader: 0x0b2c35,
  arrival: 0x16505a,
  birds: 0x236273,
  cats: 0x3b4d4b,
  ramen: 0x5c3b30,
  basement: 0x11282b,
  mystery: 0x050d12,
};

const ACTIVE_ASSETS: Record<SceneId, AssetKey[]> = {
  loader: ["house"],
  arrival: ["house"],
  birds: ["house", "osprey", "macaw"],
  cats: ["cats"],
  ramen: ["cats", "ramen"],
  basement: ["chest"],
  mystery: ["chest"],
};

export interface WorldOptions {
  onProgress: (progress: AssetProgress) => void;
  onAssetError: (key: AssetKey, error: unknown) => void;
}

export function createWorld(canvas: HTMLCanvasElement, options: WorldOptions): WorldRuntime {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const quality = getRenderQuality(reducedMotion);
  const scene = new THREE.Scene();
  const background = new THREE.Color(THEME_COLORS.loader);
  scene.background = background;
  scene.fog = new THREE.FogExp2(0x0b2c35, SCENE_VISUALS.loader.fogDensity);

  const camera = new THREE.PerspectiveCamera(
    SCENE_VISUALS.loader.camera.fov ?? 38,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  const cameraRig = new THREE.Group();
  const lookTarget = new THREE.Object3D();
  cameraRig.add(camera);
  scene.add(cameraRig, lookTarget);
  camera.position.set(...SCENE_VISUALS.loader.camera.position);
  lookTarget.position.set(...SCENE_VISUALS.loader.camera.target);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(quality.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = SCENE_VISUALS.loader.exposure;
  renderer.shadowMap.enabled = quality.shadows;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const hemisphere = new THREE.HemisphereLight(0xc6e0d8, 0x3b5b5b, 1.12);
  hemisphere.position.set(0, 12, 0);
  const ambient = new THREE.AmbientLight(0xa9cbc4, 0.78);
  const sun = new THREE.DirectionalLight(0xffe1ad, SCENE_VISUALS.loader.sunIntensity);
  sun.position.set(6, 10, 6);
  sun.castShadow = quality.shadows;
  sun.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 35;
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  sun.shadow.bias = -0.00015;
  sun.shadow.normalBias = 0.02;
  sun.target = lookTarget;

  const warm = new THREE.PointLight(0xffaa68, SCENE_VISUALS.loader.warmIntensity, 12, 2);
  warm.position.set(0, 2.6, 1.4);
  const basement = new THREE.SpotLight(0x81c7c2, SCENE_VISUALS.loader.basementIntensity, 12, Math.PI / 5, 0.65, 2);
  basement.position.set(1.4, 4.6, 2.4);
  basement.target = lookTarget;
  basement.castShadow = quality.shadows;
  basement.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);

  scene.add(ambient, hemisphere, sun, sun.target, warm, basement, basement.target);

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 42, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0x164c55, roughness: 0.32, metalness: 0.08 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -2.2;
  water.receiveShadow = true;
  scene.add(water);

  const horizon = new THREE.Mesh(
    new THREE.SphereGeometry(28, 20, 12),
    new THREE.MeshBasicMaterial({ color: 0x0d343e, side: THREE.BackSide }),
  );
  horizon.position.y = 1;
  scene.add(horizon);

  const particles: Record<string, ParticleField> = {
    wind: createParticleField({
      count: 150,
      color: 0x9ed8d2,
      size: 0.035,
      opacity: 0.34,
      bounds: { x: 20, y: 6, z: 6 },
      center: [0, 2.2, -1],
      motion: "wind",
      speed: 0.32,
      seed: 11,
    }),
    fireflies: createParticleField({
      count: 115,
      color: 0xffcf82,
      size: 0.055,
      opacity: 0.72,
      bounds: { x: 10, y: 5, z: 4 },
      center: [0, 2.1, 0],
      motion: "float",
      speed: 0.5,
      seed: 23,
    }),
    motes: createParticleField({
      count: 95,
      color: 0x8edbd1,
      size: 0.045,
      opacity: 0.58,
      bounds: { x: 7, y: 4, z: 4 },
      center: [0, 1.6, 0],
      motion: "float",
      speed: 0.34,
      seed: 37,
    }),
  };
  for (const field of Object.values(particles)) scene.add(field.points);

  const groups = Object.fromEntries(
    ASSET_KEYS.map((key) => {
      const group = new THREE.Group();
      group.name = `${key}-group`;
      group.visible = false;
      scene.add(group);
      return [key, group];
    }),
  ) as Record<AssetKey, THREE.Group>;

  const assetManager = new AssetManager(options.onProgress, options.onAssetError);
  const timer = new THREE.Timer();
  timer.connect(document);
  const mixers = new Map<AssetKey, THREE.AnimationMixer>();
  const originalModels = new Map<AssetKey, THREE.Object3D>();
  let activeSceneId: SceneId = "loader";
  let activeProgress = 0;
  let destroyed = false;
  let pulseTimeline: gsap.core.Timeline | undefined;

  const shouldShowAsset = (key: AssetKey): boolean => {
    if (!ACTIVE_ASSETS[activeSceneId].includes(key)) return false;
    if (activeSceneId === "birds" && key === "osprey") return activeProgress > 0.02;
    if (activeSceneId === "birds" && key === "macaw") return activeProgress > 0.28;
    if (activeSceneId === "mystery" && key === "chest") return activeProgress > 0.04;
    return true;
  };

  const setParticleScene = (sceneId: SceneId) => {
    const warmScenes: SceneId[] = ["loader", "arrival", "birds", "cats", "ramen"];
    const windMaterial = particles.wind.points.material as THREE.PointsMaterial;
    const fireflyMaterial = particles.fireflies.points.material as THREE.PointsMaterial;
    const moteMaterial = particles.motes.points.material as THREE.PointsMaterial;
    particles.wind.points.visible = true;
    particles.fireflies.points.visible = warmScenes.includes(sceneId);
    particles.motes.points.visible = sceneId === "basement" || sceneId === "mystery";
    windMaterial.opacity = sceneId === "mystery" ? 0.16 : 0.34;
    fireflyMaterial.opacity = sceneId === "ramen" ? 0.34 : 0.72;
    moteMaterial.opacity = sceneId === "mystery" ? 0.72 : 0.58;
  };
  setParticleScene(activeSceneId);

  const resize = () => {
    if (destroyed) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(getRenderQuality(reducedMotion).pixelRatio);
    renderer.setSize(width, height, false);
  };

  const update = (timestamp?: number) => {
    if (destroyed) return;
    timer.update(timestamp);
    const delta = Math.min(timer.getDelta(), 0.05);
    const elapsed = timer.getElapsed();

    for (const field of Object.values(particles)) {
      if (field.points.visible) field.update(elapsed);
    }
    for (const mixer of mixers.values()) mixer.update(delta);
    const bird = groups.osprey.children[0];
    if (bird && quality.proceduralMotion) {
      bird.rotation.z = Math.sin(elapsed * 1.4) * 0.045;
      bird.position.y = Math.sin(elapsed * 1.8) * 0.045;
    }
    const macaw = groups.macaw.children[0];
    if (macaw && quality.proceduralMotion) {
      macaw.rotation.z = Math.sin(elapsed * 1.1 + 1.4) * 0.06;
      macaw.position.y = Math.sin(elapsed * 1.5 + 0.7) * 0.05;
    }
    const cats = groups.cats.children[0];
    if (cats && quality.proceduralMotion) {
      cats.rotation.y = Math.sin(elapsed * 0.4) * 0.015;
      cats.position.y = Math.sin(elapsed * 1.2) * 0.012;
    }
    water.position.y = -2.2 + Math.sin(elapsed * 0.22) * 0.012;
    camera.lookAt(lookTarget.position);
    renderer.render(scene, camera);
  };

  renderer.setAnimationLoop(update);
  window.addEventListener("resize", resize, { passive: true });

  const loadModel = async (key: AssetKey): Promise<THREE.Group> => {
    const resource = await assetManager.load(key);
    const group = groups[key];
    if (MODEL_ROTATIONS[key] !== undefined) group.rotation.y = MODEL_ROTATIONS[key];
    if (!originalModels.has(key)) {
      const model = resource.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z) || 1;
      model.scale.setScalar(MODEL_HEIGHTS[key] / maxDimension);
      model.updateMatrixWorld(true);
      const scaledBounds = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBounds.getCenter(new THREE.Vector3());
      model.position.sub(scaledCenter);
      model.updateMatrixWorld(true);
      model.userData.assetKey = key;
      group.add(model);
      originalModels.set(key, model);
      if (resource.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        for (const clip of resource.animations) mixer.clipAction(clip).play();
        mixers.set(key, mixer);
      }
    }
    group.visible = shouldShowAsset(key);
    return group;
  };

  const preload = async (key: AssetKey) => {
    await assetManager.preload(key);
  };

  const setSceneProgress = (sceneId: SceneId, progress: number) => {
    activeSceneId = sceneId;
    activeProgress = Math.max(0, Math.min(1, progress));
    setParticleScene(sceneId);
    for (const key of ASSET_KEYS) {
      groups[key].visible = groups[key].children.length > 0 && shouldShowAsset(key);
    }
  };

  const registerPointerParallax = (element: HTMLElement) => {
    if (quality.proceduralMotion && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const xTo = gsap.quickTo(cameraRig.rotation, "y", { duration: 0.6, ease: "power3.out" });
      const yTo = gsap.quickTo(cameraRig.rotation, "x", { duration: 0.6, ease: "power3.out" });
      const onPointerMove = (event: PointerEvent) => {
        const x = (event.clientX / window.innerWidth - 0.5) * 0.035;
        const y = (event.clientY / window.innerHeight - 0.5) * -0.025;
        xTo(x);
        yTo(y);
      };
      element.addEventListener("pointermove", onPointerMove, { passive: true });
      return () => element.removeEventListener("pointermove", onPointerMove);
    }
    return () => undefined;
  };

  const pulseChest = () => {
    const group = groups.chest;
    pulseTimeline?.kill();
    pulseTimeline = gsap.timeline({ defaults: { ease: "power2.out" } });
    const knock = (position: number, direction: number) => {
      pulseTimeline
        ?.to(group.position, { x: direction * 0.025, y: 0.08, duration: 0.07 }, position)
        .to(group.rotation, { z: direction * 0.05, x: -direction * 0.03, duration: 0.07 }, position)
        .to(group.scale, { x: 1.045, y: 1.045, z: 1.045, duration: 0.07 }, position)
        .to(group.position, { x: 0, y: 0, duration: 0.14 }, position + 0.07)
        .to(group.rotation, { z: 0, x: 0, duration: 0.14 }, position + 0.07)
        .to(group.scale, { x: 1, y: 1, z: 1, duration: 0.14 }, position + 0.07);
    };
    knock(0, 1);
    knock(0.3, -1);
    knock(0.6, 1);
    pulseTimeline
      .to(basement, { intensity: 1.45, duration: 0.08 }, 0)
      .to(basement, { intensity: SCENE_VISUALS.mystery.basementIntensity, duration: 0.32 }, 0.18)
      .to(renderer, { toneMappingExposure: 0.68, duration: 0.08 }, 0)
      .to(renderer, { toneMappingExposure: SCENE_VISUALS.mystery.exposure, duration: 0.42 }, 0.22);
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    pulseTimeline?.kill();
    renderer.setAnimationLoop(null);
    window.removeEventListener("resize", resize);
    for (const mixer of mixers.values()) {
      mixer.stopAllAction();
      const root = mixer.getRoot();
      mixer.uncacheRoot(root);
    }
    mixers.clear();
    assetManager.dispose();
    timer.dispose();
    for (const field of Object.values(particles)) disposeObject(field.points);
    for (const object of [water, horizon]) disposeObject(object);
    renderer.dispose();
    scene.clear();
  };

  return {
    scene,
    camera,
    cameraRig,
    lookTarget,
    renderer,
    lights: { ambient, sun, warm, basement, hemisphere },
    groups,
    loadModel,
    preload,
    setSceneProgress,
    registerPointerParallax,
    pulseChest,
    destroy,
  };
}
