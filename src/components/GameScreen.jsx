import { buildRound } from "../utils/game";
import { strings } from "../i18n/strings.jsx";
import { useGameSession } from "../hooks/useGameSession";
import ProgressBar from "./ProgressBar";
import Timer from "./Timer";
import CountryChoiceQuestion from "./CountryChoiceQuestion";
import LocateQuestion from "./LocateQuestion";
import TypeAnswer from "./TypeAnswer";
import ShapeQuestion from "./ShapeQuestion";
import LanguagesQuestion from "./LanguagesQuestion";
import CompareQuestion from "./CompareQuestion";
import SummaryScreen from "./SummaryScreen";

export default function GameScreen({ config, onChangeMode }) {
  const { difficulty, practice, timerSeconds, lang = "en" } = config;
  const s = strings[lang] ?? strings.en;

  const {
    questions, question, idx, score, results, done,
    timerKey, timerPaused, handleAnswer, restart,
  } = useGameSession({
    build: () => buildRound(config),
    getResultEntry: (q, wasCorrect) => ({ wasCorrect, type: q.type, country: q.correct ?? q.left }),
    practice,
  });

  const isExpert = difficulty === "expert";
  const useTimer = timerSeconds !== null && difficulty !== "easy" && !isExpert && !practice;
  const timerDuration = timerSeconds ?? 60;

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

  return (
    <div className="game-screen">
      <div className="game-header">
        <button onClick={onChangeMode} className="back-btn" aria-label={s.backBtn}>
          {s.backBtn}
        </button>
        <ProgressBar current={idx + 1} total={questions.length} score={score} />
        {useTimer && (
          <Timer
            key={timerKey}
            duration={timerDuration}
            onExpire={() => handleAnswer(false)}
            paused={timerPaused}
          />
        )}
        {practice && <span className="practice-badge">{s.practiceMode}</span>}
      </div>

      <div className="question-type-label" aria-label={`Question type: ${question.type}`}>
        {s.typeLabels[question.type]}
      </div>

      {(question.type === "flags" || question.type === "capitals") && !isExpert && (
        <CountryChoiceQuestion key={idx} question={question} onAnswer={handleAnswer} />
      )}
      {(question.type === "flags" || question.type === "capitals") && isExpert && (
        <TypeAnswer key={idx} question={question} onAnswer={handleAnswer} s={s} />
      )}
      {question.type === "locate" && (
        <LocateQuestion key={idx} question={question} onAnswer={handleAnswer} s={s} />
      )}
      {question.type === "shapes" && (
        <ShapeQuestion key={idx} question={question} onAnswer={handleAnswer} isExpert={isExpert} s={s} />
      )}
      {question.type === "languages" && !isExpert && (
        <LanguagesQuestion key={idx} question={question} onAnswer={handleAnswer} />
      )}
      {question.type === "languages" && isExpert && (
        <TypeAnswer key={idx} question={question} onAnswer={handleAnswer} s={s} />
      )}
      {(question.type === "population" || question.type === "area") && (
        <CompareQuestion key={idx} question={question} onAnswer={handleAnswer} s={s} />
      )}
    </div>
  );
}
