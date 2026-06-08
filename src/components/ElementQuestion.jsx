import { useState } from "react";

export default function ElementQuestion({ question, onAnswer, s }) {
  const [selected, setSelected] = useState(null);

  function choose(opt) {
    if (selected !== null) return;
    setSelected(opt);
    const correct = opt === question.answer;
    setTimeout(() => onAnswer(correct), 1200);
  }

  function optionClass(opt) {
    if (selected === null) return "option-btn option-btn--default";
    if (opt === question.answer) return "option-btn option-btn--correct";
    if (opt === selected) return "option-btn option-btn--wrong";
    return "option-btn option-btn--faded";
  }

  const feedback = selected !== null
    ? (selected === question.answer
        ? (s?.historyCorrect ?? "Correct!")
        : (s?.historyWrongAnswer?.(question.answer) ?? `The answer was ${question.answer}`))
    : null;

  return (
    <div className="question-card">
      <div className="element-cell-wrap">
        <div className="element-cell" aria-label={`Prompt: ${question.prompt}`}>
          {question.prompt}
        </div>
      </div>

      <div className="options-grid" role="group" aria-label="Answer options">
        {question.choices.map((opt) => (
          <button
            key={opt}
            className={optionClass(opt)}
            onClick={() => choose(opt)}
            aria-disabled={selected !== null}
          >
            {opt}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`type-feedback ${selected === question.answer ? "type-feedback--correct" : "type-feedback--wrong"}`}
          aria-live="assertive"
        >
          {feedback}
        </div>
      )}
    </div>
  );
}
