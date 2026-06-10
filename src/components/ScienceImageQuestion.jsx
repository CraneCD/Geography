import { useState } from "react";
import { useWikiImage } from "../hooks/useWikiImage";

function WikiImage({ wikiTitle, alt }) {
  const { src, status } = useWikiImage(wikiTitle);
  const [errorSrc, setErrorSrc] = useState(null);
  const failed = status === "failed" || (src && errorSrc === src);

  if (status === "loaded" && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className="science-img"
        onError={() => setErrorSrc(src)}
      />
    );
  }

  return (
    <div className="science-img-placeholder">
      {failed ? "Image unavailable" : "Loading..."}
    </div>
  );
}

export default function ScienceImageQuestion({ question, onAnswer, s }) {
  const [selected, setSelected] = useState(null);

  function choose(opt) {
    if (selected !== null) return;
    setSelected(opt);
    const correct = opt === question.correct.name;
    setTimeout(() => onAnswer(correct), 1400);
  }

  function optionClass(opt) {
    if (selected === null) return "option-btn option-btn--default";
    if (opt === question.correct.name) return "option-btn option-btn--correct";
    if (opt === selected) return "option-btn option-btn--wrong";
    return "option-btn option-btn--faded";
  }

  const feedback = selected !== null
    ? (selected === question.correct.name
        ? (s?.historyCorrect ?? "Correct!")
        : (s?.historyWrongAnswer?.(question.correct.name) ?? `The answer was ${question.correct.name}`))
    : null;

  return (
    <div className="question-card">
      <p className="question-prompt">{question.prompt}</p>

      <WikiImage
        wikiTitle={question.wikiTitle}
        alt={selected !== null ? question.correct.name : "Mystery subject"}
      />

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
          className={`type-feedback ${selected === question.correct.name ? "type-feedback--correct" : "type-feedback--wrong"}`}
          aria-live="assertive"
        >
          {feedback}
        </div>
      )}
    </div>
  );
}
