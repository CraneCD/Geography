import { useState } from "react";
import { buildScienceRound } from "../utils/scienceGame";
import ProgressBar from "./ProgressBar";
import Timer from "./Timer";
import ScienceImageQuestion from "./ScienceImageQuestion";
import ScienceCompareQuestion from "./ScienceCompareQuestion";
import ElementQuestion from "./ElementQuestion";
import BodyQuestion from "./BodyQuestion";
import SummaryScreen from "./SummaryScreen";
import { strings } from "../i18n/strings.jsx";

const TYPE_LABELS = {
  "animals-photo":   { en: "🦁 Animal ID",      es: "🦁 Identificar Animales", fr: "🦁 Identification Animale" },
  "animals-compare": { en: "⚖️ Animal Compare", es: "⚖️ Comparar Animales",    fr: "⚖️ Comparer Animaux" },
  "elements":        { en: "⚗️ Elements",        es: "⚗️ Elementos",            fr: "⚗️ Éléments" },
  "body":            { en: "🫀 Human Body",      es: "🫀 Cuerpo Humano",        fr: "🫀 Corps Humain" },
  "space-photo":     { en: "🪐 Space: Identify", es: "🪐 Espacio: Identificar", fr: "🪐 Espace: Identifier" },
  "space-compare":   { en: "🌌 Space: Compare",  es: "🌌 Espacio: Comparar",    fr: "🌌 Espace: Comparer" },
};

export default function ScienceGameScreen({ config, onChangeMode }) {
  const { difficulty = "medium", timerSeconds, lang = "en" } = config;
  const s = strings[lang] ?? strings.en;

  const [questions, setQuestions] = useState(() => buildScienceRound(config));
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
    const result = {
      wasCorrect,
      type: question.type,
      country: {
        name: question.correct?.name ?? question.prompt?.slice(0, 40) ?? question.type,
        code: null,
        capital: "",
        region: "",
      },
    };
    setResults((r) => [...r, result]);
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
    setQuestions(buildScienceRound(config));
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

  const typeLabel = TYPE_LABELS[question.type]?.[lang] ?? TYPE_LABELS[question.type]?.en ?? question.type;

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

      {(question.type === "animals-photo" || question.type === "space-photo") && (
        <ScienceImageQuestion key={idx} question={question} onAnswer={handleAnswer} s={s} />
      )}
      {(question.type === "animals-compare" || question.type === "space-compare") && (
        <ScienceCompareQuestion key={idx} question={question} onAnswer={handleAnswer} s={s} />
      )}
      {question.type === "elements" && (
        <ElementQuestion key={idx} question={question} onAnswer={handleAnswer} s={s} />
      )}
      {question.type === "body" && (
        <BodyQuestion key={idx} question={question} onAnswer={handleAnswer} />
      )}
    </div>
  );
}
