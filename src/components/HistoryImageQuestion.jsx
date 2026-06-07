import { useState } from "react";

// Image loader that hides until loaded (same pattern as FlagImage)
function HistoryImage({ url, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`history-img-fallback ${className ?? ""}`} aria-label={alt}>
        <span style={{ fontSize: "3rem" }}>🖼️</span>
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>{alt}</span>
      </div>
    );
  }

  return (
    <>
      {!loaded && <div className="history-img-placeholder" aria-hidden="true" style={{ width: "100%", minHeight: 200 }} />}
      <img
        src={url}
        alt={loaded ? alt : ""}
        className={className}
        style={{ display: loaded ? undefined : "none" }}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </>
  );
}

// Used for both "people" (portrait recognition) and "art" (painting recognition)
export default function HistoryImageQuestion({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [showDescription, setShowDescription] = useState(false);

  function choose(opt) {
    if (selected !== null) return;
    setSelected(opt);
    setShowDescription(true);
    const isCorrect = question.type === "people"
      ? opt === question.correct.name
      : opt === question.correct[question.answerKey];
    setTimeout(() => onAnswer(isCorrect), 1400);
  }

  const correctAnswer = question.type === "people"
    ? question.correct.name
    : question.correct[question.answerKey];

  function optionState(opt) {
    if (selected === null) return "";
    if (opt === correctAnswer) return "correct";
    if (opt === selected) return "wrong";
    return "faded";
  }

  const optionLabels = question.type === "people"
    ? question.options.map((o) => o.name)
    : question.options;

  return (
    <div className="question-card">
      <p className="question-prompt">{question.prompt}</p>

      <div className="history-img-wrap">
        <HistoryImage
          url={question.imageUrl}
          alt={selected !== null ? correctAnswer : "Mystery"}
          className="history-img"
        />
      </div>

      <div className="options-grid" role="group" aria-label="Answer options">
        {optionLabels.map((opt) => {
          const state = optionState(opt);
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              className={`option-btn option-btn--${state || "default"}`}
              aria-disabled={selected !== null}
              aria-label={`${opt}${state === "correct" ? " — correct" : state === "wrong" ? " — incorrect" : ""}`}
            >
              {state === "correct" && <span aria-hidden="true">✓ </span>}
              {state === "wrong" && <span aria-hidden="true">✗ </span>}
              {opt}
            </button>
          );
        })}
      </div>

      {showDescription && (
        <div className="history-description" aria-live="polite">
          {question.description}
        </div>
      )}
    </div>
  );
}
