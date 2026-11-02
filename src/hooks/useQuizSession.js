import { useReducer, useEffect, useState, useCallback } from "react";
import { shuffle } from "../lib/random.js";

/**
 * Shared quiz state machine used by every subject.
 *
 *  playing ──answer──▶ answered ──next──▶ playing (next question) … ──▶ done
 *
 * Guarantees:
 *  - exactly one answer is recorded per question (late timer / double clicks are ignored);
 *  - the timer stops the moment an answer is given;
 *  - practice mode re-queues missed questions until they are answered correctly,
 *    while the score counts first attempts only.
 */

let retrySeq = 0;
function retryCopy(q) {
  return {
    ...q,
    key: `${q.key}#retry${++retrySeq}`,
    isRetry: true,
    options: q.options ? shuffle(q.options) : q.options,
  };
}

export function fresh(questions, { review = false } = {}) {
  return { questions, idx: 0, answer: null, results: [], done: false, review, newBest: false };
}

export function reducer(state, action) {
  switch (action.type) {
    case "answer": {
      if (state.answer || state.done) return state; // single-answer guard
      const question = state.questions[state.idx];
      const answer = {
        correct: action.correct,
        given: action.given ?? null,
        givenId: action.givenId ?? null,
        timedOut: Boolean(action.timedOut),
      };
      const questions = !answer.correct && action.practice ? [...state.questions, retryCopy(question)] : state.questions;
      return { ...state, questions, answer, results: [...state.results, { question, ...answer }] };
    }
    case "next": {
      if (!state.answer) return state;
      if (state.idx + 1 < state.questions.length) return { ...state, idx: state.idx + 1, answer: null };
      return { ...state, done: true, newBest: action.newBest ?? false };
    }
    case "restart":
      return fresh(action.questions, { review: action.review });
    default:
      return state;
  }
}

export function scoreOf(results) {
  const firstTries = results.filter((r) => !r.question.isRetry);
  return { correct: firstTries.filter((r) => r.correct).length, total: firstTries.length };
}

/**
 * Auto-advance after a correct choice/compare answer (a little longer when there is a fact
 * to glance at). Wrong answers wait for "Next" so the explanation can be read.
 */
export function autoAdvanceDelay(question, answer) {
  if (!["choice", "compare"].includes(question.kind)) return null;
  if (!answer.correct) return null;
  if (question.steps || question.explanation) return null;
  return question.note ? 2200 : 1100;
}

export function useQuizSession({ build, timer, practice, onRoundComplete }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => fresh(build()));
  const question = state.questions[state.idx];

  const submit = useCallback(
    (result) => dispatch({ type: "answer", practice, ...result }),
    [practice],
  );

  const next = useCallback(() => {
    // Record the best score from the event that finishes the round (not during render).
    const isLast = state.answer && state.idx + 1 >= state.questions.length;
    let newBest = false;
    if (isLast && !state.review && !state.done) {
      const results = [...state.results];
      newBest = onRoundComplete?.(scoreOf(results)) ?? false;
    }
    dispatch({ type: "next", newBest });
  }, [state, onRoundComplete]);

  const restart = useCallback((questions, opts) => dispatch({ type: "restart", questions: questions ?? build(), ...opts }), [build]);

  // ── Timer ──
  const [tick, setTick] = useState({ key: null, left: timer });
  const timerActive = Boolean(timer) && question && !state.answer && !state.done;
  useEffect(() => {
    if (!timerActive) return undefined;
    const start = Date.now();
    const key = question.key + state.idx;
    const id = setInterval(() => {
      const left = Math.max(0, timer - Math.floor((Date.now() - start) / 1000));
      setTick({ key, left });
      if (left <= 0) {
        clearInterval(id);
        dispatch({ type: "answer", practice, correct: false, timedOut: true });
      }
    }, 250);
    return () => clearInterval(id);
  }, [timerActive, question, state.idx, timer, practice]);
  const timeLeft = timer && question ? (tick.key === question.key + state.idx ? tick.left : timer) : null;

  // ── Auto-advance ──
  useEffect(() => {
    if (!state.answer || !question) return undefined;
    const delay = autoAdvanceDelay(question, state.answer);
    if (delay == null) return undefined;
    const id = setTimeout(next, delay);
    return () => clearTimeout(id);
  }, [state.answer, question, next]);

  // ── Prefetch images of the next question ──
  useEffect(() => {
    const upcoming = state.questions[state.idx + 1];
    if (!upcoming) return;
    const srcs = [upcoming.media?.src, ...(upcoming.items ?? []).map((i) => i.media?.src)].filter(Boolean);
    for (const src of srcs) {
      const img = new Image();
      img.src = src;
    }
  }, [state.questions, state.idx]);

  return { ...state, question, timeLeft, submit, next, restart, score: scoreOf(state.results) };
}
