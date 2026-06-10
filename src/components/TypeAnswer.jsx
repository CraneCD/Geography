import { useState, useRef, useEffect } from "react";
import FlagImage from "./FlagImage";
import { strings } from "../i18n/strings.jsx";
import { isCorrect } from "../utils/answerMatching";

export default function TypeAnswer({ question, onAnswer, s: sProp }) {
  const s = sProp ?? strings.en;
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const answerText =
    question.type === "flags" ? question.correct.name
    : question.type === "languages" ? question.correct.language
    : question.correct.capital;

  const placeholder =
    question.type === "flags" ? s.typeFlagPlaceholder
    : question.type === "languages" ? s.typeLanguagePlaceholder
    : s.typeCapitalPlaceholder;

  function submit() {
    if (submitted || !value.trim()) return;
    const correct = isCorrect(value.trim(), answerText);
    setWasCorrect(correct);
    setSubmitted(true);
    setTimeout(() => onAnswer(correct), 1400);
  }

  return (
    <div className="question-card">
      {question.type === "flags" ? (
        <>
          <p className="question-prompt">{question.prompt}</p>
          <div className="flag-wrap">
            <FlagImage code={question.flagCode} className="flag-img" />
          </div>
        </>
      ) : (
        <div className="capital-header">
          <FlagImage code={question.flagCode} countryName={question.correct.name} className="flag-thumb" />
          <p className="question-prompt" style={{ marginBottom: 0, textAlign: "left" }}>
            {question.prompt}
          </p>
        </div>
      )}

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
          aria-label="Your answer"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        {!submitted ? (
          <button onClick={submit} className="btn btn--primary type-submit" disabled={!value.trim()}>
            {s.submitBtn}
          </button>
        ) : (
          <div
            className={`type-feedback ${wasCorrect ? "type-feedback--correct" : "type-feedback--wrong"}`}
            aria-live="assertive"
          >
            {wasCorrect ? s.correct : s.wrongAnswer(answerText)}
          </div>
        )}
      </div>
    </div>
  );
}
