import { useState, useId } from "react";
import { angleCorrect } from "./generate.js";

const SIZE = 300;
const C = SIZE / 2; // vertex at the centre so reflex angles (>180°) fit too
const RAY = 120;
const ARC = 36;

const rad = (deg) => (deg * Math.PI) / 180;
const point = (deg, r) => ({ x: C + r * Math.cos(rad(deg)), y: C - r * Math.sin(rad(deg)) });

function arcPath(deg) {
  const end = point(deg, ARC);
  return `M ${C + ARC} ${C} A ${ARC} ${ARC} 0 ${deg > 180 ? 1 : 0} 0 ${end.x} ${end.y}`;
}

export default function AngleQuestion({ question, answer, onAnswer, t }) {
  const { degrees, tolerance } = question;
  const [guess, setGuess] = useState(90);
  const sliderId = useId();
  const numberId = useId();
  const locked = Boolean(answer);
  const label = point(degrees / 2, ARC + 18);
  const end = point(degrees, RAY);
  const guessEnd = point(guess, RAY);

  function submit(e) {
    e.preventDefault();
    if (locked) return;
    onAnswer({ correct: angleCorrect(guess, degrees, tolerance), given: `${guess}°` });
  }

  return (
    <>
      <h2 className="question-prompt">{question.prompt}</h2>
      <div className="angle-svg-wrap">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="angle-svg" role="img" aria-label={locked ? t.logic.angleAria(degrees) : t.logic.angleMystery}>
          <circle cx={C} cy={C} r={4} className="angle-vertex" />
          <line x1={C} y1={C} x2={C + RAY} y2={C} className="angle-ray angle-ray--base" />
          <line x1={C} y1={C} x2={end.x} y2={end.y} className="angle-ray" />
          <path d={arcPath(degrees)} className="angle-arc" />
          {locked && <line x1={C} y1={C} x2={guessEnd.x} y2={guessEnd.y} className="angle-ray angle-ray--guess" />}
          <text x={label.x} y={label.y} className={`angle-label${locked ? " angle-label--revealed" : ""}`}>
            {locked ? `${degrees}°` : "?"}
          </text>
        </svg>
      </div>

      {locked ? (
        <div className="angle-result">
          <p>{t.logic.angleResult(guess, degrees)}</p>
          <p className="angle-legend">
            <span className="angle-legend__actual">━ {t.logic.angleActual}</span>
            <span className="angle-legend__guess">┅ {t.logic.angleGuess}</span>
          </p>
          <p className="option-hint">{t.logic.angleTolerance(tolerance)}</p>
        </div>
      ) : (
        <form className="angle-input" onSubmit={submit}>
          <label htmlFor={sliderId} className="sr-only">{t.logic.angleSlider}</label>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={359}
            value={guess}
            onChange={(e) => setGuess(Number(e.target.value))}
            className="angle-slider"
          />
          <label htmlFor={numberId} className="sr-only">{t.logic.angleNumber}</label>
          <input
            id={numberId}
            type="number"
            min={0}
            max={359}
            value={guess}
            onChange={(e) => setGuess(Math.max(0, Math.min(359, Number(e.target.value) || 0)))}
            className="angle-number"
          />
          <span aria-hidden="true">°</span>
          <button type="submit" className="btn btn--primary">{t.submit}</button>
        </form>
      )}
    </>
  );
}
