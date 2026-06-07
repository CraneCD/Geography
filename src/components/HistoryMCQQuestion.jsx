import { useState } from "react";

function formatYear(y) {
  if (y < 0) return `${Math.abs(y)} BC`;
  return String(y);
}

export default function HistoryMCQQuestion({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);

  function choose(opt) {
    if (selected !== null) return;
    setSelected(opt);
    const correctVal = question.answerKey === "year"
      ? question.correct.year
      : question.correct[question.answerKey];
    setTimeout(() => onAnswer(opt === correctVal), 1200);
  }

  const correctVal = question.answerKey === "year"
    ? question.correct.year
    : question.correct[question.answerKey];

  function optionState(opt) {
    if (selected === null) return "";
    if (opt === correctVal) return "correct";
    if (opt === selected) return "wrong";
    return "faded";
  }

  return (
    <div className="question-card">
      <p className="question-prompt">{question.prompt}</p>

      <div className="options-grid" role="group" aria-label="Answer options">
        {question.options.map((opt) => {
          const state = optionState(opt);
          const label = question.answerKey === "year" ? formatYear(opt) : opt;
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              className={`option-btn option-btn--${state || "default"}`}
              aria-disabled={selected !== null}
            >
              {state === "correct" && <span aria-hidden="true">✓ </span>}
              {state === "wrong" && <span aria-hidden="true">✗ </span>}
              {label}
            </button>
          );
        })}
      </div>

      {selected !== null && question.description && (
        <div className="history-description" aria-live="polite">
          {question.description}
        </div>
      )}
    </div>
  );
}
