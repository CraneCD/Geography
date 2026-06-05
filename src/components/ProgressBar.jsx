export default function ProgressBar({ current, total, score }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-meta">
        <span>Question <strong>{current}</strong> / {total}</span>
        <span>Score: <strong>{score}</strong></span>
      </div>
      <div className="progress-bar" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
