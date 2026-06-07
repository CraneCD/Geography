import { useState } from "react";
import FlagImage from "./FlagImage";
import { strings } from "../i18n/strings.jsx";

function fmt(value, type) {
  if (type === "population") {
    if (value >= 1000) return `${(value / 1000).toFixed(2)}B`;
    if (value >= 1) return `${value.toFixed(1)}M`;
    return `${Math.round(value * 1000).toLocaleString()}K`;
  }
  return `${Math.round(value).toLocaleString()} km²`;
}

function CountryCard({ country, type, revealed, isHigher, onClick, disabled, s }) {
  const value = type === "population" ? country.population : country.area;
  return (
    <button
      className={`compare-card${revealed ? (isHigher ? " compare-card--correct" : " compare-card--wrong") : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={`${country.name}${revealed ? `, ${fmt(value, type)}` : ""}`}
    >
      <div className="compare-flag">
        <FlagImage code={country.code} countryName={country.name} className="compare-flag-img" />
      </div>
      <div className="compare-name">{country.name}</div>
      {revealed ? (
        <div className="compare-value">{fmt(value, type)}</div>
      ) : (
        <div className="compare-unknown">?</div>
      )}
      {revealed && (
        <div className="compare-verdict">
          {isHigher
            ? <span aria-hidden="true">{s.higher}</span>
            : <span aria-hidden="true">{s.lower}</span>}
        </div>
      )}
    </button>
  );
}

export default function CompareQuestion({ question, onAnswer, s: sProp }) {
  const s = sProp ?? strings.en;
  const [chosen, setChosen] = useState(null);

  const { left, right, type } = question;
  const leftVal = type === "population" ? left.population : left.area;
  const rightVal = type === "population" ? right.population : right.area;
  const higherSide = leftVal >= rightVal ? "left" : "right";

  function choose(side) {
    if (chosen) return;
    setChosen(side);
    setTimeout(() => onAnswer(side === higherSide), 1200);
  }

  return (
    <div className="question-card compare-card-wrap">
      <p className="question-prompt">{question.prompt}</p>
      <div className="compare-grid">
        <CountryCard country={left} type={type} revealed={!!chosen} isHigher={higherSide === "left"} onClick={() => choose("left")} disabled={!!chosen} s={s} />
        <div className="compare-vs">VS</div>
        <CountryCard country={right} type={type} revealed={!!chosen} isHigher={higherSide === "right"} onClick={() => choose("right")} disabled={!!chosen} s={s} />
      </div>
    </div>
  );
}
