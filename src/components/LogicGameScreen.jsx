import { useState } from "react";
import { buildLogicRound } from "../utils/logicGenerators";
import ProgressBar from "./ProgressBar";
import Timer from "./Timer";
import MathQuestion from "./MathQuestion";
import AngleQuestion from "./AngleQuestion";
import SummaryScreen from "./SummaryScreen";
import { strings } from "../i18n/strings.jsx";

const TYPE_LABELS = {
  arithmetic: { en: "➕ Arithmetic",    es: "➕ Aritmética",      fr: "➕ Arithmétique" },
  fraction:   { en: "½ Fractions & %", es: "½ Fracciones y %",  fr: "½ Fractions et %" },
  sequence:   { en: "🔢 Sequences",     es: "🔢 Secuencias",      fr: "🔢 Suites" },
  angle:      { en: "📐 Angle",         es: "📐 Ángulo",          fr: "📐 Angle" },
  algebra:    { en: "🔣 Solve for x",   es: "🔣 Despeja x",       fr: "🔣 Résoudre x" },
};

export default function LogicGameScreen({ config, onChangeMode }) {
  const { difficulty = "medium", timerSeconds, lang = "en" } = config;
  const isExpert = difficulty === "expert";
  const s = strings[lang] ?? strings.en;

  const [questions, setQuestions] = useState(() => buildLogicRound(config));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  const question = questions[idx];
  const useTimer = timerSeconds != null;

  function handleAnswer(wasCorrect) {
    setTimerPaused(true);
    setResults((r) => [
      ...r,
      {
        wasCorrect,
        type: question.type,
        country: {
          name: question.prompt?.slice(0, 40) ?? question.type,
          code: null,
          capital: "",
          region: "",
        },
      },
    ]);
    if (wasCorrect) setScore((sc) => sc + 1);
    setTimeout(() => {
      const next = idx + 1;
      if (next < questions.length) {
        setIdx(next);
        setTimerKey((k) => k + 1);
        setTimerPaused(false);
      } else {
        setDone(true);
      }
    }, 300);
  }

  function restart() {
    setQuestions(buildLogicRound(config));
    setIdx(0);
    setScore(0);
    setResults([]);
    setDone(false);
    setTimerKey((k) => k + 1);
    setTimerPaused(false);
    setConfirmExit(false);
  }

  function handleBackClick() {
    if (done || idx === 0) { onChangeMode(); return; }
    setConfirmExit(true);
  }

  if (done) {
    return (
      <SummaryScreen
        results={results}
        total={results.length}
        onPlayAgain={restart}
        onChangeMode={onChangeMode}
        s={s}
      />
    );
  }

  if (!question) return null;

  const isMath = ["arithmetic", "fraction", "fractions", "sequence", "sequences", "algebra"].includes(question.type);
  const isAngle = question.type === "angle";

  // Normalise aliased types for label lookup
  const labelKey = question.type === "fractions" ? "fraction" : question.type === "sequences" ? "sequence" : question.type;
  const typeLabel = TYPE_LABELS[labelKey]?.[lang] ?? TYPE_LABELS[labelKey]?.en ?? question.type;

  return (
    <div className="game-screen">
      <div className="game-header">
        <button onClick={handleBackClick} className="back-btn" aria-label={s.backBtn}>
          {s.backBtn}
        </button>
        <ProgressBar current={idx + 1} total={questions.length} score={score} />
        {useTimer && (
          <Timer
            key={timerKey}
            duration={timerSeconds}
            onExpire={() => handleAnswer(false)}
            paused={timerPaused}
          />
        )}
      </div>

      {confirmExit && (
        <div className="confirm-exit-banner" role="alert">
          <span>{s.historyQuitPrompt}</span>
          <button className="btn btn--wrong-sm" onClick={onChangeMode}>{s.historyQuitYes}</button>
          <button className="btn btn--secondary-sm" onClick={() => setConfirmExit(false)}>{s.historyQuitNo}</button>
        </div>
      )}

      <div className="question-type-label">{typeLabel}</div>

      {isMath && (
        <MathQuestion key={idx} question={question} onAnswer={handleAnswer} isExpert={isExpert} s={s} />
      )}
      {isAngle && (
        <AngleQuestion key={idx} question={question} onAnswer={handleAnswer} isExpert={isExpert} s={s} />
      )}
    </div>
  );
}
