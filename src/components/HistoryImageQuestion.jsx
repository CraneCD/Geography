import { useState, useEffect } from "react";

// Module-level cache so repeated questions don't re-fetch
const wikiImageCache = new Map();

async function fetchWikiThumbnail(wikiTitle) {
  if (wikiImageCache.has(wikiTitle)) return wikiImageCache.get(wikiTitle);
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  // Prefer originalimage (full size) over thumbnail (often too small)
  const imgUrl = data?.originalimage?.source ?? data?.thumbnail?.source ?? null;
  wikiImageCache.set(wikiTitle, imgUrl);
  return imgUrl;
}

function HistoryImage({ wikiTitle, alt, className }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!wikiTitle) { setFailed(true); return; }
    let cancelled = false;
    setSrc(null);
    setFailed(false);

    fetchWikiThumbnail(wikiTitle)
      .then((url) => {
        if (!cancelled) {
          if (url) setSrc(url);
          else setFailed(true);
        }
      })
      .catch(() => { if (!cancelled) setFailed(true); });

    return () => { cancelled = true; };
  }, [wikiTitle]);

  if (failed) {
    return (
      <div className={`history-img-fallback ${className ?? ""}`} aria-label={alt}>
        <span style={{ fontSize: "3rem" }}>🖼️</span>
      </div>
    );
  }

  if (!src) {
    return <div className="history-img-placeholder" aria-hidden="true" style={{ width: "100%", minHeight: 200 }} />;
  }

  return (
    <img
      src={src}
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
          wikiTitle={question.wikiTitle}
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
