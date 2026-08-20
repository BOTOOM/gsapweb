import type { AssetProgress, ExperienceState } from "../experience/types";

interface LoaderOverlayProps {
  state: ExperienceState;
  progress: AssetProgress;
  failedLabel?: string;
  onRetry?: () => void;
}

export function LoaderOverlay({ state, progress, failedLabel, onRetry }: LoaderOverlayProps) {
  const visible = state === "booting" || state === "loading" || state === "error";
  return (
    <div className={`loader-overlay${visible ? " is-visible" : ""}`} data-loader-overlay={visible} aria-hidden={!visible}>
      <div className="loader-overlay__inner" role="status" aria-live="polite">
        <p className="eyebrow">La casa al final del viento</p>
        <p className="loader-overlay__copy">Preparando una escapada a una isla desconocida...</p>
        <div className="loader-progress" aria-label={`Carga ${progress.percent}%`}>
          <div className="loader-progress__track">
            <span className="loader-progress__fill" style={{ transform: `scaleX(${Math.max(0, progress.percent) / 100})` }} />
          </div>
          <div className="loader-progress__meta">
            <span>{failedLabel ? `No se pudo preparar ${failedLabel}` : progress.label}</span>
            <span className="tabular-nums">{progress.percent}%</span>
          </div>
        </div>
        {failedLabel && onRetry ? (
          <button className="text-button" type="button" onClick={onRetry}>
            Reintentar asset
          </button>
        ) : null}
      </div>
    </div>
  );
}
