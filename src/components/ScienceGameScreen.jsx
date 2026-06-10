import { buildScienceRound } from "../utils/scienceGame";
import { useGameSession } from "../hooks/useGameSession";
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
  const { timerSeconds, lang = "en" } = config;
  const s = strings[lang] ?? strings.en;

  const {
    questions, question, idx, score, results, done,
    timerKey, timerPaused, confirmExit, setConfirmExit, handleAnswer, restart,
  } = useGameSession({
    build: () => buildScienceRound(config),
    getResultEntry: (q, wasCorrect) => ({
      wasCorrect,
      type: q.type,
      country: {
        name: q.correct?.name ?? q.prompt?.slice(0, 40) ?? q.type,
        code: null,
        capital: "",
        region: "",
      },
    }),
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
