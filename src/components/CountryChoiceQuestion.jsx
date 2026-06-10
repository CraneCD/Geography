import { useState } from "react";
import FlagImage from "./FlagImage";

// Shared multiple-choice question for "flags" (guess the country from its
// flag) and "capitals" (guess the capital). The question's answerKey decides
// which field each option button displays.
export default function CountryChoiceQuestion({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const isCapitals = question.type === "capitals";
  const label = (opt) => opt[question.answerKey];

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
      {isCapitals ? (
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
      ) : (
        <>
          <p className="question-prompt" aria-live="polite">{question.prompt}</p>
          <div className="flag-wrap">
            <FlagImage code={question.flagCode} className="flag-img" />
          </div>
        </>
      )}

      <div className="options-grid" role="group" aria-label={isCapitals ? "Capital city options" : "Answer options"}>
        {question.options.map((opt) => {
          const state = optionState(opt);
          return (
            <button
              key={opt.code}
              onClick={() => choose(opt)}
              className={`option-btn option-btn--${state || "default"}`}
              aria-disabled={!!selected}
              aria-label={`${label(opt)}${state === "correct" ? " — correct" : state === "wrong" ? " — incorrect" : ""}`}
            >
              {state === "correct" && <span aria-hidden="true">✓ </span>}
              {state === "wrong" && <span aria-hidden="true">✗ </span>}
              {label(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
