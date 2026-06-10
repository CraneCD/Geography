import { buildHistoryRound } from "../utils/historyGame";
import { useGameSession } from "../hooks/useGameSession";
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
  const isExpert = difficulty === "expert";
  const s = strings[lang] ?? strings.en;

  const {
    questions, question, idx, score, results, done,
    timerKey, timerPaused, confirmExit, setConfirmExit, handleAnswer, restart,
  } = useGameSession({
    build: () => buildHistoryRound(config),
    getResultEntry: (q, wasCorrect) => {
      const label = q.correct?.name ?? q.correct?.event ?? q.correct?.invention ?? q.correct?.title ?? "?";
      return { wasCorrect, type: q.type, country: { name: label, code: null, capital: "", region: "" } };
    },
  });

  const useTimer = timerSeconds != null;

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
          <span>{s.historyQuitPrompt}</span>
          <button className="btn btn--wrong-sm" onClick={onChangeMode}>{s.historyQuitYes}</button>
          <button className="btn btn--secondary-sm" onClick={() => setConfirmExit(false)}>{s.historyQuitNo}</button>
        </div>
      )}

      <div className="question-type-label">{typeLabel}</div>

      {(question.type === "people" || question.type === "art") && (
        <HistoryImageQuestion key={idx} question={question} onAnswer={handleAnswer} isExpert={isExpert} s={s} />
      )}
      {(question.type === "events" || question.type === "inventions") && (
        <HistoryMCQQuestion key={idx} question={question} onAnswer={handleAnswer} isExpert={isExpert} s={s} />
      )}
      {question.type === "who-first" && (
        <ChronologyQuestion key={idx} question={question} onAnswer={handleAnswer} s={s} />
      )}
    </div>
  );
}
