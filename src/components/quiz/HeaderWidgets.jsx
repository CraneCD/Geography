export function ProgressBar({ current, total, score, t }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-meta">
        <span>{t.questionProgress(current, total)}</span>
        <span>{t.scoreLabel}: <strong>{score}</strong></span>
      </div>
      <div
        className="progress-bar"
        role="progressbar"
        aria-label={t.questionProgress(current, total)}
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Countdown ring. Screen readers are told the time only at 10 and 5 seconds, not every tick. */
export function Timer({ left, total, t }) {
  const pct = Math.round((left / total) * 100);
  const announce = left === 10 || left === 5 ? t.secondsLeft(left) : "";
  return (
    <div className={`timer${left <= 5 ? " timer--urgent" : ""}`}>
      <div className="timer__ring" style={{ "--pct": pct }} role="timer" aria-label={t.secondsLeft(left)}>
        <span aria-hidden="true">{left}s</span>
      </div>
      <span className="sr-only" aria-live="polite">{announce}</span>
    </div>
  );
}
