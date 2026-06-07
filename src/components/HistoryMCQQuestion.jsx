import { useState, useRef, useEffect } from "react";

function formatYear(y) {
  if (y == null) return "?";
  if (y < 0) return `${Math.abs(y)} BC`;
  return String(y);
}

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function yearMatches(input, year) {
  const s = input.trim();
  if (year < 0) {
    // Accept "287 BC", "287BC", "-287"
    const bcMatch = s.match(/^(\d+)\s*bc$/i);
    if (bcMatch) return -parseInt(bcMatch[1], 10) === year;
    return parseInt(s, 10) === year;
  }
  return parseInt(s, 10) === year;
}

export default function HistoryMCQQuestion({ question, onAnswer, isExpert, s }) {
  const [selected, setSelected] = useState(null);
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { if (isExpert) inputRef.current?.focus(); }, [isExpert]);

  const isYear = question.answerKey === "year";
  const correctVal = isYear
    ? question.correct.year
    : question.correct[question.answerKey];

  // MCQ mode
  function choose(opt) {
    if (selected !== null) return;
    setSelected(opt);
    setTimeout(() => onAnswer(opt === correctVal), 1200);
  }

  // Expert mode
  function submit() {
    if (submitted || !value.trim()) return;
    const correct = isYear
      ? yearMatches(value, correctVal)
      : normalize(value) === normalize(String(correctVal));
    setWasCorrect(correct);
    setSubmitted(true);
    setTimeout(() => onAnswer(correct), 1400);
  }

  function optionState(opt) {
    if (selected === null) return "";
    if (opt === correctVal) return "correct";
    if (opt === selected) return "wrong";
    return "faded";
  }

  const placeholder = isYear ? s.historyTypeYear : s.historyTypeAnswer;
  const correctLabel = isYear ? formatYear(correctVal) : String(correctVal);

  return (
    <div className="question-card">
      <p className="question-prompt">{question.prompt}</p>

      {isExpert ? (
        <div className="type-answer-wrap">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            disabled={submitted}
            placeholder={placeholder}
            className={`type-input ${submitted ? (wasCorrect ? "type-input--correct" : "type-input--wrong") : ""}`}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          {!submitted ? (
            <button onClick={submit} className="btn btn--primary type-submit" disabled={!value.trim()}>
              {s.submitBtn}
            </button>
          ) : (
            <div className={`type-feedback ${wasCorrect ? "type-feedback--correct" : "type-feedback--wrong"}`} aria-live="assertive">
              {wasCorrect ? s.historyCorrect : s.historyWrongAnswer(correctLabel)}
            </div>
          )}
        </div>
      ) : (
        <div className="options-grid" role="group" aria-label="Answer options">
          {question.options.map((opt) => {
            const state = optionState(opt);
            const label = isYear ? formatYear(opt) : opt;
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
      )}

      {(selected !== null || submitted) && question.description && (
        <div className="history-description" aria-live="polite">
          {question.description}
        </div>
      )}
    </div>
  );
}
