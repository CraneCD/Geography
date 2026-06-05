import { useState, useRef } from "react";
import { buildRound } from "../utils/game";
import ProgressBar from "./ProgressBar";
import Timer from "./Timer";
import FlagsQuestion from "./FlagsQuestion";
import CapitalsQuestion from "./CapitalsQuestion";
import LocateQuestion from "./LocateQuestion";
import TypeAnswer from "./TypeAnswer";
import ShapeQuestion from "./ShapeQuestion";
import LanguagesQuestion from "./LanguagesQuestion";
import CompareQuestion from "./CompareQuestion";
import SummaryScreen from "./SummaryScreen";

const TIMER_SECONDS = { easy: 30, medium: 20, hard: 12, expert: 30 };

export default function GameScreen({ config, onChangeMode }) {
  const { difficulty, practice } = config;

  const [questions, setQuestions] = useState(() => buildRound(config));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const missedRef = useRef([]);

  const isExpert = difficulty === "expert";
  const useTimer = difficulty !== "easy" && !practice && !isExpert;
  const timerDuration = TIMER_SECONDS[difficulty] ?? 20;
  const question = questions[idx];

  function handleAnswer(wasCorrect) {
    setTimerPaused(true);

    if (!wasCorrect && practice) {
      missedRef.current.push(question);
    }

    const entry = { wasCorrect, type: question.type, country: question.correct ?? question.left };
    const newResults = [...results, entry];
    setResults(newResults);
    if (wasCorrect) setScore((s) => s + 1);

    setTimeout(() => {
      const next = idx + 1;
      if (next < questions.length) {
        setIdx(next);
        setTimerKey((k) => k + 1);
        setTimerPaused(false);
      } else if (practice && missedRef.current.length > 0) {
        const extras = [...missedRef.current];
        missedRef.current = [];
        setQuestions((q) => [...q, ...extras]);
        setIdx(next);
        setTimerKey((k) => k + 1);
        setTimerPaused(false);
      } else {
        setDone(true);
      }
    }, 300);
  }

  function restart() {
    setQuestions(buildRound(config));
    setIdx(0);
    setScore(0);
    setResults([]);
    setDone(false);
    setTimerKey((k) => k + 1);
    setTimerPaused(false);
    missedRef.current = [];
  }

  if (done) {
    return (
      <SummaryScreen
        results={results}
        total={results.length}
        onPlayAgain={restart}
        onChangeMode={onChangeMode}
      />
    );
  }

  if (!question) return null;

  return (
    <div className="game-screen">
      <div className="game-header">
        <button
          onClick={onChangeMode}
          className="back-btn"
          aria-label="Back to home"
        >
          ← Home
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
        {practice && <span className="practice-badge">Practice Mode</span>}
      </div>

      <div className="question-type-label" aria-label={`Question type: ${question.type}`}>
        {question.type === "flags" && "🚩 Flags"}
        {question.type === "capitals" && "🏛️ Capitals"}
        {question.type === "locate" && "🗺️ Locate"}
        {question.type === "shapes" && "🔷 Shapes"}
        {question.type === "languages" && "🗣️ Languages"}
        {question.type === "population" && "👥 Population"}
        {question.type === "area" && "📐 Area"}
      </div>

      {question.type === "flags" && !isExpert && (
        <FlagsQuestion key={idx} question={question} onAnswer={handleAnswer} difficulty={difficulty} />
      )}
      {question.type === "flags" && isExpert && (
        <TypeAnswer key={idx} question={question} onAnswer={handleAnswer} />
      )}
      {question.type === "capitals" && !isExpert && (
        <CapitalsQuestion key={idx} question={question} onAnswer={handleAnswer} />
      )}
      {question.type === "capitals" && isExpert && (
        <TypeAnswer key={idx} question={question} onAnswer={handleAnswer} />
      )}
      {question.type === "locate" && (
        <LocateQuestion key={idx} question={question} onAnswer={handleAnswer} />
      )}
      {question.type === "shapes" && (
        <ShapeQuestion key={idx} question={question} onAnswer={handleAnswer} isExpert={isExpert} />
      )}
      {question.type === "languages" && (
        <LanguagesQuestion key={idx} question={question} onAnswer={handleAnswer} />
      )}
      {(question.type === "population" || question.type === "area") && (
        <CompareQuestion key={idx} question={question} onAnswer={handleAnswer} />
      )}
    </div>
  );
}
