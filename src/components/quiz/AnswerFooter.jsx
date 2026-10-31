import { useEffect, useRef } from "react";

/**
 * Feedback shown after every answer: verdict, correct answer, explanation /
 * fun fact, image credit, and a Next button (Enter also works).
 */
export default function AnswerFooter({ question, answer, onNext, isLast, autoAdvance, t }) {
  const nextRef = useRef(null);

  useEffect(() => {
    // Typed answers keep focus in the (now disabled) input: move it to Next.
    if (!autoAdvance) nextRef.current?.focus({ preventScroll: true });
  }, [autoAdvance]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext]);

  const credit = question.media?.page;

  return (
    <div className="answer-footer">
      <div className={`feedback ${answer.correct ? "feedback--correct" : "feedback--wrong"}`} role="status">
        {answer.correct ? (
          t.correct
        ) : (
          <>
            {answer.timedOut && <span className="feedback__timeout">{t.timeUp} </span>}
            {t.answerWas} <strong>{question.correctLabel}</strong>
          </>
        )}
      </div>

      {(question.steps || question.explanation || question.note) && (
        <div className="explanation">
          {question.steps && (
            <>
              <strong className="explanation__title">{t.steps}</strong>
              <ol className="explanation__steps">
                {question.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </>
          )}
          {question.explanation && <p>{question.explanation}</p>}
          {question.note && <p>{question.note}</p>}
        </div>
      )}

      <div className="answer-footer__actions">
        {credit && (
          <a className="image-credit" href={credit} target="_blank" rel="noreferrer noopener">
            {t.imageCredit}
          </a>
        )}
        <button ref={nextRef} type="button" className="btn btn--primary next-btn" onClick={onNext}>
          {isLast ? t.seeResults : t.next}
        </button>
      </div>
    </div>
  );
}
