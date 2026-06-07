import { useState, useRef, useEffect } from "react";
import { countryPaths } from "../data/countryPaths";
import { strings } from "../i18n/strings.jsx";

const W = 400;
const H = 300;

// Normalize for comparison (mirrors TypeAnswer logic)
function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
}
const ALIASES = {
  "united states": ["usa", "us", "america", "united states of america"],
  "united kingdom": ["uk", "great britain", "britain"],
  "democratic republic of the congo": ["drc", "dr congo", "congo kinshasa"],
  "czech republic": ["czechia"],
  "russia": ["russian federation"],
};
function isCorrect(input, answer) {
  const n = normalize(input);
  const a = normalize(answer);
  if (n === a) return true;
  return (ALIASES[a] || []).some((x) => normalize(x) === n);
}

function ShapeDisplay({ code, state }) {
  const path = countryPaths[code];
  const fill = state === "correct" ? "#16a34a" : state === "wrong" ? "#dc2626" : "#3b82f6";
  if (!path) return <div className="shape-loading">Shape unavailable</div>;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="shape-svg" role="img" aria-hidden="true">
      <path d={path} fill={fill} stroke="#1e3a8a" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ── Multiple-choice variant ─────────────────────────────────────────────────
function ShapeMultiChoice({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);

  function choose(option) {
    if (selected) return;
    setSelected(option);
    setTimeout(() => onAnswer(option.code === question.correct.code), 900);
  }

  function optionState(opt) {
    if (!selected) return "";
    if (opt.code === question.correct.code) return "correct";
    if (opt.code === selected.code) return "wrong";
    return "faded";
  }

  return (
    <div className="question-card">
      <p className="question-prompt">{question.prompt}</p>
      <div className="shape-wrap">
        <ShapeDisplay
          code={question.correct.code}
          state={selected ? (selected.code === question.correct.code ? "correct" : "wrong") : ""}
        />
      </div>
      <div className="options-grid" role="group" aria-label="Country name options">
        {question.options.map((opt) => {
          const state = optionState(opt);
          return (
            <button
              key={opt.code}
              onClick={() => choose(opt)}
              className={`option-btn option-btn--${state || "default"}`}
              aria-disabled={!!selected}
              aria-label={`${opt.name}${state === "correct" ? " — correct" : state === "wrong" ? " — incorrect" : ""}`}
            >
              {state === "correct" && <span aria-hidden="true">✓ </span>}
              {state === "wrong" && <span aria-hidden="true">✗ </span>}
              {opt.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Expert / free-type variant ──────────────────────────────────────────────
function ShapeTypeAnswer({ question, onAnswer, s }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function submit() {
    if (submitted || !value.trim()) return;
    const correct = isCorrect(value.trim(), question.correct.name);
    setWasCorrect(correct);
    setSubmitted(true);
    setTimeout(() => onAnswer(correct), 1400);
  }

  return (
    <div className="question-card">
      <p className="question-prompt">{question.prompt}</p>
      <div className="shape-wrap">
        <ShapeDisplay
          code={question.correct.code}
          state={submitted ? (wasCorrect ? "correct" : "wrong") : ""}
        />
      </div>
      <div className="type-answer-wrap">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          disabled={submitted}
          placeholder={s.typeShapePlaceholder}
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
            {wasCorrect ? s.correct : s.wrongAnswer(question.correct.name)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Public component ────────────────────────────────────────────────────────
export default function ShapeQuestion({ question, onAnswer, isExpert, s: sProp }) {
  const s = sProp ?? strings.en;
  return isExpert
    ? <ShapeTypeAnswer question={question} onAnswer={onAnswer} s={s} />
    : <ShapeMultiChoice question={question} onAnswer={onAnswer} />;
}
