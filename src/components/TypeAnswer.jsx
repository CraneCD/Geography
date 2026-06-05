import { useState, useRef, useEffect } from "react";
import FlagImage from "./FlagImage";

// Normalize for comparison: lowercase, strip diacritics, trim punctuation/spaces
function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// Allow common aliases
const ALIASES = {
  "united states": ["usa", "us", "america", "united states of america"],
  "united kingdom": ["uk", "great britain", "britain"],
  "democratic republic of the congo": ["drc", "dr congo", "congo kinshasa"],
  "czechia": ["czech republic"],
  "czech republic": ["czechia"],
  "russia": ["russian federation"],
  "south korea": ["korea"],
  "north korea": ["dprk"],
  "iran": ["persia"],
  "syria": ["syrian arab republic"],
  "tanzania": ["united republic of tanzania"],
  "bolivia": ["plurinational state of bolivia"],
  "venezuela": ["bolivarian republic of venezuela"],
  "washington dc": ["washington", "dc"],
  "washington dc": ["washington dc", "washington d.c."],
};

function isCorrect(input, answer) {
  const normInput = normalize(input);
  const normAnswer = normalize(answer);
  if (normInput === normAnswer) return true;
  const aliases = ALIASES[normAnswer] || [];
  return aliases.some((a) => normalize(a) === normInput);
}

export default function TypeAnswer({ question, onAnswer }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const answerText =
    question.type === "flags" ? question.correct.name : question.correct.capital;

  function submit() {
    if (submitted || !value.trim()) return;
    const correct = isCorrect(value.trim(), answerText);
    setWasCorrect(correct);
    setSubmitted(true);
    setTimeout(() => onAnswer(correct), 1400);
  }

  function handleKey(e) {
    if (e.key === "Enter") submit();
  }

  return (
    <div className="question-card">
      {question.type === "flags" ? (
        <>
          <p className="question-prompt">{question.prompt}</p>
          <div className="flag-wrap">
            <FlagImage
              code={question.flagCode}
              countryName={question.correct.name}
              className="flag-img"
            />
          </div>
        </>
      ) : (
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
      )}

      <div className="type-answer-wrap">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          disabled={submitted}
          placeholder={question.type === "flags" ? "Type the country name…" : "Type the capital city…"}
          className={`type-input ${submitted ? (wasCorrect ? "type-input--correct" : "type-input--wrong") : ""}`}
          aria-label="Your answer"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />

        {!submitted ? (
          <button
            onClick={submit}
            className="btn btn--primary type-submit"
            disabled={!value.trim()}
          >
            Submit
          </button>
        ) : (
          <div
            className={`type-feedback ${wasCorrect ? "type-feedback--correct" : "type-feedback--wrong"}`}
            aria-live="assertive"
          >
            {wasCorrect ? (
              <><span aria-hidden="true">✓</span> Correct!</>
            ) : (
              <><span aria-hidden="true">✗</span> Answer: <strong>{answerText}</strong></>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
