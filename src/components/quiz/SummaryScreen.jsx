import { useEffect, useRef } from "react";
import { ShapeSvg } from "./Media.jsx";

function medal(pct) {
  if (pct >= 90) return "🏆";
  if (pct >= 70) return "🥈";
  if (pct >= 50) return "🥉";
  return "📚";
}

function MissedItem({ result, t }) {
  const { question, given, timedOut } = result;
  const review = question.review ?? {};
  const yours = timedOut ? t.timedOut : given ?? t.noAnswer;
  return (
    <li className="missed-item">
      {review.flag && <img src={review.flag} alt="" className="missed-flag" />}
      {review.shape && <ShapeSvg d={review.shape} className="missed-shape" />}
      <div>
        <div className="missed-title">{review.title ?? question.prompt}</div>
        <div className="missed-detail">
          {t.correctAnswerLabel}: <strong>{question.correctLabel}</strong>
          {" · "}
          {t.yourAnswerLabel}: <span className="missed-yours">{yours}</span>
        </div>
      </div>
    </li>
  );
}

export default function SummaryScreen({ results, score, practice, newBest, onPlayAgain, onReview, onChangeMode, t }) {
  const headingRef = useRef(null);
  useEffect(() => headingRef.current?.focus(), []);

  const { correct, total } = score;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const missed = results.filter((r) => !r.correct && !r.question.isRetry);

  return (
    <main className="summary">
      <h1 className="summary__title" ref={headingRef} tabIndex={-1}>{t.roundComplete}</h1>

      <div className="summary__score-ring" style={{ "--pct": pct }} role="img" aria-label={t.scoreAria(correct, total, pct)}>
        <div className="score-ring__number" aria-hidden="true">{correct}/{total}</div>
        <div className="score-ring__label" aria-hidden="true">{t.accuracy(pct)}</div>
      </div>
      <div className="summary__medal" aria-hidden="true">{medal(pct)}</div>
      {newBest && <p className="summary__best" role="status">{t.newBest}</p>}
      {practice && <p className="summary__note">{t.firstTryNote}</p>}

      {missed.length > 0 ? (
        <section className="summary__missed" aria-labelledby="missed-heading">
          <h2 id="missed-heading" className="summary__missed-title">{t.missedTitle(missed.length)}</h2>
          <ul className="missed-list">
            {missed.map((r, i) => <MissedItem key={i} result={r} t={t} />)}
          </ul>
        </section>
      ) : (
        <p className="summary__note">{t.perfect}</p>
      )}

      <div className="summary__actions">
        <button type="button" onClick={onPlayAgain} className="btn btn--primary">{t.playAgain}</button>
        {missed.length > 0 && (
          <button type="button" onClick={() => onReview(missed.map((r) => r.question))} className="btn btn--secondary">
            {t.reviewMistakes}
          </button>
        )}
        <button type="button" onClick={onChangeMode} className="btn btn--secondary">{t.changeMode}</button>
      </div>
    </main>
  );
}
