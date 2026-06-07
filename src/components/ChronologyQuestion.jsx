import { useState } from "react";

function formatYear(y) {
  if (y == null) return "?";
  if (y < 0) return `${Math.abs(y)} BC`;
  return String(y);
}

function ItemCard({ item, revealed, isEarlier, onClick, disabled }) {
  return (
    <button
      className={`compare-card${revealed ? (isEarlier ? " compare-card--correct" : " compare-card--wrong") : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={`${item.displayName}${revealed ? `, ${formatYear(item.year)}` : ""}`}
    >
      <div className="compare-name" style={{ fontSize: "1rem", padding: "0.5rem 0" }}>
        {item.displayName}
      </div>
      {revealed ? (
        <div className="compare-value">{formatYear(item.year)}</div>
      ) : (
        <div className="compare-unknown">?</div>
      )}
      {revealed && (
        <div className="compare-verdict">
          {isEarlier
            ? <span aria-hidden="true">◀ Earlier</span>
            : <span aria-hidden="true">Later ▶</span>}
        </div>
      )}
    </button>
  );
}

export default function ChronologyQuestion({ question, onAnswer }) {
  const [chosen, setChosen] = useState(null);

  const { left, right } = question;
  const earlierSide = left.year <= right.year ? "left" : "right";

  function choose(side) {
    if (chosen) return;
    setChosen(side);
    setTimeout(() => onAnswer(side === earlierSide), 1200);
  }

  return (
    <div className="question-card compare-card-wrap">
      <p className="question-prompt">{question.prompt}</p>
      <div className="compare-grid">
        <ItemCard item={left} revealed={!!chosen} isEarlier={earlierSide === "left"} onClick={() => choose("left")} disabled={!!chosen} />
        <div className="compare-vs">VS</div>
        <ItemCard item={right} revealed={!!chosen} isEarlier={earlierSide === "right"} onClick={() => choose("right")} disabled={!!chosen} />
      </div>
    </div>
  );
}
