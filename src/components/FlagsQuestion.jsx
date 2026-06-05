import { useState } from "react";
import { flagUrl } from "../utils/game";

export default function FlagsQuestion({ question, onAnswer, difficulty }) {
  const [selected, setSelected] = useState(null);
  const [imgError, setImgError] = useState(false);

  function choose(option) {
    if (selected) return;
    setSelected(option);
    setTimeout(() => onAnswer(option.code === question.correct.code), 900);
  }

  function optionState(option) {
    if (!selected) return "";
    if (option.code === question.correct.code) return "correct";
    if (option.code === selected.code) return "wrong";
    return "faded";
  }

  return (
    <div className="question-card">
      <p className="question-prompt" aria-live="polite">{question.prompt}</p>

      <div className="flag-wrap">
        {!imgError ? (
          <img
            src={flagUrl(question.flagCode)}
            alt={`Flag of ${question.correct.name}`}
            className="flag-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flag-placeholder" aria-label={`Flag of ${question.correct.name} (image unavailable)`}>
            🚩 Flag unavailable
          </div>
        )}
      </div>

      <div className="options-grid" role="group" aria-label="Answer options">
        {question.options.map((opt) => {
          const state = optionState(opt);
          return (
            <button
              key={opt.code}
              onClick={() => choose(opt)}
              className={`option-btn option-btn--${state || "default"}`}
              aria-disabled={!!selected}
              aria-label={`${opt.name}${state === "correct" ? " — correct" : state === "wrong" ? " — incorrect" : ""}`}
            >
              {state === "correct" && <span aria-hidden="true">✓ </span>}
              {state === "wrong" && <span aria-hidden="true">✗ </span>}
              {opt.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
