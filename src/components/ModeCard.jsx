export default function ModeCard({ icon, title, description, onClick, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`mode-card ${highlight ? "mode-card--highlight" : ""}`}
      aria-label={`Play ${title} mode`}
    >
      <span className="mode-card__icon" aria-hidden="true">{icon}</span>
      <h2 className="mode-card__title">{title}</h2>
      <p className="mode-card__desc">{description}</p>
    </button>
  );
}
