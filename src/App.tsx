import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CreditsPanel } from "./components/CreditsPanel";
import { ExperienceErrorBoundary } from "./components/ExperienceErrorBoundary";
import { LoaderOverlay } from "./components/LoaderOverlay";
import { NarrativeOverlay } from "./components/NarrativeOverlay";
import { StaticStory } from "./components/StaticStory";
import { StoryProgress } from "./components/StoryProgress";
import { STORY_SCENES } from "./data/story";
import { createStoryTimeline } from "./experience/animation/createStoryTimeline";
import { createWorld } from "./experience/runtime/createWorld";
import type { AssetKey, AssetProgress, ExperienceState, SceneId, StoryScene, WorldRuntime } from "./experience/types";

const INITIAL_PROGRESS: AssetProgress = {
  url: "",
  label: "Preparando la isla",
  loaded: 0,
  total: 1,
  percent: 0,
};

gsap.registerPlugin(useGSAP);

function AppContent() {
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [runtime, setRuntime] = useState<WorldRuntime | null>(null);
  const [state, setState] = useState<ExperienceState>("booting");
  const [isReady, setIsReady] = useState(false);
  const [activeScene, setActiveScene] = useState<SceneId>("loader");
  const [progress, setProgress] = useState<AssetProgress>(INITIAL_PROGRESS);
  const [failedAsset, setFailedAsset] = useState<AssetKey | undefined>();
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [chestSignal, setChestSignal] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;
    let nextRuntime: WorldRuntime;

    try {
      nextRuntime = createWorld(canvas, {
        onProgress: setProgress,
        onAssetError: (key) => {
          if (cancelled) return;
          setFailedAsset(key);
          setState(key === "house" ? "error" : "degraded");
        },
      });
      setRuntime(nextRuntime);
      setState("loading");
      void nextRuntime.loadModel("house").then(() => {
        if (cancelled) return;
        setProgress((current) => ({ ...current, label: "La casa está despierta", percent: 100, loaded: current.total }));
        setIsReady(true);
        setState("ready");
      }).catch(() => {
        if (!cancelled) setState("error");
      });
    } catch {
      setState("error");
    }

    return () => {
      cancelled = true;
      nextRuntime?.destroy();
      setRuntime(null);
    };
  }, []);

  useEffect(() => {
    if (!runtime || !shellRef.current) return undefined;
    return runtime.registerPointerParallax(shellRef.current);
  }, [runtime]);

  useGSAP((_, contextSafe) => {
    if (!runtime || !isReady || !shellRef.current) return undefined;
    const handleSceneChange = (scene: StoryScene) => {
      setActiveScene(scene.id);
      setState((current) => current === "complete" && scene.id !== "mystery" ? "ready" : current);
      if (import.meta.env.VITE_E2E === "true") {
        window.setTimeout(() => runtime.renderer.setAnimationLoop(null), 250);
      }
      const required = [...scene.assets, ...(scene.preload ?? [])];
      for (const key of required) {
        void runtime.loadModel(key).catch(() => undefined);
      }
    };
    const safeSceneChange = contextSafe ? contextSafe(handleSceneChange) : handleSceneChange;
    const handleComplete = () => {
      setState("complete");
      if (import.meta.env.VITE_E2E === "true") runtime.renderer.setAnimationLoop(null);
    };
    const safeComplete = contextSafe ? contextSafe(handleComplete) : handleComplete;
    const story = createStoryTimeline({
      root: shellRef.current,
      runtime,
      onSceneChange: safeSceneChange,
      onComplete: safeComplete,
    });
    return story.cleanup;
  }, { scope: shellRef, dependencies: [runtime, isReady], revertOnUpdate: true });

  const retryAsset = useCallback(() => {
    if (!runtime || !failedAsset) return;
    const key = failedAsset;
    setFailedAsset(undefined);
    setState("loading");
    void runtime.loadModel(key).then(() => {
      setState("ready");
      setIsReady(true);
    }).catch(() => {
      setFailedAsset(key);
      setState(key === "house" ? "error" : "degraded");
    });
  }, [failedAsset, runtime]);

  const handleChestTap = useCallback(() => {
    runtime?.pulseChest();
    setChestSignal((value) => value + 1);
  }, [runtime]);

  const activeAssetLabel = failedAsset ? STORY_SCENES.find((scene) => scene.assets.includes(failedAsset))?.title : undefined;

  return (
    <div
      className={`experience-shell theme-${STORY_SCENES.find((scene) => scene.id === activeScene)?.theme ?? "dawn"}`}
      data-state={state}
      data-active-scene={activeScene}
      ref={shellRef}
    >
      <div className="experience-stage" data-render-stage>
        <canvas ref={canvasRef} aria-hidden="true" tabIndex={-1} />
        <div className="stage-vignette" aria-hidden="true" />
      </div>

      <div className="story-scroll" data-story-scroll aria-label="Recorrido narrativo">
        {STORY_SCENES.map((scene) => (
          <section className="story-step" data-story-step data-scene-id={scene.id} key={scene.id} aria-labelledby={`story-step-${scene.id}`}>
            <div className="visually-hidden">
              <h2 id={`story-step-${scene.id}`}>{scene.title}</h2>
              {scene.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ))}
      </div>

      <NarrativeOverlay
        scenes={STORY_SCENES}
        activeScene={activeScene}
        state={state}
        onChestTap={handleChestTap}
        onOpenCredits={() => setCreditsOpen(true)}
      />
      <StoryProgress scenes={STORY_SCENES} activeScene={activeScene} />
      <LoaderOverlay
        state={state}
        progress={progress}
        failedLabel={activeAssetLabel}
        onRetry={failedAsset ? retryAsset : undefined}
      />
      <CreditsPanel open={creditsOpen} onClose={() => setCreditsOpen(false)} />
      <p className="visually-hidden" role="status" aria-live="polite">
        {chestSignal > 0 ? `El cofre ha respondido. Golpe número ${Math.min(3, chestSignal)}.` : ""}
      </p>
      {state === "error" && !runtime ? <StaticStory /> : null}
    </div>
  );
}

function App() {
  return (
    <ExperienceErrorBoundary>
      <AppContent />
    </ExperienceErrorBoundary>
  );
}

export default App;
