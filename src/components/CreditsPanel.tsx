import { CREDITS } from "../data/credits";

interface CreditsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function CreditsPanel({ open, onClose }: CreditsPanelProps) {
  if (!open) return null;
  return (
    <div className="credits-panel" role="dialog" aria-modal="true" aria-labelledby="credits-title">
      <div className="credits-panel__surface">
        <div className="credits-panel__header">
          <div>
            <p className="eyebrow">Agradecimientos</p>
            <h2 id="credits-title">Los modelos que encontraron la isla</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar créditos">×</button>
        </div>
        <div className="credits-list">
          {CREDITS.map((credit) => (
            <article className="credit" key={credit.title}>
              <h3>{credit.title}</h3>
              <p>{credit.author}</p>
              <p>{credit.license}</p>
              {credit.source ? <a href={credit.source} target="_blank" rel="noreferrer">Ver fuente</a> : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
