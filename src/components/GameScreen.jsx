import { useState, useRef } from "react";
import { buildRound } from "../utils/game";
import { strings } from "../i18n/strings.jsx";
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

export default function GameScreen({ config, onChangeMode }) {
  const { difficulty, practice, timerSeconds, lang = "en" } = config;
  const s = strings[lang] ?? strings.en;

  const [questions, setQuestions] = useState(() => buildRound(config));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const missedRef = useRef([]);

  const isExpert = difficulty === "expert";
  const useTimer = timerSeconds !== null && difficulty !== "easy" && !isExpert && !practice;
  const timerDuration = timerSeconds ?? 60;
  const question = questions[idx];

  function handleAnswer(wasCorrect) {
    setTimerPaused(true);
    if (!wasCorrect && practice) missedRef.current.push(question);
    const entry = { wasCorrect, type: question.type, country: question.correct ?? question.left };
    setResults((r) => [...r, entry]);
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

      {question.type === "flags" && !isExpert && (
        <FlagsQuestion key={idx} question={question} onAnswer={handleAnswer} />
      )}
      {question.type === "flags" && isExpert && (
        <TypeAnswer key={idx} question={question} onAnswer={handleAnswer} s={s} />
      )}
      {question.type === "capitals" && !isExpert && (
        <CapitalsQuestion key={idx} question={question} onAnswer={handleAnswer} />
      )}
      {question.type === "capitals" && isExpert && (
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
