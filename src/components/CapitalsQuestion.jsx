import { useState } from "react";
import FlagImage from "./FlagImage";

export default function CapitalsQuestion({ question, onAnswer }) {
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
      <div className="capital-header">
        <FlagImage
          code={question.flagCode}
          countryName={question.correct.name}
          className="flag-thumb"
        />
        <p className="question-prompt" style={{ marginBottom: 0, textAlign: "left" }}>
          {question.prompt}
        </p>
      </div>

      <div className="options-grid" role="group" aria-label="Capital city options">
        {question.options.map((opt) => {
          const state = optionState(opt);
          return (
            <button
              key={opt.code}
              onClick={() => choose(opt)}
              className={`option-btn option-btn--${state || "default"}`}
              aria-disabled={!!selected}
              aria-label={`${opt.capital}${state === "correct" ? " — correct" : state === "wrong" ? " — incorrect" : ""}`}
            >
              {state === "correct" && <span aria-hidden="true">✓ </span>}
              {state === "wrong" && <span aria-hidden="true">✗ </span>}
              {opt.capital}
            </button>
          );
        })}
      </div>
    </div>
  );
}
