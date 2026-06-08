import { useState } from "react";
import NumericInput from "./NumericInput";

// Normalize a fraction or decimal string answer for comparison
function normalizeFraction(str) {
  return String(str).toLowerCase().replace(/\s+/g, "");
}

// Try to evaluate a fraction string like "3/4" → 0.75
function fractionToDecimal(str) {
  const s = str.trim();
  const parts = s.split("/");
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function checkAnswer(userInput, correctAnswer, isFractionVariant) {
  const trimmed = userInput.trim();
  if (trimmed === "") return false;

  if (isFractionVariant) {
    // String comparison first
    if (normalizeFraction(trimmed) === normalizeFraction(String(correctAnswer))) return true;
    // Decimal equivalence within tolerance
    const userDec = fractionToDecimal(trimmed);
    const correctDec = fractionToDecimal(String(correctAnswer));
    if (userDec !== null && correctDec !== null) {
      return Math.abs(userDec - correctDec) < 0.001;
    }
    return false;
  }

  // Numeric comparison
  const userNum = parseFloat(trimmed);
  if (isNaN(userNum)) return false;
  const correctNum = typeof correctAnswer === "number" ? correctAnswer : parseFloat(correctAnswer);
  return userNum === correctNum;
}

function SequenceDisplay({ terms }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        flexWrap: "wrap",
        justifyContent: "center",
        margin: "1rem 0",
      }}
    >
      {terms.map((term, i) => {
        const isLast = i === terms.length - 1;
        return (
          <span
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: "var(--radius)",
                background: isLast ? "var(--primary)" : "var(--surface2)",
                color: isLast ? "#fff" : "var(--text)",
                fontWeight: isLast ? 700 : 500,
                fontSize: "1.1rem",
                minWidth: "2.5rem",
                textAlign: "center",
              }}
            >
              {isLast ? "?" : term}
            </span>
            {i < terms.length - 1 && (
              <span style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>→</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default function MathQuestion({ question, onAnswer, s }) {
  const [selected, setSelected] = useState(null);
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);

  const isMCQ = question.options != null;
  const isFractionVariant = question.variant === "simplify" || question.variant === "fraction";
  const isSequence = question.type === "sequence";
  const isAlgebra = question.type === "algebra";

  function choose(opt) {
    if (selected !== null) return;
    const correct = String(opt) === String(question.correctAnswer);
    setSelected(opt);
    setTimeout(() => onAnswer(correct), 1200);
  }

  function submit() {
    if (submitted || !value.trim()) return;
    const correct = checkAnswer(value, question.correctAnswer, isFractionVariant);
    setWasCorrect(correct);
    setSubmitted(true);
    setTimeout(() => onAnswer(correct), 1400);
  }

  function optionState(opt) {
    if (selected === null) return "default";
    if (String(opt) === String(question.correctAnswer)) return "correct";
    if (String(opt) === String(selected)) return "wrong";
    return "faded";
  }

  const answered = selected !== null || submitted;
  const placeholder = s.logicPlaceholder ?? s.submitBtn ?? "Type answer…";
  const submitLabel = s.logicSubmit ?? s.submitBtn ?? "Submit";
  const correctFeedback = s.logicCorrect ?? s.historyCorrect ?? "Correct!";
  const wrongFeedback = s.logicWrong
    ? s.logicWrong(String(question.correctAnswer))
    : s.historyWrongAnswer
    ? s.historyWrongAnswer(String(question.correctAnswer))
    : `Answer: ${question.correctAnswer}`;

  return (
    <div className="question-card">
      <p className="question-prompt">{question.prompt}</p>

      {isSequence && question.terms && (
        <SequenceDisplay terms={[...question.terms, "next"]} />
      )}

      {isMCQ ? (
        <div className="options-grid" role="group" aria-label="Answer options">
          {question.options.map((opt) => {
            const state = optionState(opt);
            return (
              <button
                key={opt}
                onClick={() => choose(opt)}
                className={`option-btn option-btn--${state}`}
                aria-disabled={selected !== null}
              >
                {state === "correct" && <span aria-hidden="true">✓ </span>}
                {state === "wrong" && <span aria-hidden="true">✗ </span>}
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="type-answer-wrap">
          <NumericInput
            value={value}
            onChange={setValue}
            onSubmit={submit}
            disabled={submitted}
            placeholder={placeholder}
            submitted={submitted}
            wasCorrect={wasCorrect}
          />
          {!submitted ? (
            <button
              onClick={submit}
              className="btn btn--primary type-submit"
              disabled={!value.trim()}
            >
              {submitLabel}
            </button>
          ) : (
            <div
              className={`type-feedback ${wasCorrect ? "type-feedback--correct" : "type-feedback--wrong"}`}
              aria-live="assertive"
            >
              {wasCorrect ? correctFeedback : wrongFeedback}
            </div>
          )}
        </div>
      )}

      {answered && (question.explanation || (isAlgebra && question.steps)) && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem 1rem",
            background: "var(--surface2)",
            borderRadius: "var(--radius)",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
          aria-live="polite"
        >
          {isAlgebra && question.steps && question.steps.length > 0 && (
            <div style={{ marginBottom: question.explanation ? "0.5rem" : 0 }}>
              <strong style={{ color: "var(--text)", display: "block", marginBottom: "0.25rem" }}>
                Steps:
              </strong>
              <ol style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {question.steps.map((step, i) => (
                  <li key={i} style={{ marginBottom: "0.2rem" }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {question.explanation && <p style={{ margin: 0 }}>{question.explanation}</p>}
        </div>
      )}
    </div>
  );
}
