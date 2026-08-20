import { STORY_SCENES } from "../data/story";

export function StaticStory() {
  return (
    <article className="static-story" aria-label="Historia en texto">
      {STORY_SCENES.slice(1).map((scene) => (
        <section key={scene.id}>
          <p className="eyebrow">{scene.kicker}</p>
          <h2>{scene.title}</h2>
          {scene.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
      <p className="static-story__ending">Algunas islas no se visitan.<br />Te encuentran.</p>
    </article>
  );
}
