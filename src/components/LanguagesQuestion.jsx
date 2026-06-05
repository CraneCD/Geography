import { useState } from "react";
import FlagImage from "./FlagImage";

export default function LanguagesQuestion({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);

  function choose(opt) {
    if (selected) return;
    setSelected(opt);
    setTimeout(() => onAnswer(opt === question.correct.language), 900);
  }

  function optionState(opt) {
    if (!selected) return "";
    if (opt === question.correct.language) return "correct";
    if (opt === selected) return "wrong";
    return "faded";
  }

  return (
    <div className="question-card">
      <div className="capital-header">
        <FlagImage code={question.correct.code} className="flag-thumb" />
        <p className="question-prompt">{question.prompt}</p>
      </div>
      <div className="options-grid" role="group" aria-label="Language options">
        {question.options.map((opt) => {
          const state = optionState(opt);
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              className={`option-btn option-btn--${state || "default"}`}
              aria-disabled={!!selected}
              aria-label={`${opt}${state === "correct" ? " — correct" : state === "wrong" ? " — incorrect" : ""}`}
            >
              {state === "correct" && <span aria-hidden="true">✓ </span>}
              {state === "wrong" && <span aria-hidden="true">✗ </span>}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
