import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { ASSET_MANIFEST, assetUrl } from "../../data/assets";
import type { AssetKey, AssetProgress, ModelResource } from "../types";
import { disposeObject } from "./disposeResource";

export type AssetProgressListener = (progress: AssetProgress) => void;
export type AssetErrorListener = (key: AssetKey, error: unknown) => void;

export class AssetManager {
  private readonly manager: THREE.LoadingManager;
  private readonly loader: GLTFLoader;
  private readonly resources = new Map<AssetKey, ModelResource>();
  private readonly pending = new Map<AssetKey, Promise<ModelResource>>();
  private readonly onProgress: AssetProgressListener;
  private readonly onError: AssetErrorListener;

  constructor(onProgress: AssetProgressListener, onError: AssetErrorListener) {
    THREE.Cache.enabled = true;
    this.onProgress = onProgress;
    this.onError = onError;
    this.manager = new THREE.LoadingManager();
    this.manager.onStart = (url, loaded, total) => {
      this.emitProgress(url, loaded, total);
    };
    this.manager.onProgress = (url, loaded, total) => {
      this.emitProgress(url, loaded, total);
    };
    this.manager.onError = (url) => {
      const key = this.keyFromUrl(url);
      if (key) this.onError(key, new Error(`Unable to load ${url}`));
    };
    this.loader = new GLTFLoader(this.manager);
    this.loader.setMeshoptDecoder(MeshoptDecoder);
  }

  async load(key: AssetKey): Promise<ModelResource> {
    const cached = this.resources.get(key);
    if (cached) return cached;

    const current = this.pending.get(key);
    if (current) return current;

    const promise = new Promise<ModelResource>((resolve, reject) => {
      const url = assetUrl(key);
      this.loader.load(
        url,
        (gltf) => {
          const resource = this.prepareResource(key, gltf);
          this.resources.set(key, resource);
          resolve(resource);
        },
        (event) => {
          const total = event.total || ASSET_MANIFEST[key].weight;
          const loaded = event.total ? event.loaded : Math.min(ASSET_MANIFEST[key].weight, event.loaded);
          this.onProgress({
            url,
            label: ASSET_MANIFEST[key].label,
            loaded,
            total,
            percent: Math.round((loaded / total) * 100),
          });
        },
        (error) => {
          this.onError(key, error);
          reject(error);
        },
      );
    });

    this.pending.set(key, promise);
    promise.then(
      () => this.pending.delete(key),
      () => this.pending.delete(key),
    );
    return promise;
  }

  async preload(key: AssetKey): Promise<void> {
    await this.load(key);
  }

  dispose(): void {
    for (const resource of this.resources.values()) {
      disposeObject(resource.scene);
      for (const clip of resource.animations) clip.resetDuration();
    }
    this.resources.clear();
    this.pending.clear();
  }

  private prepareResource(key: AssetKey, gltf: GLTF): ModelResource {
    gltf.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = true;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        if (!material) continue;
        material.needsUpdate = true;
      }
    });

    return {
      key,
      scene: gltf.scene,
      animations: gltf.animations,
      sourceFile: ASSET_MANIFEST[key].file,
    };
  }

  private emitProgress(url: string, loaded: number, total: number): void {
    const key = this.keyFromUrl(url);
    if (!key) return;
    const safeTotal = total || ASSET_MANIFEST[key].weight;
    this.onProgress({
      url,
      label: ASSET_MANIFEST[key].label,
      loaded,
      total: safeTotal,
      percent: Math.round(Math.min(1, loaded / safeTotal) * 100),
    });
  }

  private keyFromUrl(url: string): AssetKey | undefined {
    return (Object.keys(ASSET_MANIFEST) as AssetKey[]).find((key) => url.endsWith(ASSET_MANIFEST[key].file));
  }
}
