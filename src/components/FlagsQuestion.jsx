import { useState } from "react";
import FlagImage from "./FlagImage";

export default function FlagsQuestion({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);

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
        <FlagImage
          code={question.flagCode}
          countryName={question.correct.name}
          className="flag-img"
        />
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
