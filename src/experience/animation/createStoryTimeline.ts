import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCENE_VISUALS, STORY_SCENES } from "../../data/story";
import type { SceneId, StoryScene, WorldRuntime } from "../types";

gsap.registerPlugin(ScrollTrigger);

export interface StoryTimeline {
  timeline: gsap.core.Timeline;
  cleanup: () => void;
}

interface TimelineOptions {
  root: HTMLElement;
  runtime: WorldRuntime;
  onSceneChange: (scene: StoryScene) => void;
  onComplete: () => void;
}

const SCENE_LENGTH = 1;

export function createStoryTimeline({ root, runtime, onSceneChange, onComplete }: TimelineOptions): StoryTimeline {
  const storyScroll = root.querySelector<HTMLElement>("[data-story-scroll]");
  if (!storyScroll) throw new Error("Story scroll container is missing");

  const media = gsap.matchMedia();
  let timeline: gsap.core.Timeline | undefined;
  let activeScene: SceneId | undefined;

  media.add(
    {
      all: "all",
      reduced: "(prefers-reduced-motion: reduce)",
      compact: "(max-width: 767px)",
    },
    (context) => {
      const reduced = Boolean(context.conditions?.reduced);
      const compact = Boolean(context.conditions?.compact);
      const durationScale = reduced ? 0.55 : compact ? 0.75 : 1;
      const background = runtime.scene.background as THREE.Color;
      const fog = runtime.scene.fog as THREE.FogExp2;
      const copies = Array.from(root.querySelectorAll<HTMLElement>("[data-scene-copy]"));
      const loaderCopy = root.querySelector<HTMLElement>("[data-loader-copy]");
      const colors: Record<SceneId, THREE.Color> = {
        loader: new THREE.Color(0x0b2c35),
        arrival: new THREE.Color(0x16505a),
        birds: new THREE.Color(0x236273),
        cats: new THREE.Color(0x3b4d4b),
        ramen: new THREE.Color(0x5c3b30),
        basement: new THREE.Color(0x11282b),
        mystery: new THREE.Color(0x050d12),
      };

      gsap.set(copies, { autoAlpha: 0, y: reduced ? 0 : 18 });
      if (loaderCopy) gsap.set(loaderCopy, { autoAlpha: 1, y: 0 });
      gsap.set(Object.values(runtime.groups), { visible: false });

      timeline = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          id: "story-master",
          trigger: storyScroll,
          start: "top top",
          end: "bottom bottom",
          scrub: reduced ? 0.2 : 0.8,
          invalidateOnRefresh: true,
          markers: import.meta.env.DEV && false,
          onUpdate: (trigger) => {
            const absoluteTime = trigger.progress * STORY_SCENES.length * SCENE_LENGTH;
            const sceneIndex = Math.min(STORY_SCENES.length - 1, Math.floor(absoluteTime));
            const scene = STORY_SCENES[sceneIndex];
            const sceneProgress = absoluteTime - sceneIndex;
            runtime.setSceneProgress(scene.id, sceneProgress);
            if (scene.id !== activeScene) {
              activeScene = scene.id;
              onSceneChange(scene);
            }
          },
          onLeave: onComplete,
          onLeaveBack: () => onSceneChange(STORY_SCENES[0]),
        },
      });

      const addCameraState = (scene: StoryScene, start: number) => {
        const visual = SCENE_VISUALS[scene.id];
        const [x, y, z] = visual.camera.position;
        const [tx, ty, tz] = visual.camera.target;
        const color = colors[scene.id];
        const positionDuration = 0.84 * durationScale;
        timeline
          ?.to(runtime.camera.position, { x, y, z, duration: positionDuration }, start)
          .to(runtime.lookTarget.position, { x: tx, y: ty, z: tz, duration: positionDuration }, start)
          .to(runtime.camera, {
            fov: visual.camera.fov ?? runtime.camera.fov,
            duration: positionDuration,
            onUpdate: () => runtime.camera.updateProjectionMatrix(),
          }, start)
          .to(fog, { density: visual.fogDensity, duration: 0.62 * durationScale }, start)
          .to(runtime.renderer, { toneMappingExposure: visual.exposure, duration: 0.62 * durationScale }, start)
          .to(runtime.lights.sun, { intensity: visual.sunIntensity, duration: 0.58 * durationScale }, start)
          .to(runtime.lights.warm, { intensity: visual.warmIntensity, duration: 0.58 * durationScale }, start)
          .to(runtime.lights.basement, { intensity: visual.basementIntensity, duration: 0.58 * durationScale }, start)
          .to(background, { r: color.r, g: color.g, b: color.b, duration: 0.7 * durationScale }, start);
      };

      timeline.addLabel("loader", 0);
      if (loaderCopy) {
        timeline.to(loaderCopy, { autoAlpha: 1, duration: 0.2 * durationScale }, 0);
        timeline.to(loaderCopy, { autoAlpha: 0, y: reduced ? 0 : -8, duration: 0.18 * durationScale }, 0.82);
      }
      addCameraState(STORY_SCENES[0], 0);

      STORY_SCENES.slice(1).forEach((scene, index) => {
        const start = (index + 1) * SCENE_LENGTH;
        const previousCopy = copies[index - 1];
        const currentCopy = copies[index];
        timeline?.addLabel(scene.id, start);
        addCameraState(scene, start);
        if (previousCopy) {
          timeline?.to(previousCopy, { autoAlpha: 0, y: reduced ? 0 : -9, duration: 0.18 * durationScale }, start - 0.08);
        }
        if (currentCopy) {
          timeline?.to(currentCopy, { autoAlpha: 1, y: 0, duration: 0.28 * durationScale }, start + 0.08);
        }
      });

      const house = runtime.groups.house;
      const osprey = runtime.groups.osprey;
      const macaw = runtime.groups.macaw;
      const cats = runtime.groups.cats;
      const ramen = runtime.groups.ramen;
      const chest = runtime.groups.chest;

      timeline
        ?.set(house.position, { x: -1.25, y: 0, z: 0 }, "arrival")
        .fromTo(house.scale, { x: 0.86, y: 0.86, z: 0.86 }, { x: 1, y: 1, z: 1, duration: 0.7 * durationScale }, "arrival+=0.04")
        .to(house.rotation, { y: -Math.PI / 2, duration: 0.94 * durationScale }, "arrival")
        .set(osprey.position, { x: -7, y: 3.7, z: -1.4 }, "birds")
        .set(osprey.scale, { x: 0.8, y: 0.8, z: 0.8 }, "birds")
        .to(osprey.position, { x: 7, y: 4.7, z: 0.6, duration: 0.78 * durationScale }, "birds+=0.07")
        .to(osprey.rotation, { y: -0.18, z: 0.1, duration: 0.78 * durationScale }, "birds+=0.07")
        .set(macaw.position, { x: 7, y: 4.3, z: -0.2 }, "birds+=0.22")
        .set(macaw.scale, { x: 0.72, y: 0.72, z: 0.72 }, "birds+=0.22")
        .to(macaw.position, { x: -6.6, y: 5.2, z: 1, duration: 0.7 * durationScale }, "birds+=0.3")
        .to(macaw.rotation, { y: 0.26, z: -0.12, duration: 0.7 * durationScale }, "birds+=0.3")
        .set(cats.position, { x: 0.2, y: -0.35, z: 0.35 }, "cats")
        .set(cats.scale, { x: 0.86, y: 0.86, z: 0.86 }, "cats")
        .to(cats.position, { y: 0, z: 0, duration: 0.6 * durationScale }, "cats+=0.06")
        .to(cats.rotation, { y: THREE.MathUtils.degToRad(50), duration: 0.62 * durationScale }, "cats+=0.1")
        .set(ramen.position, { x: 0, y: -0.6, z: 0.2 }, "ramen")
        .set(ramen.scale, { x: 0.7, y: 0.7, z: 0.7 }, "ramen")
        .to(ramen.scale, { x: 1, y: 1, z: 1, duration: 0.4 * durationScale }, "ramen+=0.12")
        .to(ramen.position, { y: -0.1, duration: 0.42 * durationScale }, "ramen+=0.12")
        .set(chest.position, { x: 0, y: -0.5, z: 0 }, "basement")
        .set(chest.scale, { x: 0.82, y: 0.82, z: 0.82 }, "basement")
        .to(chest.scale, { x: 1, y: 1, z: 1, duration: 0.5 * durationScale }, "basement+=0.08")
        .to(chest.position, { y: 0, duration: 0.5 * durationScale }, "basement+=0.08")
        .to(chest.rotation, { y: Math.PI * 0.44, duration: 0.72 * durationScale }, "basement+=0.2")
        .to(chest.rotation, { z: 0.035, duration: 0.07 * durationScale }, "mystery+=0.22")
        .to(chest.rotation, { z: -0.035, duration: 0.07 * durationScale }, "mystery+=0.34")
        .to(chest.rotation, { z: 0.028, duration: 0.07 * durationScale }, "mystery+=0.46")
        .to(chest.rotation, { z: 0, duration: 0.18 * durationScale }, "mystery+=0.58")
        .to(runtime.renderer, { toneMappingExposure: 0.46, duration: 0.36 * durationScale }, "mystery+=0.7");

      activeScene = STORY_SCENES[0].id;
      onSceneChange(STORY_SCENES[0]);
    },
  );

  runtime.setSceneProgress("loader", 0);
  ScrollTrigger.refresh();

  if (import.meta.env.DEV && timeline) {
    (window as typeof window & { __storyDebug?: { timeline: gsap.core.Timeline; runtime: WorldRuntime } }).__storyDebug = { timeline, runtime };
  }

  return {
    timeline: timeline!,
    cleanup: () => {
      media.revert();
      timeline?.scrollTrigger?.kill();
      timeline?.kill();
      if (import.meta.env.DEV) delete (window as typeof window & { __storyDebug?: unknown }).__storyDebug;
    },
  };
}
