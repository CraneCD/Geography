import { useState, useEffect } from "react";

// Fetch image as blob so the browser sends no Referer header,
// bypassing Wikimedia's hotlink protection for unknown domains.
function HistoryImage({ url, alt, className }) {
  const [blobSrc, setBlobSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) { setFailed(true); return; }
    let revoked = false;
    let objectUrl = null;

    // Fetch with no Referer header so hotlink-protection doesn't block us.
    // On CORS failure (e.g. strict browser policy), fall back to a plain img src.
    fetch(url, { referrerPolicy: "no-referrer" })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobSrc(objectUrl);
      })
      .catch(() => {
        // CORS or network failure — fall back to direct img src (may still work)
        if (!revoked) setBlobSrc(url);
      });

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (failed) {
    return (
      <div className={`history-img-fallback ${className ?? ""}`} aria-label={alt}>
        <span style={{ fontSize: "3rem" }}>🖼️</span>
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>{alt}</span>
      </div>
    );
  }

  if (!blobSrc) {
    return <div className="history-img-placeholder" aria-hidden="true" style={{ width: "100%", minHeight: 200 }} />;
  }

  return (
    <img
      src={blobSrc}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
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
