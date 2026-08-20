import type { SceneId, StoryScene } from "../experience/types";

interface NarrativeOverlayProps {
  scenes: StoryScene[];
  activeScene: SceneId;
  state: "booting" | "loading" | "ready" | "degraded" | "complete" | "error";
  onChestTap: () => void;
  onOpenCredits: () => void;
}

export function NarrativeOverlay({ scenes, activeScene, state, onChestTap, onOpenCredits }: NarrativeOverlayProps) {
  const loader = scenes[0];
  const storyScenes = scenes.slice(1);
  const isMystery = activeScene === "mystery";
  return (
    <div className="narrative-layer">
      <div className="narrative-layer__topline">
        <span className="topline-mark" aria-hidden="true" />
        <span>Isla desconocida</span>
        <span className="topline-status">{state === "degraded" ? "Modo degradado" : "Una historia en seis escenas"}</span>
      </div>

      <div className="loader-copy" data-loader-copy aria-hidden={activeScene !== "loader"}>
        <p className="eyebrow">{loader.kicker}</p>
        <p className="loader-copy__title">{loader.title}</p>
        {loader.hint ? <p className="scroll-hint">{loader.hint}<span aria-hidden="true">↓</span></p> : null}
      </div>

      <div className="scene-copies" aria-live="polite">
        {storyScenes.map((scene) => {
          const active = scene.id === activeScene;
          return (
            <article
              className="scene-copy"
              data-scene-copy
              data-scene-id={scene.id}
              data-active={active}
              aria-hidden={!active}
              key={scene.id}
            >
              <p className="eyebrow">{scene.kicker}</p>
              <h1>{scene.title}</h1>
              <div className="scene-copy__body">
                {scene.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              {scene.id === "mystery" ? (
                <p className="scene-copy__ending">Algunas islas no se visitan.<br />Te encuentran.</p>
              ) : null}
              {scene.hint ? <p className="scene-copy__hint">{scene.hint}</p> : null}
              {isMystery && scene.id === "mystery" ? (
                <button className="chest-button" type="button" onClick={onChestTap}>
                  <span className="chest-button__pulse" aria-hidden="true" />
                  Repetir los tres golpes
                </button>
              ) : null}
            </article>
          );
        })}
      </div>

      <button className="credits-button" type="button" onClick={onOpenCredits}>
        Créditos
      </button>
    </div>
  );
}
