import type { SceneId, StoryScene } from "../experience/types";

interface StoryProgressProps {
  scenes: StoryScene[];
  activeScene: SceneId;
}

export function StoryProgress({ scenes, activeScene }: StoryProgressProps) {
  return (
    <nav className="story-progress" aria-label="Progreso de la historia">
      <span className="story-progress__label">{String(Math.max(0, scenes.findIndex((scene) => scene.id === activeScene))).padStart(2, "0")}</span>
      <span className="story-progress__rule" aria-hidden="true">
        <span style={{ transform: `scaleX(${Math.max(0, scenes.findIndex((scene) => scene.id === activeScene)) / (scenes.length - 1)})` }} />
      </span>
      <span className="story-progress__label">06</span>
    </nav>
  );
}
