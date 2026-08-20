import type * as THREE from "three";

export type SceneId = "loader" | "arrival" | "birds" | "cats" | "ramen" | "basement" | "mystery";

export type ExperienceState = "booting" | "loading" | "ready" | "degraded" | "complete" | "error";

export type AssetKey = "house" | "osprey" | "macaw" | "cats" | "ramen" | "chest";

export interface StoryScene {
  id: SceneId;
  index: number;
  kicker: string;
  title: string;
  paragraphs: string[];
  hint?: string;
  assets: AssetKey[];
  preload?: AssetKey[];
  theme: "dawn" | "sea" | "interior" | "warm" | "basement" | "mystery";
}

export interface AssetManifestEntry {
  key: AssetKey;
  file: string;
  label: string;
  weight: number;
  scene: SceneId;
}

export interface AssetProgress {
  url: string;
  label: string;
  loaded: number;
  total: number;
  percent: number;
  error?: string;
}

export interface ModelResource {
  key: AssetKey;
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  sourceFile: string;
}

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
}

export interface SceneVisualState {
  camera: CameraPose;
  fogDensity: number;
  exposure: number;
  sunIntensity: number;
  warmIntensity: number;
  basementIntensity: number;
}

export interface WorldRuntime {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  cameraRig: THREE.Group;
  lookTarget: THREE.Object3D;
  renderer: THREE.WebGLRenderer;
  lights: {
    ambient: THREE.AmbientLight;
    sun: THREE.DirectionalLight;
    warm: THREE.PointLight;
    basement: THREE.SpotLight;
    hemisphere: THREE.HemisphereLight;
  };
  groups: Record<AssetKey, THREE.Group>;
  loadModel: (key: AssetKey) => Promise<THREE.Group>;
  preload: (key: AssetKey) => Promise<void>;
  setSceneProgress: (sceneId: SceneId, progress: number) => void;
  registerPointerParallax: (element: HTMLElement) => () => void;
  pulseChest: () => void;
  destroy: () => void;
}
