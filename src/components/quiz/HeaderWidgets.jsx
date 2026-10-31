/**
 * Notebook-style progress: one segment per question, coloured by its result
 * (correct / wrong / current / to do).
 */
export function ProgressSegments({ questions, results, idx, t }) {
  return (
    <div
      className="segments"
      role="progressbar"
      aria-label={t.questionProgress(idx + 1, questions.length)}
      aria-valuenow={idx + 1}
      aria-valuemin={1}
      aria-valuemax={questions.length}
    >
      {questions.map((q, i) => {
        const r = results[i];
        const state = r ? (r.correct ? "correct" : "wrong") : i === idx ? "current" : "todo";
        return <span key={q.key + i} className={`segments__item segments__item--${state}`} />;
      })}
    </div>
  );
}

/** Countdown chip. Screen readers are told the time only at 10 and 5 seconds, not every tick. */
export function Timer({ left, t }) {
  const announce = left === 10 || left === 5 ? t.secondsLeft(left) : "";
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <>
      <span className={`timer-chip${left <= 5 ? " timer-chip--urgent" : ""}`} role="timer" aria-label={t.secondsLeft(left)}>
        <span aria-hidden="true">{mm}:{ss}</span>
      </span>
      <span className="sr-only" aria-live="polite">{announce}</span>
    </>
  );
}
