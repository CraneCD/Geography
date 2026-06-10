import { useState, useRef } from "react";

// Shared round state machine for all game screens: question index, score,
// results, per-question timer reset, exit confirmation, and (for geography
// practice mode) re-queueing of missed questions at the end of the round.
export function useGameSession({ build, getResultEntry, practice = false }) {
  const [questions, setQuestions] = useState(() => build());
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const missedRef = useRef([]);

  const question = questions[idx];

  function advance(next) {
    setIdx(next);
    setTimerKey((k) => k + 1);
    setTimerPaused(false);
  }

  function handleAnswer(wasCorrect) {
    setTimerPaused(true);
    if (!wasCorrect && practice) missedRef.current.push(question);
    setResults((r) => [...r, getResultEntry(question, wasCorrect)]);
    if (wasCorrect) setScore((s) => s + 1);
    setTimeout(() => {
      const next = idx + 1;
      if (next < questions.length) {
        advance(next);
      } else if (practice && missedRef.current.length > 0) {
        const extras = [...missedRef.current];
        missedRef.current = [];
        setQuestions((q) => [...q, ...extras]);
        advance(next);
      } else {
        setDone(true);
      }
    }, 300);
  }

  function restart() {
    setQuestions(build());
    setIdx(0);
    setScore(0);
    setResults([]);
    setDone(false);
    setTimerKey((k) => k + 1);
    setTimerPaused(false);
    setConfirmExit(false);
    missedRef.current = [];
  }

  return {
    questions,
    question,
    idx,
    score,
    results,
    done,
    timerKey,
    timerPaused,
    confirmExit,
    setConfirmExit,
    handleAnswer,
    restart,
  };
}
