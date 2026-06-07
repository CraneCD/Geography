import { useState, useRef } from "react";
import { buildHistoryRound } from "../utils/historyGame";
import ProgressBar from "./ProgressBar";
import Timer from "./Timer";
import HistoryImageQuestion from "./HistoryImageQuestion";
import HistoryMCQQuestion from "./HistoryMCQQuestion";
import ChronologyQuestion from "./ChronologyQuestion";
import SummaryScreen from "./SummaryScreen";
import { strings } from "../i18n/strings.jsx";

const TYPE_LABELS = {
  people:         { en: "🧑‍🎨 Famous People",    es: "🧑‍🎨 Personajes Famosos", fr: "🧑‍🎨 Personnages Célèbres" },
  "who-first":    { en: "⏳ Who Came First?",   es: "⏳ ¿Quién fue primero?",  fr: "⏳ Qui est venu en premier ?" },
  events:         { en: "📅 Historical Events", es: "📅 Eventos Históricos",  fr: "📅 Événements Historiques" },
  inventions:     { en: "💡 Inventions",         es: "💡 Inventos",             fr: "💡 Inventions" },
  art:            { en: "🎨 Art",                es: "🎨 Arte",                 fr: "🎨 Art" },
};

const BACK_LABELS = { en: "← Home", es: "← Inicio", fr: "← Accueil" };

export default function HistoryGameScreen({ config, onChangeMode }) {
  const { difficulty = "medium", timerSeconds, lang = "en" } = config;
  const s = strings[lang] ?? strings.en;

  const [questions, setQuestions] = useState(() => buildHistoryRound(config));
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
    const label = question.correct?.name ?? question.correct?.event ?? question.correct?.invention ?? question.correct?.title ?? "?";
    setResults((r) => [...r, { wasCorrect, type: question.type, country: { name: label, code: null, capital: "", region: "" } }]);
    if (wasCorrect) setScore((s) => s + 1);
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
    setQuestions(buildHistoryRound(config));
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
        <button onClick={handleBackClick} className="back-btn" aria-label={BACK_LABELS[lang]}>
          {BACK_LABELS[lang]}
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
          <span>Quit this round?</span>
          <button className="btn btn--wrong-sm" onClick={onChangeMode}>Yes, quit</button>
          <button className="btn btn--secondary-sm" onClick={() => setConfirmExit(false)}>Keep playing</button>
        </div>
      )}

      <div className="question-type-label">{typeLabel}</div>

      {question.type === "people" && (
        <HistoryImageQuestion key={idx} question={question} onAnswer={handleAnswer} />
      )}
      {question.type === "art" && (
        <HistoryImageQuestion key={idx} question={question} onAnswer={handleAnswer} />
      )}
      {question.type === "events" && (
        <HistoryMCQQuestion key={idx} question={question} onAnswer={handleAnswer} />
      )}
      {question.type === "inventions" && (
        <HistoryMCQQuestion key={idx} question={question} onAnswer={handleAnswer} />
      )}
      {question.type === "who-first" && (
        <ChronologyQuestion key={idx} question={question} onAnswer={handleAnswer} />
      )}
    </div>
  );
}
