import { useState, useRef, useEffect } from "react";
import FlagImage from "./FlagImage";
import { strings } from "../i18n/strings.jsx";

function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// Aliases accepted in any language
const ALIASES = {
  "united states": ["usa", "us", "america", "united states of america", "estados unidos", "etats unis", "états unis"],
  "estados unidos": ["usa", "us", "united states", "america", "estados unidos de america"],
  "états-unis": ["usa", "us", "united states", "etats unis", "états unis"],
  "united kingdom": ["uk", "great britain", "britain", "reino unido", "royaume uni"],
  "reino unido": ["uk", "great britain", "britain", "united kingdom", "royaume uni"],
  "royaume-uni": ["uk", "great britain", "united kingdom", "royaume uni"],
  "democratic republic of the congo": ["drc", "dr congo", "congo kinshasa"],
  "república democrática del congo": ["drc", "dr congo", "congo kinshasa", "rd congo"],
  "république démocratique du congo": ["rdc", "dr congo", "congo kinshasa"],
  "czech republic": ["czechia", "república checa", "republique tcheque"],
  "república checa": ["czechia", "czech republic"],
  "république tchèque": ["czechia", "czech republic", "republique tcheque"],
  "russia": ["russian federation", "rusia", "russie"],
  "rusia": ["russia", "russian federation", "russie"],
  "russie": ["russia", "rusia", "russian federation"],
};

function isCorrect(input, answer) {
  const n = normalize(input);
  const a = normalize(answer);
  if (n === a) return true;
  return (ALIASES[answer.toLowerCase()] || []).some((x) => normalize(x) === n);
}

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
